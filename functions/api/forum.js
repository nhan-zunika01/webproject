// File: functions/api/forum.js
// Handles all API requests for the forum feature using Cloudflare D1.

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

  // --- GET: Fetch all posts ---
  if (request.method === "GET") {
    try {
      // 1. Fetch all posts from D1
      const { results: posts } = await env.DB.prepare(
          "SELECT * FROM posts ORDER BY created_at DESC"
        ).all();

      // 2. Check if a user is logged in to fetch their votes
      const authHeader = request.headers.get("Authorization");
      let userVotesMap = {};
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decodedPayload = await verifyJwt(token, env.JWT_SECRET);

        if (decodedPayload && decodedPayload.sub) {
          const userId = decodedPayload.sub;
          const { results: votes } = await env.DB.prepare(
              "SELECT post_id, vote_type FROM post_votes WHERE user_id = ?"
            ).bind(userId).all();

          userVotesMap = votes.reduce((acc, vote) => {
            acc[vote.post_id] = vote.vote_type;
            return acc;
          }, {});
        }
      }

      // 3. Combine post data with the user's vote status
      const postsWithVotes = posts.map((post) => ({
        ...post,
        user_vote: userVotesMap[post.id] || 0, // 0 = no vote
      }));

      return new Response(JSON.stringify(postsWithVotes), { status: 200, headers });
    } catch (e) {
      console.error("Error fetching posts:", e);
      return new Response(JSON.stringify({ message: "Không thể tải bài viết." }), { status: 500, headers });
    }
  }

  // --- POST: Create a new post ---
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

        // 2. Fetch user info for caching
        const user = await env.DB.prepare("SELECT name_user, name_account FROM users WHERE id = ?").bind(userId).first();
        if (!user) {
            return new Response(JSON.stringify({ message: "Không tìm thấy người dùng." }), { status: 404, headers });
        }

        // 3. Get post data from request body
        const { title, content } = await request.json();
        if (!title || !content) {
            return new Response(JSON.stringify({ message: "Tiêu đề và nội dung là bắt buộc." }), { status: 400, headers });
        }

        const userName = user.name_user || user.name_account || "Người dùng ẩn danh";
        const avatarChar = (userName.charAt(0) || "A").toUpperCase();

        // 4. Insert new post into D1 and return it
        const newPost = await env.DB.prepare(
            `INSERT INTO posts (user_id, title, content, user_name, user_avatar_char)
             VALUES (?, ?, ?, ?, ?) RETURNING *`
        ).bind(userId, title, content, userName, avatarChar).first();

        // 5. Add the default user_vote field and return
        const newPostWithVote = { ...newPost, user_vote: 0 };
        return new Response(JSON.stringify(newPostWithVote), { status: 201, headers });

    } catch (e) {
      console.error("Error creating post:", e);
      return new Response(JSON.stringify({ message: "Không thể tạo bài viết." }), { status: 500, headers });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};