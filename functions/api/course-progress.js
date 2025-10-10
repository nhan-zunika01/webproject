// File: functions/api/course-progress.js
// Handles getting and saving course progress using Cloudflare D1.

// --- Helper Functions ---

/**
 * Verifies a JWT and returns the payload.
 * @param {string} token The JWT.
 * @param {string} secret The secret key.
 * @returns {Promise<object|null>} The decoded payload or null.
 */
async function verifyJwt(token, secret) {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');
        const signatureInput = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const signatureBuffer = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
        const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(signatureInput));

        if (!isValid) return null;

        return JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
        console.error("JWT verification error:", e);
        return null;
    }
}

export const onRequest = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!env.DB || !env.JWT_SECRET) {
      console.error("Server configuration error: D1 binding or JWT_SECRET is missing.");
      return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  // --- Authenticate user via JWT for both GET and POST ---
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ message: "Yêu cầu thiếu thông tin xác thực." }), { status: 401, headers });
  }
  const token = authHeader.split(" ")[1];
  const decodedPayload = await verifyJwt(token, env.JWT_SECRET);

  if (!decodedPayload || !decodedPayload.sub) {
    return new Response(JSON.stringify({ message: "Mã xác thực không hợp lệ." }), { status: 401, headers });
  }
  const userId = decodedPayload.sub;

  // --- GET: Fetch course progress ---
  if (request.method === "GET") {
    try {
        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");
        if (!courseId) {
            return new Response(JSON.stringify({ message: "courseId is required." }), { status: 400, headers });
        }

        const progress = await env.DB.prepare(
            "SELECT completed_lessons FROM course_progress WHERE user_id = ? AND course_id = ?"
        ).bind(userId, courseId).first();

        // If progress is found, parse the JSON string before sending
        if (progress) {
            const completed_lessons = JSON.parse(progress.completed_lessons || "[]");
            return new Response(JSON.stringify({ completed_lessons }), { status: 200, headers });
        } else {
            // If no record exists, return an empty array
            return new Response(JSON.stringify({ completed_lessons: [] }), { status: 200, headers });
        }
    } catch (e) {
        console.error("Error fetching course progress:", e);
        return new Response(JSON.stringify({ message: "Không thể tải tiến độ khóa học." }), { status: 500, headers });
    }
  }

  // --- POST: Save (upsert) course progress ---
  if (request.method === "POST") {
    try {
        const { courseId, completed_lessons } = await request.json();
        if (!courseId || !Array.isArray(completed_lessons)) {
            return new Response(JSON.stringify({ message: "courseId and a completed_lessons array are required." }), { status: 400, headers });
        }

        const lessonsJson = JSON.stringify(completed_lessons);
        const updatedAt = new Date().toISOString();

        // Use INSERT ON CONFLICT (UPSERT) to create or update the record
        await env.DB.prepare(
            `INSERT INTO course_progress (user_id, course_id, completed_lessons, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id, course_id) DO UPDATE SET
               completed_lessons = excluded.completed_lessons,
               updated_at = excluded.updated_at`
        ).bind(userId, courseId, lessonsJson, updatedAt).run();

        return new Response(JSON.stringify({ message: "Progress saved." }), { status: 200, headers });

    } catch (e) {
        console.error("Error saving course progress:", e);
        return new Response(JSON.stringify({ message: "Không thể lưu tiến độ khóa học." }), { status: 500, headers });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};