// File: functions/api/save-quiz-result.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // 1. Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Supabase environment variables are not set for saving quiz results."
    );
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const { userId, quizId, score } = await request.json();

    // 2. Validate input
    if (!userId || !quizId || score === undefined) {
      return new Response(
        JSON.stringify({
          message: "Dữ liệu không hợp lệ. Cần userId, quizId, và score.",
        }),
        { status: 400, headers }
      );
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Use upsert to insert or update the score
    // This will update the score if the user retakes the quiz
    const { data, error } = await supabase
      .from("quiz_results")
      .upsert(
        {
          user_id: userId,
          quiz_id: quizId,
          score: score,
        },
        {
          onConflict: "user_id, quiz_id", // Specify the columns that cause a conflict
        }
      )
      .select(); // Select the data to get the result back

    if (error) {
      console.error("Supabase error saving quiz result:", error);
      throw error; // Let the catch block handle it
    }

    // 4. Return success response
    return new Response(
      JSON.stringify({
        message: "Kết quả đã được lưu thành công.",
        data: data,
      }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Server error saving quiz result:", e);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi hệ thống khi lưu kết quả." }),
      { status: 500, headers }
    );
  }
};

export const onRequest = (context) => {
  // Handle CORS preflight request for OPTIONS method
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  // Handle POST request
  return onRequestPost(context);
};
