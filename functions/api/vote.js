// File: functions/api/vote.js
// Handles all like/dislike actions.
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }),
      { status: 500, headers }
    );
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Authenticate user
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
    const { postId, voteType } = await request.json(); // voteType can be 'like' or 'dislike'
    const voteValue = voteType === "like" ? 1 : -1;

    // Check for existing vote
    const { data: existingVote, error: selectError } = await supabase
      .from("post_votes")
      .select("*")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      throw selectError;
    }

    if (existingVote) {
      // User has voted before
      if (existingVote.vote_type === voteValue) {
        // User is un-voting (e.g., clicking like again)
        const { error: deleteError } = await supabase
          .from("post_votes")
          .delete()
          .eq("id", existingVote.id);
        if (deleteError) throw deleteError;
      } else {
        // User is changing their vote (e.g., from dislike to like)
        const { error: updateError } = await supabase
          .from("post_votes")
          .update({ vote_type: voteValue })
          .eq("id", existingVote.id);
        if (updateError) throw updateError;
      }
    } else {
      // New vote
      const { error: insertError } = await supabase
        .from("post_votes")
        .insert({ user_id: user.id, post_id: postId, vote_type: voteValue });
      if (insertError) throw insertError;
    }

    // After changing the vote, call the RPC function to update counts
    const { error: rpcError } = await supabase.rpc("update_post_vote_counts", {
      p_post_id: postId,
    });
    if (rpcError) throw rpcError;

    return new Response(
      JSON.stringify({ message: "Vote recorded successfully." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Error processing vote:", e);
    return new Response(
      JSON.stringify({ message: `Không thể ghi nhận vote. Lỗi: ${e.message}` }),
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
