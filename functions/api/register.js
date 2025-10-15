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
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  const verificationLink = `https://sotaynongdan.pages.dev/verify-email?token=${token}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kích hoạt tài khoản - Sổ tay nông dân thông minh</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
        color: #333;
        line-height: 1.6;
      }

      .email-wrapper {
        max-width: 640px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        overflow: hidden;
        box-shadow:
          0 20px 40px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.2);
        position: relative;
      }

      .email-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a, #15803d);
        animation: shimmer 3s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        position: relative;
        padding: 50px 40px;
        text-align: center;
        overflow: hidden;
      }

      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
        animation: pulse 4s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.1); opacity: 0.1; }
      }

      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }

      .logo {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 36px;
        box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .header h1 {
        color: white;
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }

      .header .subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        font-weight: 300;
        position: relative;
        z-index: 2;
      }

      .content {
        padding: 60px 40px;
        background: white;
        position: relative;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 40px;
      }

      .welcome-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        color: #166534;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 24px;
        border: 1px solid rgba(34, 197, 94, 0.2);
      }

      .welcome-title {
        font-size: 32px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #0f172a, #334155);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .welcome-description {
        font-size: 18px;
        color: #64748b;
        max-width: 480px;
        margin: 0 auto;
        line-height: 1.7;
      }

      .action-section {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border-radius: 20px;
        padding: 40px;
        margin: 40px 0;
        text-align: center;
        border: 1px solid rgba(148, 163, 184, 0.1);
      }

      .action-text {
        font-size: 16px;
        color: #475569;
        margin-bottom: 32px;
        line-height: 1.6;
      }

      .cta-button {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        text-decoration: none;
        padding: 18px 36px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow:
          0 10px 25px rgba(34, 197, 94, 0.3),
          0 4px 10px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      .cta-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      .cta-button:hover::before {
        left: 100%;
      }

      .cta-button:hover {
        transform: translateY(-3px);
        box-shadow:
          0 15px 35px rgba(34, 197, 94, 0.4),
          0 8px 15px rgba(0, 0, 0, 0.15);
      }

      .cta-button:active {
        transform: translateY(-1px);
      }

      .fallback-section {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 16px;
        padding: 24px;
        margin: 32px 0;
      }

      .fallback-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #92400e;
        margin-bottom: 12px;
        font-size: 15px;
      }

      .fallback-text {
        color: #a16207;
        font-size: 14px;
        margin-bottom: 12px;
      }

      .url-container {
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 12px;
        padding: 16px;
        word-break: break-all;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 13px;
        color: #78716c;
        position: relative;
      }

      .info-section {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 16px;
        padding: 24px;
        margin: 32px 0;
      }

      .info-icon {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        margin-right: 12px;
        vertical-align: middle;
      }

      .info-text {
        color: #1e40af;
        font-size: 14px;
        line-height: 1.5;
        display: inline;
      }

      .footer {
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        padding: 40px;
        text-align: center;
        border-top: 1px solid rgba(148, 163, 184, 0.1);
      }

      .footer-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .signature {
        font-size: 16px;
        color: #475569;
        margin-bottom: 8px;
      }

      .team-name {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
        font-size: 18px;
      }

      .footer-note {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
      }

      .decorative-elements {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .decorative-elements::before,
      .decorative-elements::after {
        content: '';
        position: absolute;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      }

      .decorative-elements::before {
        top: 20%;
        right: -50px;
        animation: float 4s ease-in-out infinite reverse;
      }

      .decorative-elements::after {
        bottom: 30%;
        left: -50px;
        animation: float 3s ease-in-out infinite;
      }

      @media (max-width: 768px) {
        body {
          padding: 10px;
        }

        .email-wrapper {
          border-radius: 16px;
        }

        .header {
          padding: 40px 24px;
        }

        .header h1 {
          font-size: 24px;
        }

        .content {
          padding: 40px 24px;
        }

        .welcome-title {
          font-size: 28px;
        }

        .action-section {
          padding: 32px 24px;
        }

        .cta-button {
          padding: 16px 32px;
        }

        .footer {
          padding: 32px 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="decorative-elements"></div>

      <div class="header">
        <div class="logo-container">
          <div class="logo">🌱</div>
        </div>
        <h1>Sổ tay nông dân thông minh</h1>
        <div class="subtitle">Nền tảng nông nghiệp hiện đại</div>
      </div>

      <div class="content">
        <div class="welcome-section">
          <div class="welcome-badge">
            <span>🎉</span>
            <span>Chào mừng thành viên mới</span>
          </div>
          <h2 class="welcome-title">Tài khoản đã sẵn sàng!</h2>
          <p class="welcome-description">
            Cảm ơn bạn đã tham gia cộng đồng nông dân thông minh. Chỉ còn một bước nữa để bắt đầu hành trình canh tác hiệu quả cùng chúng tôi.
          </p>
        </div>

        <div class="action-section">
          <p class="action-text">
            Để truy cập đầy đủ các tính năng và bắt đầu sử dụng ứng dụng, vui lòng kích hoạt tài khoản của bạn:
          </p>
          <a href="${verificationLink}" class="cta-button">
            <span>🚀</span>
            <span>Kích hoạt tài khoản ngay</span>
          </a>
        </div>

        <div class="info-section">
          <div class="info-icon">i</div>
          <div class="info-text">
            <strong>Lưu ý quan trọng:</strong> Đường link kích hoạt sẽ hết hạn sau 24 giờ kể từ khi nhận email này. Nếu quá thời hạn, bạn có thể đăng ký lại tài khoản mới.
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-content">
          <p class="signature">Trân trọng,</p>
          <div class="team-name">Đội ngũ Sổ tay nông dân thông minh</div>
          <div class="footer-note">
            Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này. Nếu cần hỗ trợ, hãy liên hệ với chúng tôi qua website chính thức.
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
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

    try {
      await sendVerificationEmail(email_user, verificationToken, env);
      return new Response(
        JSON.stringify({
          message: "Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản.",
        }),
        { status: 201, headers }
      );
    } catch (emailError) {
      console.error("Failed to send verification email, but user was created:", emailError);
      return new Response(
        JSON.stringify({
          message: "Tài khoản của bạn đã được tạo, nhưng không thể gửi email xác thực. Vui lòng thử yêu cầu một email mới.",
          userCreated: true,
        }),
        { status: 207, headers } // 207 Multi-Status
      );
    }

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