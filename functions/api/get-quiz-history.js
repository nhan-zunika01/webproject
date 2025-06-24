// File: functions/api/get-quiz-history.js
import { createClient } from "@supabase/supabase-js";

// This function now requires authentication
export const onRequestGet = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase environment variables are not set.");
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // *** FIX: Get user from Authorization token for security ***
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

    // Query using the authenticated user's ID
    const { data, error } = await supabase
      .from("quiz_results")
      .select("quiz_id, score, created_at")
      .eq("user_id", user.id); // Use the validated user.id

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers,
    });
  } catch (e) {
    console.error("Server error getting quiz history:", e);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi khi lấy lịch sử bài làm." }),
      { status: 500, headers }
    );
  }
};

// Handle CORS preflight requests
export const onRequest = (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow Authorization header
      },
    });
  }
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response("Method not allowed", { status: 405 });
};
