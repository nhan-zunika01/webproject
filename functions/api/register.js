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

async function sendVerificationEmail(email, token, env) {
  const verificationLink = `https://your-frontend-url/verify-email?token=${token}`;

  const emailHtml = `
    <h1>Xác nhận địa chỉ email của bạn</h1>
    <p>Cảm ơn bạn đã đăng ký. Vui lòng nhấp vào liên kết bên dưới để xác nhận địa chỉ email của bạn:</p>
    <a href="${verificationLink}">${verificationLink}</a>
    <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Xác nhận email đăng ký",
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Failed to send verification email:", error);
    throw new Error("Could not send verification email.");
  }
}

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.DB || !env.RESEND_API_KEY) {
    console.error("D1 database or Resend API key binding not found.");
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

    if (!email_user || !password_account || !name_account || !name_user) {
        return new Response(JSON.stringify({ message: "Vui lòng điền đầy đủ các trường bắt buộc." }), { status: 400, headers });
    }
    if (password_account.length < 6) {
        return new Response(JSON.stringify({ message: "Mật khẩu phải có ít nhất 6 ký tự." }), { status: 400, headers });
    }

    const password_hash = await hashPassword(password_account);
    const user_id = crypto.randomUUID();
    const verificationToken = crypto.randomUUID();
    const tokenHash = await hashPassword(verificationToken);

    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, name_account, name_user, phone_user, email_verification_token, email_verification_token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(user_id, email_user, password_hash, name_account, name_user, phone_user, tokenHash, tokenExpiry.toISOString())
    .run();

    await sendVerificationEmail(email_user, verificationToken, env);

    return new Response(
      JSON.stringify({
        message: "Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản.",
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