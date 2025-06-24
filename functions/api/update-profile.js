// File: functions/api/update-profile.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Kiểm tra thông tin kết nối Supabase
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Biến môi trường Supabase chưa được thiết lập.");
    return new Response(
      JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Lấy người dùng từ token trong header Authorization để bảo mật
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Yêu cầu thiếu thông tin xác thực." }),
        { status: 401, headers }
      );
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ message: "Mã xác thực không hợp lệ." }),
        { status: 401, headers }
      );
    }

    // Lấy dữ liệu mới từ body của yêu cầu
    const { name_user, phone_user } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!name_user || !phone_user) {
      return new Response(
        JSON.stringify({ message: "Họ tên và số điện thoại là bắt buộc." }),
        { status: 400, headers }
      );
    }

    // Sử dụng quyền admin để cập nhật metadata của người dùng
    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          name_user: name_user,
          phone_user: phone_user,
        },
      });

    if (updateError) {
      console.error("Lỗi cập nhật từ Supabase:", updateError);
      throw new Error("Không thể cập nhật thông tin người dùng.");
    }

    // Trả về phản hồi thành công
    return new Response(
      JSON.stringify({
        message: "Cập nhật thông tin thành công!",
      }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Lỗi máy chủ khi cập nhật hồ sơ:", e);
    return new Response(
      JSON.stringify({ message: e.message || "Đã xảy ra lỗi hệ thống." }),
      { status: 500, headers }
    );
  }
};

// Xử lý các yêu cầu CORS preflight
export const onRequest = (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  return onRequestPost(context);
};
