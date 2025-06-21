// File: functions/api/resend-confirmation.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Cho phép gọi từ bất kỳ đâu
    "Content-Type": "application/json",
  };

  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email là bắt buộc." }), {
        status: 400,
        headers,
      });
    }

    // Khởi tạo Supabase admin client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Sử dụng API của Supabase để gửi lại mail xác nhận
    // Quan trọng: type phải là 'signup'
    const { data, error } = await supabase.auth.admin.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      console.error("Lỗi khi gửi lại mail từ Supabase:", error);
      // Không nên hiển thị lỗi chi tiết cho người dùng
      return new Response(
        JSON.stringify({
          message: "Không thể gửi lại mail. Vui lòng thử lại sau.",
        }),
        { status: 500, headers }
      );
    }

    // Trả về thông báo thành công
    return new Response(
      JSON.stringify({ message: "Đã gửi lại email xác nhận thành công." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Lỗi server:", e);
    return new Response(
      JSON.stringify({ message: "Đã có lỗi xảy ra phía máy chủ." }),
      { status: 500, headers }
    );
  }
};
