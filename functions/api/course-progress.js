// File: functions/api/course-progress.js
import { createClient } from "@supabase/supabase-js";

// This single file handles both getting and saving course progress.
export const onRequest = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Extract user token from Authorization header
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

  if (request.method === "GET") {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    if (!courseId) {
      return new Response(
        JSON.stringify({ message: "courseId is required." }),
        { status: 400, headers }
      );
    }

    const { data, error } = await supabase
      .from("course_progress")
      .select("completed_lessons")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      throw error;
    }

    return new Response(JSON.stringify(data || { completed_lessons: [] }), {
      status: 200,
      headers,
    });
  }

  if (request.method === "POST") {
    const { courseId, completed_lessons } = await request.json();
    if (!courseId || !completed_lessons) {
      return new Response(
        JSON.stringify({
          message: "courseId and completed_lessons are required.",
        }),
        { status: 400, headers }
      );
    }

    const { data, error } = await supabase.from("course_progress").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        completed_lessons: completed_lessons,
        updated_at: new Date(),
      },
      { onConflict: "user_id, course_id" }
    );

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Progress saved." }), {
      status: 200,
      headers,
    });
  }

  return new Response("Method not allowed", { status: 405, headers });
};
