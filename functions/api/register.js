// File: functions/api/register.js
// Handles user registration using Cloudflare D1.

/**
 * Hashes a password using the Web Crypto API (SHA-256).
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

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Ensure the D1 database is bound
  if (!env.DB) {
    console.error("D1 database binding not found.");
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const {
      email_user,
      password_account,
      name_account,
      name_user,
      phone_user,
    } = await request.json();

    // Basic input validation
    if (!email_user || !password_account || !name_account || !name_user) {
        return new Response(JSON.stringify({ message: "Vui lòng điền đầy đủ các trường bắt buộc." }), { status: 400, headers });
    }
    if (password_account.length < 6) {
        return new Response(JSON.stringify({ message: "Mật khẩu phải có ít nhất 6 ký tự." }), { status: 400, headers });
    }


    const password_hash = await hashPassword(password_account);
    const user_id = crypto.randomUUID();

    // Insert the new user into the D1 database
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, name_account, name_user, phone_user)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(user_id, email_user, password_hash, name_account, name_user, phone_user)
    .run();

    // Create a user object to return, excluding the password hash.
    const userPayload = {
        id: user_id,
        email: email_user,
        name_account: name_account,
        name_user: name_user,
        phone_user: phone_user
    };

    return new Response(
      JSON.stringify({
        message: "Đăng ký thành công!",
        user: userPayload
      }),
      { status: 201, headers }
    );

  } catch (e) {
    console.error("Registration server error:", e);
    // Check for unique constraint violation (email already exists)
    if (e.message && e.message.includes("UNIQUE constraint failed: users.email")) {
      return new Response(
        JSON.stringify({ message: "Email này đã được sử dụng." }),
        { status: 409, headers } // 409 Conflict
      );
    }
    return new Response(
      JSON.stringify({
        message: "Đã xảy ra lỗi hệ thống khi đăng ký. Vui lòng thử lại.",
      }),
      { status: 500, headers }
    );
  }
};

export const onRequest = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return onRequestPost(context);
};