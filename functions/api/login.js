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
      return new Response(
        JSON.stringify({ message: "Email hoặc mật khẩu không chính xác." }),
        { status: 401, headers }
      );
    }

    if (!data || !data.user || !data.session) {
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

    if (!data.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          message:
            "Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email.",
        }),
        { status: 403, headers }
      );
    }

    // *** FIX: Merge user data with the access token from the session ***
    const userPayload = {
      ...data.user,
      ...data.user.user_metadata,
      access_token: data.session.access_token, // Crucial for future API calls
    };

    return new Response(
      JSON.stringify({ message: "Đăng nhập thành công!", user: userPayload }),
      { status: 200, headers }
    );
  } catch (e) {
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
