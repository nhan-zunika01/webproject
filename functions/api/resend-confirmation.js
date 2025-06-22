// File: functions/api/resend-confirmation.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Supabase environment variables are not set for resend confirmation."
    );
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email là bắt buộc." }), {
        status: 400,
        headers,
      });
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.admin.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      console.error("Lỗi khi gửi lại mail từ Supabase:", error);
      return new Response(
        JSON.stringify({
          message: "Không thể gửi lại mail. Vui lòng thử lại sau.",
        }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ message: "Đã gửi lại email xác nhận thành công." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Resend confirmation server error:", e);
    return new Response(
      JSON.stringify({ message: "Đã có lỗi xảy ra phía máy chủ." }),
      { status: 500, headers }
    );
  }
};
