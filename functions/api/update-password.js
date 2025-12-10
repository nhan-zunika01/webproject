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
        message: "Lỗi cấu hình phía máy chủ.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { access_token, password } = await request.json();

    if (!access_token || !password) {
      return new Response(
        JSON.stringify({ message: "Thiếu thông tin xác thực hoặc mật khẩu mới." }),
        { status: 400, headers }
      );
    }

    // 1. Xác thực người dùng bằng Access Token gửi lên
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser(access_token);

    if (sessionError || !user) {
      return new Response(
        JSON.stringify({
          message: "Phiên làm việc hết hạn hoặc liên kết không hợp lệ. Vui lòng yêu cầu lại.",
        }),
        { status: 401, headers }
      );
    }

    // 2. Cập nhật mật khẩu bằng quyền Admin (Service Role)
    // Cách này đảm bảo bypass mọi ràng buộc bảo mật phía client nếu có
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