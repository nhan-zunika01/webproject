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

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // --- GET: Fetch all posts ---
  if (request.method === "GET") {
    try {
      // First, get all posts
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Check if a user is logged in to fetch their votes
      const authHeader = request.headers.get("Authorization");
      let userVotes = [];
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const {
          data: { user },
        } = await supabase.auth.getUser(token);

        if (user) {
          const { data: votes, error: votesError } = await supabase
            .from("post_votes")
            .select("post_id, vote_type")
            .eq("user_id", user.id);
          if (votesError) throw votesError;
          userVotes = votes;
        }
      }

      // Map user votes to a more easily accessible format
      const userVotesMap = userVotes.reduce((acc, vote) => {
        acc[vote.post_id] = vote.vote_type;
        return acc;
      }, {});

      // Combine post data with the current user's vote status
      const postsWithVotes = posts.map((post) => ({
        ...post,
        user_vote: userVotesMap[post.id] || 0, // 0 means no vote, 1 like, -1 dislike
      }));

      return new Response(JSON.stringify(postsWithVotes), {
        status: 200,
        headers,
      });
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

  // --- POST: Create a new post ---
  if (request.method === "POST") {
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

      if (insertError) throw insertError;

      // Return the new post with the user's vote status as 0 (no vote)
      const newPostWithVote = { ...data, user_vote: 0 };
      return new Response(JSON.stringify(newPostWithVote), {
        status: 201,
        headers,
      });
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
