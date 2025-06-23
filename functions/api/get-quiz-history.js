// File: functions/api/get-quiz-history.js
import { createClient } from "@supabase/supabase-js";

// This function fetches all quiz results for a specific user.
// It's used to calculate the number of attempts and the high score on the client-side.
export const onRequestGet = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // 1. Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables are not set.");
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

    // 2. Validate input
    if (!userId) {
      return new Response(JSON.stringify({ message: "Cần có userId." }), {
        status: 400,
        headers,
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // 3. Query the database for all results for the given user
    // The RLS policy on the 'quiz_results' table ensures a user can only read their own data.
    const { data, error } = await supabase
      .from("quiz_results")
      .select("quiz_id, score, created_at")
      .eq("user_id", userId);

    if (error) {
      throw error; // Let the catch block handle it
    }

    // 4. Return the array of results
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
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response("Method not allowed", { status: 405 });
};
