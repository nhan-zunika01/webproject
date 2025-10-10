// File: functions/api/comments.js
// Handles fetching and creating comments for a post using Cloudflare D1.

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
        console.error("JWT verification error:", e);
        return null;
    }
}

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

  if (!env.DB || !env.JWT_SECRET) {
      console.error("Server configuration error: D1 binding or JWT_SECRET is missing.");
      return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  // --- GET: Fetch comments for a specific post ---
  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const postId = url.searchParams.get("postId");
      if (!postId) {
        return new Response(JSON.stringify({ message: "Cần có postId." }), { status: 400, headers });
      }

      const { results } = await env.DB.prepare(
          "SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC"
        )
        .bind(postId)
        .all();

      return new Response(JSON.stringify(results || []), { status: 200, headers });
    } catch (e) {
      console.error("Error fetching comments:", e);
      return new Response(JSON.stringify({ message: "Không thể tải bình luận." }), { status: 500, headers });
    }
  }

  // --- POST: Create a new comment ---
  if (request.method === "POST") {
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

        // 2. Get user info for caching in the comment
        const user = await env.DB.prepare(
            "SELECT name_user, name_account FROM users WHERE id = ?"
        ).bind(userId).first();
        if (!user) {
            return new Response(JSON.stringify({ message: "Không tìm thấy người dùng." }), { status: 404, headers });
        }

        // 3. Get request body
        const { postId, content } = await request.json();
        if (!postId || !content) {
            return new Response(JSON.stringify({ message: "postId và nội dung là bắt buộc." }), { status: 400, headers });
        }

        const userName = user.name_user || user.name_account || "Người dùng ẩn danh";
        const avatarChar = (userName.charAt(0) || "A").toUpperCase();

        // 4. Use a D1 batch to insert the comment and update the post's comment count atomically
        const batch = [
            env.DB.prepare(
                `INSERT INTO post_comments (post_id, user_id, content, user_name, user_avatar_char) VALUES (?, ?, ?, ?, ?) RETURNING *`
            ).bind(postId, userId, content, userName, avatarChar),
            env.DB.prepare(
                "UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?"
            ).bind(postId)
        ];

        const [newCommentResult] = await env.DB.batch(batch);
        const newComment = newCommentResult.results[0];

        return new Response(JSON.stringify(newComment), { status: 201, headers });

    } catch (e) {
      console.error("Error creating comment:", e);
      return new Response(JSON.stringify({ message: "Không thể tạo bình luận." }), { status: 500, headers });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};