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
      JSON.stringify({ message: "Missing authorization header." }),
      { status: 401, headers }
    );
  }
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ message: "Invalid token." }), {
      status: 401,
      headers,
    });
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

    // UPDATED: Always insert a new record for each attempt.
    const { data, error } = await supabase.from("quiz_results").insert({
      user_id: user.id, // Use the user ID from the token
      quiz_id: quizId,
      score: score,
    });

    if (error) {
      console.error("Supabase error saving quiz result:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Kết quả đã được lưu thành công." }),
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
