// File: functions/api/reset-password.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async (context) => {
  const { request, env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ (Supabase).",
      }),
      { status: 500, headers }
    );
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ (Turnstile).",
      }),
      { status: 500, headers }
    );
  }

  try {
    const { email, turnstileToken } = await request.json();

    if (!email || !turnstileToken) {
      return new Response(JSON.stringify({ message: "Email và CAPTCHA là bắt buộc." }), {
        status: 400,
        headers,
      });
    }

    // 1. Xác thực Turnstile Token
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', turnstileToken);
    formData.append('remoteip', request.headers.get('CF-Connecting-IP'));

    const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
    });

    const turnstileOutcome = await turnstileResult.json();

    if (!turnstileOutcome.success) {
        return new Response(JSON.stringify({ 
            message: "Xác thực bảo mật thất bại. Vui lòng thử lại." 
        }), { status: 403, headers });
    }

    // 2. Gửi mail reset qua Supabase
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    // Tự động xác định URL chuyển hướng dựa trên request hiện tại
    // Điều này giúp code chạy đúng trên cả localhost và production domain
    const url = new URL(request.url);
    const origin = url.origin; // Ví dụ: https://agrinova.pages.dev hoặc http://127.0.0.1:8788
    const redirectTo = `${origin}/update-password.html`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("Supabase password reset error:", error.message);
      // Để bảo mật, không nên báo chi tiết lỗi cho người dùng nếu email không tồn tại
      // Nhưng trong giai đoạn dev, có thể log ra console server
    }

    return new Response(
      JSON.stringify({
        message: "Yêu cầu đã được tiếp nhận.",
      }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Password reset server error:", e);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi hệ thống." }),
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