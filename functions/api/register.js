// File: functions/api/register.js
// Import thư viện Supabase
import { createClient } from "@supabase/supabase-js";

// Hàm xử lý CORS và các yêu cầu POST
async function handleRequest(request, env) {
  // Cho phép các yêu cầu từ bất kỳ đâu (CORS)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Cloudflare gửi yêu cầu OPTIONS trước để kiểm tra CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Chỉ chấp nhận phương thức POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
      headers,
    });
  }

  // Khởi tạo Supabase client bằng biến môi trường
  // Chúng ta sẽ cài đặt các biến này trong dashboard của Cloudflare
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Lấy dữ liệu từ body của request
  const { email_user, password_account, name_account, name_user, phone_user } =
    await request.json();

  // Gọi hàm signUp của Supabase
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
    return new Response(JSON.stringify({ message: error.message }), {
      status: 400,
      headers,
    });
  }

  // Trả về thông báo thành công
  return new Response(
    JSON.stringify({
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
      user: data.user,
    }),
    { status: 201, headers }
  );
}

// Export hàm onRequest để Cloudflare thực thi
export const onRequest = async (context) => {
  return handleRequest(context.request, context.env);
};
