// File: functions/api/save-quiz-result.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase environment variables are not set.");
    return new Response(
      JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }),
      { status: 500, headers }
    );
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // You need an Authorization header to identify the user
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
      {
        status: 401,
        headers,
      }
    );
  }

  try {
    const { quizId, score } = await request.json();

    if (!quizId || score === undefined) {
      return new Response(
        JSON.stringify({
          message: "Dữ liệu không hợp lệ. Cần quizId và score.",
        }),
        { status: 400, headers }
      );
    }

    // Always insert a new record for each attempt.
    const { data, error } = await supabase.from("quiz_results").insert({
      user_id: user.id, // Use the user ID from the token
      quiz_id: quizId,
      score: score,
    });

    if (error) {
      console.error("Supabase error saving quiz result:", error);
      // CẬP NHẬT: Trả về thông báo lỗi chi tiết từ Supabase để dễ gỡ lỗi
      return new Response(
        JSON.stringify({ message: `Lỗi Cơ sở dữ liệu: ${error.message}` }),
        {
          status: 500,
          headers,
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Kết quả đã được lưu thành công." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Server error saving quiz result:", e);
    // CẬP NHẬT: Trả về thông báo lỗi chi tiết từ máy chủ
    return new Response(
      JSON.stringify({ message: `Lỗi Máy chủ: ${e.message}` }),
      { status: 500, headers }
    );
  }
};

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
