// File: functions/api/get-quiz-score.js
import { createClient } from "@supabase/supabase-js";

export const onRequestGet = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // 1. Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error(
      "Supabase environment variables are not set for getting quiz score."
    );
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const quizId = url.searchParams.get("quizId");

    // 2. Validate input from query parameters
    if (!userId || !quizId) {
      return new Response(
        JSON.stringify({ message: "Cần có userId và quizId." }),
        { status: 400, headers }
      );
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // 3. Query the database
    // The RLS policy "Allow individual read access" ensures a user can only fetch their own data.
    // We select the score for the specific user and quiz.
    const { data, error } = await supabase
      .from("quiz_results")
      .select("score")
      .eq("user_id", userId)
      .eq("quiz_id", quizId)
      .single(); // Use .single() to get one record or null

    // 4. Handle different outcomes
    if (error) {
      // "PGRST116" is the error code for "No rows found"
      if (error.code === "PGRST116") {
        // It's not an error, it just means the user hasn't taken the quiz yet.
        return new Response(JSON.stringify({ score: 0 }), {
          status: 200,
          headers,
        });
      }
      // For other errors, throw them to be caught by the catch block
      throw error;
    }

    // If data is found, return it
    return new Response(JSON.stringify(data || { score: 0 }), {
      status: 200,
      headers,
    });
  } catch (e) {
    console.error("Server error getting quiz score:", e);
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
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response("Method not allowed", { status: 405 });
};
