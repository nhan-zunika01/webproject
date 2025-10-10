// File: functions/api/update-profile.js
// Allows an authenticated user to update their profile information in Cloudflare D1.

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
    const { name_user, phone_user } = await request.json();
    if (!name_user || !phone_user) {
      return new Response(JSON.stringify({ message: "Họ tên và số điện thoại là bắt buộc." }), { status: 400, headers });
    }

    // 3. Update the user's profile in D1
    await env.DB.prepare(
        "UPDATE users SET name_user = ?, phone_user = ? WHERE id = ?"
      )
      .bind(name_user, phone_user, userId)
      .run();

    return new Response(JSON.stringify({ message: "Cập nhật thông tin thành công!" }), { status: 200, headers });

  } catch (e) {
    console.error("Server error updating profile:", e);
    return new Response(JSON.stringify({ message: "Đã xảy ra lỗi khi cập nhật thông tin." }), { status: 500, headers });
  }
};