// File: functions/api/get-quiz-score.js
import { createClient } from "@supabase/supabase-js";

export const onRequestGet = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Sử dụng SERVICE_ROLE_KEY để truy cập ở cấp độ quản trị, được kiểm soát bằng xác thực token
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Biến môi trường Supabase chưa được thiết lập.");
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
    const url = new URL(request.url);
    const quizId = url.searchParams.get("quizId");

    // Lấy người dùng từ token trong header Authorization
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

    if (!quizId) {
      return new Response(JSON.stringify({ message: "Cần có quizId." }), {
        status: 400,
        headers,
      });
    }

    // SỬA LỖI: Truy vấn tất cả kết quả cho người dùng và bài kiểm tra cụ thể để tìm điểm cao nhất.
    const { data, error } = await supabase
      .from("quiz_results")
      .select("score")
      .eq("user_id", user.id) // Sử dụng ID người dùng đã được xác thực
      .eq("quiz_id", quizId);

    if (error) {
      // Không xem "không có hàng nào" là một lỗi nghiêm trọng.
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ high_score: 0 }), {
          status: 200,
          headers,
        });
      }
      throw error;
    }

    // Tính điểm cao nhất từ dữ liệu trả về
    let highScore = 0;
    if (data && data.length > 0) {
      highScore = Math.max(...data.map((result) => result.score));
    }

    return new Response(JSON.stringify({ high_score: highScore }), {
      status: 200,
      headers,
    });
  } catch (e) {
    console.error("Lỗi máy chủ khi lấy điểm bài kiểm tra:", e);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi khi lấy điểm số." }),
      { status: 500, headers }
    );
  }
};

export const onRequest = (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response("Method not allowed", { status: 405 });
};
