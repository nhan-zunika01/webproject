// File: functions/api/save-quiz-result.js
// Saves a user's quiz result to Cloudflare D1.

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
        return null;
    }
}

export const onRequest = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  if (!env.DB || !env.JWT_SECRET) {
      console.error("Server configuration error: D1 or JWT_SECRET is missing.");
      return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  try {
    // 1. Authenticate user via JWT
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

    // 2. Get data from request body
    const { quizId, score } = await request.json();
    if (!quizId || typeof score !== 'number') {
      return new Response(JSON.stringify({ message: "Dữ liệu không hợp lệ. Cần quizId và score." }), { status: 400, headers });
    }

    // 3. Insert the new quiz result into D1
    await env.DB.prepare(
        "INSERT INTO quiz_results (user_id, quiz_id, score) VALUES (?, ?, ?)"
      )
      .bind(userId, quizId, score)
      .run();

    return new Response(JSON.stringify({ message: "Kết quả đã được lưu thành công." }), { status: 200, headers });

  } catch (e) {
    console.error("Server error saving quiz result:", e);
    return new Response(JSON.stringify({ message: "Đã xảy ra lỗi khi lưu kết quả." }), { status: 500, headers });
  }
};