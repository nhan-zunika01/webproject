// File: functions/api/login.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async (context) => {
  const { request, env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // 1. Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables are not set.");
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const { email_user, password_account } = await request.json();

    if (!email_user || !password_account) {
      return new Response(
        JSON.stringify({ message: "Vui lòng cung cấp email và mật khẩu." }),
        { status: 400, headers }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email_user,
      password: password_account,
    });

    if (error) {
      // This handles incorrect credentials
      return new Response(
        JSON.stringify({ message: "Email hoặc mật khẩu không chính xác." }),
        { status: 401, headers }
      );
    }

    // 2. Guard against null user object
    if (!data || !data.user) {
      console.error(
        "Supabase authentication returned no user data without an error."
      );
      return new Response(
        JSON.stringify({
          message: "Không thể xác thực người dùng. Vui lòng thử lại.",
        }),
        { status: 500, headers }
      );
    }

    // 3. Add backend check for verified email
    if (!data.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          message:
            "Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email.",
        }),
        { status: 403, headers } // 403 Forbidden is more appropriate
      );
    }

    // Merge user_metadata for easy access on the frontend
    const user = {
      ...data.user,
      ...data.user.user_metadata,
    };

    return new Response(
      JSON.stringify({ message: "Đăng nhập thành công!", user: user }),
      { status: 200, headers }
    );
  } catch (e) {
    // 4. More informative catch block
    console.error("Lỗi máy chủ khi đăng nhập:", e);
    return new Response(
      JSON.stringify({
        message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại.",
      }),
      { status: 500, headers }
    );
  }
};

export const onRequest = onRequestPost;
