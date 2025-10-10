// File: functions/api/vote.js
// Handles all like/dislike actions using atomic D1 batch operations.

// --- Helper Functions ---

/**
 * Verifies a JWT and returns the payload.
 * @param {string} token The JWT.
 * @param {string} secret The secret key.
 * @returns {Promise<object|null>} The decoded payload or null.
 */
async function verifyJwt(token, secret) {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');
        const signatureInput = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const signatureBuffer = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
        const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(signatureInput));

        if (!isValid) return null;

        return JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
        return null;
    }
}

export const onRequest = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  if (!env.DB || !env.JWT_SECRET) {
      console.error("Server configuration error: D1 or JWT_SECRET is missing.");
      return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  try {
    // 1. Authenticate user via JWT
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ message: "Yêu cầu thiếu thông tin xác thực." }), { status: 401, headers });
    }
    const token = authHeader.split(" ")[1];
    const decodedPayload = await verifyJwt(token, env.JWT_SECRET);
    if (!decodedPayload || !decodedPayload.sub) {
      return new Response(JSON.stringify({ message: "Mã xác thực không hợp lệ." }), { status: 401, headers });
    }
    const userId = decodedPayload.sub;

    // 2. Get data from request body
    const { postId, voteType } = await request.json(); // voteType: 'like' or 'dislike'
    const voteValue = voteType === "like" ? 1 : -1;

    // 3. Determine the vote operation
    const existingVote = await env.DB.prepare(
        "SELECT id, vote_type FROM post_votes WHERE user_id = ? AND post_id = ?"
      ).bind(userId, postId).first();

    const batch = [];
    if (existingVote) {
        if (existingVote.vote_type === voteValue) {
            // Un-voting: delete the existing vote
            batch.push(env.DB.prepare("DELETE FROM post_votes WHERE id = ?").bind(existingVote.id));
        } else {
            // Changing vote: update the existing vote
            batch.push(env.DB.prepare("UPDATE post_votes SET vote_type = ? WHERE id = ?").bind(voteValue, existingVote.id));
        }
    } else {
        // New vote: insert a new vote record
        batch.push(env.DB.prepare("INSERT INTO post_votes (user_id, post_id, vote_type) VALUES (?, ?, ?)").bind(userId, postId, voteValue));
    }

    // 4. Add a statement to the batch to update the post's vote counts atomically
    batch.push(
        env.DB.prepare(
            `UPDATE posts SET
               like_count = (SELECT COUNT(*) FROM post_votes WHERE post_id = ? AND vote_type = 1),
               dislike_count = (SELECT COUNT(*) FROM post_votes WHERE post_id = ? AND vote_type = -1)
             WHERE id = ?`
        ).bind(postId, postId, postId)
    );

    // 5. Execute the atomic batch operation
    await env.DB.batch(batch);

    return new Response(JSON.stringify({ message: "Vote recorded successfully." }), { status: 200, headers });

  } catch (e) {
    console.error("Error processing vote:", e);
    return new Response(JSON.stringify({ message: "Không thể ghi nhận vote." }), { status: 500, headers });
  }
};