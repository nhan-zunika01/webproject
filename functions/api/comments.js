// File: functions/api/comments.js
// Handles fetching and creating comments for a post.
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

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // --- GET: Fetch comments for a specific post ---
  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const postId = url.searchParams.get("postId");
      if (!postId) {
        return new Response(JSON.stringify({ message: "Cần có postId." }), {
          status: 400,
          headers,
        });
      }

      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }); // Show oldest first

      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (e) {
      console.error("Error fetching comments:", e);
      return new Response(
        JSON.stringify({ message: "Không thể tải bình luận." }),
        { status: 500, headers }
      );
    }
  }

  // --- POST: Create a new comment ---
  if (request.method === "POST") {
    // Authenticate the user first
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
      const { postId, content } = await request.json();
      if (!postId || !content) {
        return new Response(
          JSON.stringify({ message: "postId và nội dung là bắt buộc." }),
          { status: 400, headers }
        );
      }

      const userName = user.user_metadata?.name_user || "Người dùng ẩn danh";
      const avatarChar = (userName.charAt(0) || "A").toUpperCase();

      // Insert the new comment
      const { data: newComment, error: insertError } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          user_name: userName,
          user_avatar_char: avatarChar,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // After successful insert, update the comment count on the post
      const { error: rpcError } = await supabase.rpc(
        "update_post_comment_count",
        {
          p_post_id: postId,
        }
      );

      if (rpcError) {
        // Log the error but don't fail the request, as the comment was already posted
        console.error("Error updating comment count:", rpcError);
      }

      return new Response(JSON.stringify(newComment), { status: 201, headers });
    } catch (e) {
      console.error("Error creating comment:", e);
      return new Response(
        JSON.stringify({ message: "Không thể tạo bình luận." }),
        { status: 500, headers }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};
