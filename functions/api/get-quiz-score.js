// File: functions/api/get-quiz-score.js
// Fetches the highest quiz score for a user from Cloudflare D1.

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (request.method !== "GET") {
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

    // 2. Get quizId from URL
    const url = new URL(request.url);
    const quizId = url.searchParams.get("quizId");
    if (!quizId) {
      return new Response(JSON.stringify({ message: "Cần có quizId." }), { status: 400, headers });
    }

    // 3. Fetch the highest score using a D1 aggregate query
    const result = await env.DB.prepare(
        "SELECT MAX(score) as high_score FROM quiz_results WHERE user_id = ? AND quiz_id = ?"
      )
      .bind(userId, quizId)
      .first();

    // If result.high_score is null (no records found), default to 0.
    const highScore = result?.high_score || 0;

    return new Response(JSON.stringify({ high_score: highScore }), { status: 200, headers });

  } catch (e) {
    console.error("Server error getting quiz score:", e);
    return new Response(JSON.stringify({ message: "Đã xảy ra lỗi khi lấy điểm số." }), { status: 500, headers });
  }
};