// File: functions/api/update-password.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
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
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Nhận thêm turnstileToken
    const { access_token, password, turnstileToken } = await request.json();

    if (!access_token || !password) {
      return new Response(
        JSON.stringify({ message: "Thiếu thông tin xác thực hoặc mật khẩu mới." }),
        { status: 400, headers }
      );
    }

    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ message: "Thiếu mã xác thực CAPTCHA." }),
        { status: 400, headers }
      );
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

    // 2. Xác thực người dùng bằng Access Token gửi lên
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser(access_token);

    if (sessionError || !user) {
      return new Response(
        JSON.stringify({
          message: "Phiên làm việc hết hạn hoặc liên kết không hợp lệ. Vui lòng yêu cầu lại liên kết đổi mật khẩu.",
        }),
        { status: 401, headers }
      );
    }

    // 3. Cập nhật mật khẩu bằng quyền Admin (Service Role)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ message: "Cập nhật mật khẩu thành công." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Update password server error:", e);
    const errorMessage = e.message || "Lỗi hệ thống.";
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers,
    });
  }
};

export const onRequest = (context) => {
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