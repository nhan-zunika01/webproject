// File: functions/api/login.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async (context) => {
  const { request, env } = context;

  // Cấu hình headers cho CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Xử lý yêu cầu OPTIONS của CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // Khởi tạo Supabase client
    // Lưu ý: Đăng nhập nên sử dụng SUPABASE_ANON_KEY thay vì SERVICE_ROLE_KEY
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // Lấy email và mật khẩu từ request body
    const { email_user, password_account } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!email_user || !password_account) {
      return new Response(
        JSON.stringify({ message: "Vui lòng cung cấp email và mật khẩu." }),
        {
          status: 400,
          headers,
        }
      );
    }

    // Gọi hàm đăng nhập của Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email_user,
      password: password_account,
    });

    // Xử lý lỗi từ Supabase (ví dụ: sai mật khẩu)
    if (error) {
      return new Response(
        JSON.stringify({ message: "Email hoặc mật khẩu không chính xác." }),
        {
          status: 401, // Unauthorized
          headers,
        }
      );
    }

    // Gộp thông tin người dùng từ `user_metadata` vào đối tượng user chính
    // để mã frontend có thể truy cập dễ dàng
    const user = {
      ...data.user,
      ...data.user.user_metadata,
    };

    // Trả về thông báo thành công và dữ liệu người dùng
    return new Response(
      JSON.stringify({ message: "Đăng nhập thành công!", user: user }),
      {
        status: 200,
        headers,
      }
    );
  } catch (e) {
    console.error("Lỗi máy chủ khi đăng nhập:", e);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại." }),
      {
        status: 500,
        headers,
      }
    );
  }
};

// Export onRequest để tương thích với các thiết lập Cloudflare
export const onRequest = onRequestPost;
