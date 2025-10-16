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
    const { identifier, password_account } = await request.json();

    if (!identifier || !password_account) {
      return new Response(
        JSON.stringify({
          message: "Vui lòng cung cấp email/tên tài khoản và mật khẩu.",
        }),
        { status: 400, headers }
      );
    }

    let email_user = identifier;
    const isEmail = identifier.includes("@");

    if (!isEmail) {
      const { data: user, error: findError } = await supabase
        .from("users")
        .select("email_user")
        .eq("name_account", identifier)
        .single();

      if (findError || !user) {
        return new Response(
          JSON.stringify({
            message: "Tên tài khoản hoặc mật khẩu không chính xác.",
          }),
          { status: 401, headers }
        );
      }
      email_user = user.email_user;
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

    // SỬA LỖI: Gộp dữ liệu người dùng với access_token từ session
    const userPayload = {
      ...data.user,
      ...data.user.user_metadata,
      access_token: data.session.access_token, // Rất quan trọng cho các lệnh gọi API sau này
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
