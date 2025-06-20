// File: functions/api/login.js
// Import thư viện Supabase
import { createClient } from "@supabase/supabase-js";

// Hàm xử lý CORS và các yêu cầu POST
async function handleRequest(request, env) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
      headers,
    });
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { email_user, password_account } = await request.json();

  // Gọi hàm đăng nhập của Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email_user,
    password: password_account,
  });

  if (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 400,
      headers,
    });
  }

  // Lấy thông tin bổ sung từ metadata
  const userProfile = {
    id: data.user.id,
    email_user: data.user.email,
    name_account: data.user.user_metadata.name_account,
    name_user: data.user.user_metadata.name_user,
    phone_user: data.user.user_metadata.phone_user,
    email_confirmed_at: data.user.email_confirmed_at,
  };

  return new Response(
    JSON.stringify({
      message: "Đăng nhập thành công!",
      user: userProfile,
      session: data.session,
    }),
    { status: 200, headers }
  );
}

// Export hàm onRequest để Cloudflare thực thi
export const onRequest = async (context) => {
  return handleRequest(context.request, context.env);
};
