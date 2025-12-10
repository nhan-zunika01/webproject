// File: functions/api/register.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Supabase environment variables are not set for registration."
    );
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ (Supabase). Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  // === THÊM: Kiểm tra Secret Key của Turnstile ===
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("Turnstile Secret Key chưa được thiết lập.");
    return new Response(
      JSON.stringify({ message: "Lỗi cấu hình phía máy chủ (Turnstile)." }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      email_user,
      password_account,
      name_account,
      name_user,
      phone_user,
      turnstileToken // === THÊM: Nhận token từ client ===
    } = await request.json();

    // === THÊM: Xác thực Token với Cloudflare ===
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
    // === KẾT THÚC: Xác thực Turnstile ===

    const { data, error } = await supabase.auth.signUp({
      email: email_user,
      password: password_account,
      options: {
        data: {
          name_account: name_account,
          name_user: name_user,
          phone_user: phone_user,
        },
      },
    });

    if (error) {
      // Check for specific, common errors to provide better feedback
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({ message: "Email này đã được sử dụng." }),
          {
            status: 409, // Conflict
            headers,
          }
        );
      }
      if (error.message.includes("Password should be at least 6 characters")) {
        return new Response(
          JSON.stringify({ message: "Mật khẩu phải có ít nhất 6 ký tự." }),
          {
            status: 400,
            headers,
          }
        );
      }
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers,
      });
    }

    // Return success message
    return new Response(
      JSON.stringify({
        message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
        user: data.user,
      }),
      { status: 201, headers }
    );
  } catch (e) {
    console.error("Registration server error:", e);
    return new Response(
      JSON.stringify({
        message: "Đã xảy ra lỗi hệ thống khi đăng ký. Vui lòng thử lại.",
      }),
      { status: 500, headers }
    );
  }
};

export const onRequest = async (context) => {
  // Handle CORS preflight request
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