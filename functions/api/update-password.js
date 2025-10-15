// File: functions/api/update-password.js
// Allows a user to change their password, either while authenticated
// or via a password reset token.

// --- Helper Functions ---

/**
 * Hashes a string using SHA-256.
 * @param {string} text The text to hash.
 * @returns {Promise<string>} The hexadecimal representation of the hash.
 */
async function hash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


/**
 * A basic JWT verifier and decoder.
 * @param {string} token The JWT to verify.
 * @param {string} secret The secret key.
 * @returns {Promise<object|null>} The decoded payload or null if invalid.
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


// --- Main Request Handler ---

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.DB || !env.JWT_SECRET) {
    console.error("Server configuration error: D1 or JWT_SECRET is missing.");
    return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  const { token, current_password, new_password } = await request.json();

  if (token) {
    // --- Password Reset Flow (using token) ---
    return await handlePasswordReset(token, new_password, env, headers);
  } else {
    // --- Authenticated Password Change Flow ---
    const authHeader = request.headers.get("Authorization");
    return await handleAuthenticatedPasswordChange(authHeader, current_password, new_password, env, headers);
  }
};


// --- Sub-Handlers for Different Flows ---

/**
 * Handles password update for an authenticated user.
 */
async function handleAuthenticatedPasswordChange(authHeader, current_password, new_password, env, headers) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ message: "Yêu cầu thiếu thông tin xác thực." }), { status: 401, headers });
    }
    const jwt = authHeader.split(" ")[1];
    const decodedPayload = await verifyJwt(jwt, env.JWT_SECRET);

    if (!decodedPayload || !decodedPayload.sub) {
        return new Response(JSON.stringify({ message: "Mã xác thực không hợp lệ." }), { status: 401, headers });
    }
    const userId = decodedPayload.sub;

    if (!current_password || !new_password) {
        return new Response(JSON.stringify({ message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." }), { status: 400, headers });
    }
    if (new_password.length < 6) {
        return new Response(JSON.stringify({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." }), { status: 400, headers });
    }

    try {
        const user = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(userId).first();
        if (!user) {
            return new Response(JSON.stringify({ message: "Không tìm thấy người dùng." }), { status: 404, headers });
        }

        const currentPasswordHash = await hash(current_password);
        if (currentPasswordHash !== user.password_hash) {
            return new Response(JSON.stringify({ message: "Mật khẩu hiện tại không chính xác." }), { status: 403, headers });
        }

        const newPasswordHash = await hash(new_password);
        await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newPasswordHash, userId).run();

        return new Response(JSON.stringify({ message: "Cập nhật mật khẩu thành công!" }), { status: 200, headers });
    } catch (e) {
        console.error("Authenticated password update error:", e);
        return new Response(JSON.stringify({ message: "Đã xảy ra lỗi hệ thống." }), { status: 500, headers });
    }
}

/**
 * Handles password update using a reset token.
 */
async function handlePasswordReset(token, new_password, env, headers) {
    if (!new_password || new_password.length < 6) {
        return new Response(JSON.stringify({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." }), { status: 400, headers });
    }

    try {
        const tokenHash = await hash(token);

        const user = await env.DB.prepare(
            `SELECT id, password_reset_token_expires_at FROM users WHERE password_reset_token = ?`
        ).bind(tokenHash).first();

        if (!user) {
            return new Response(JSON.stringify({ message: "Mã đặt lại mật khẩu không hợp lệ." }), { status: 400, headers });
        }

        const tokenExpiry = new Date(user.password_reset_token_expires_at);
        if (tokenExpiry < new Date()) {
            return new Response(JSON.stringify({ message: "Mã đặt lại mật khẩu đã hết hạn." }), { status: 400, headers });
        }

        const newPasswordHash = await hash(new_password);
        await env.DB.prepare(
            `UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_token_expires_at = NULL WHERE id = ?`
        ).bind(newPasswordHash, user.id).run();

        return new Response(JSON.stringify({ message: "Đặt lại mật khẩu thành công!" }), { status: 200, headers });

    } catch (e) {
        console.error("Password reset error:", e);
        return new Response(JSON.stringify({ message: "Đã xảy ra lỗi hệ thống khi đặt lại mật khẩu." }), { status: 500, headers });
    }
}


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