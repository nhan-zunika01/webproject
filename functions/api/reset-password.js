// File: functions/api/reset-password.js
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

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), {
        status: 400,
        headers,
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Cập nhật quan trọng: Thêm URL chuyển hướng đến trang mới
      redirectTo: "https://your-domain.com/update-password.html",
    });

    // Lưu ý: Bạn cần thay 'https://your-domain.com' bằng tên miền thực tế của trang web khi triển khai.
    // Nếu đang chạy cục bộ, bạn có thể tạm thời bỏ qua hoặc dùng URL localhost.

    if (error) {
      console.error("Supabase password reset error:", error.message);
    }

    return new Response(
      JSON.stringify({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Server error:", e);
    return new Response(
      JSON.stringify({ message: "An internal server error occurred." }),
      {
        status: 500,
        headers,
      }
    );
  }
};
