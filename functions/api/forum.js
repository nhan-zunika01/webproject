// File: functions/api/forum.js
// Handles all API requests for the forum feature.
import { createClient } from "@supabase/supabase-js";

export const onRequest = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Check for environment variables
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

  // GET: Fetch all posts
  if (request.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false }); // Show newest first

      if (error) {
        throw error;
      }
      return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (e) {
      console.error("Error fetching posts:", e);
      return new Response(
        JSON.stringify({ message: "Không thể tải bài viết." }),
        {
          status: 500,
          headers,
        }
      );
    }
  }

  // POST: Create a new post
  if (request.method === "POST") {
    // User must be authenticated to create a post
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

    try {
      const { title, content } = await request.json();

      if (!title || !content) {
        return new Response(
          JSON.stringify({ message: "Tiêu đề và nội dung là bắt buộc." }),
          { status: 400, headers }
        );
      }

      // Get user metadata for name and avatar
      const userName = user.user_metadata?.name_user || "Người dùng ẩn danh";
      const avatarChar = (userName.charAt(0) || "A").toUpperCase();

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title,
          content,
          user_name: userName,
          user_avatar_char: avatarChar,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      return new Response(JSON.stringify(data), { status: 201, headers });
    } catch (e) {
      console.error("Error creating post:", e);
      return new Response(
        JSON.stringify({ message: "Không thể tạo bài viết." }),
        { status: 500, headers }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};
