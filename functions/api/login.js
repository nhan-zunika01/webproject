// File: functions/api/login.js
// Handles user login, password verification, and JWT generation against a D1 database.

/**
 * Hashes a password using SHA-256.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} The hexadecimal representation of the hash.
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a JWT using the Web Crypto API (HMAC SHA-256).
 * @param {object} payload The JWT payload.
 * @param {string} secret The secret key for signing.
 * @returns {Promise<string>} The generated JWT.
 */
async function createJwt(payload, secret) {
    const header = {
        alg: "HS256",
        typ: "JWT",
    };

    // Base64url encode the header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signatureInput));
    // Convert the signature to a Base64url string
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${signatureInput}.${signature}`;
}

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Check for required environment variables
  if (!env.DB || !env.JWT_SECRET) {
    console.error("Server configuration error: D1 binding or JWT_SECRET is missing.");
    return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  try {
    const { email_user, password_account } = await request.json();

    if (!email_user || !password_account) {
      return new Response(JSON.stringify({ message: "Vui lòng cung cấp email và mật khẩu." }), { status: 400, headers });
    }

    // Fetch user from D1 database
    const user = await env.DB.prepare(
        `SELECT id, email, password_hash, name_account, name_user, phone_user, email_confirmed_at
         FROM users WHERE email = ?`
      )
      .bind(email_user)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ message: "Email hoặc mật khẩu không chính xác." }), { status: 401, headers });
    }

    // Verify the password
    const password_hash = await hashPassword(password_account);
    if (password_hash !== user.password_hash) {
      return new Response(JSON.stringify({ message: "Email hoặc mật khẩu không chính xác." }), { status: 401, headers });
    }

    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ message: "Tài khoản của bạn chưa được xác thực." }), { status: 403, headers });
    }

    // Create JWT payload
    const payload = {
      sub: user.id, // Subject (user ID)
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24-hour expiration
    };

    const token = await createJwt(payload, env.JWT_SECRET);

    // Prepare user data to return to client (omitting sensitive fields)
    const userPayload = {
      id: user.id,
      email: user.email,
      name_account: user.name_account,
      name_user: user.name_user,
      phone_user: user.phone_user,
      access_token: token,
    };

    return new Response(JSON.stringify({ message: "Đăng nhập thành công!", user: userPayload }), { status: 200, headers });

  } catch (e) {
    console.error("Login server error:", e);
    return new Response(JSON.stringify({ message: "Đã xảy ra lỗi hệ thống." }), { status: 500, headers });
  }
};

export const onRequest = onRequestPost;