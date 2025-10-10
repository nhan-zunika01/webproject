// File: functions/api/update-password.js
// Allows an authenticated user to change their password.

// --- Helper Functions ---

/**
 * Hashes a password using SHA-256.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} The hexadecimal representation of the hash.
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * A basic JWT verifier and decoder.
 * NOTE: In a real-world app, a more robust library would be used.
 * This does not validate all claims (like exp), but is sufficient for this context.
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

        // Decode the signature from Base64url to a buffer
        const signatureBuffer = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));

        const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(signatureInput));

        if (!isValid) {
            return null;
        }

        // Decode payload
        const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
        return payload;

    } catch (e) {
        console.error("JWT verification error:", e);
        return null;
    }
}


export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.DB || !env.JWT_SECRET) {
    console.error("Server configuration error: D1 or JWT_SECRET is missing.");
    return new Response(JSON.stringify({ message: "Lỗi cấu hình phía máy chủ." }), { status: 500, headers });
  }

  // --- 1. Authenticate the user with JWT ---
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

  try {
    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return new Response(JSON.stringify({ message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." }), { status: 400, headers });
    }
     if (new_password.length < 6) {
        return new Response(JSON.stringify({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." }), { status: 400, headers });
    }

    // --- 2. Verify the user's current password ---
    const user = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(userId).first();

    if (!user) {
        return new Response(JSON.stringify({ message: "Không tìm thấy người dùng." }), { status: 404, headers });
    }

    const currentPasswordHash = await hashPassword(current_password);
    if (currentPasswordHash !== user.password_hash) {
      return new Response(JSON.stringify({ message: "Mật khẩu hiện tại không chính xác." }), { status: 403, headers });
    }

    // --- 3. Update to the new password ---
    const newPasswordHash = await hashPassword(new_password);
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(newPasswordHash, userId)
      .run();

    return new Response(JSON.stringify({ message: "Cập nhật mật khẩu thành công!" }), { status: 200, headers });

  } catch (e) {
    console.error("Update password server error:", e);
    return new Response(JSON.stringify({ message: "Đã xảy ra lỗi hệ thống." }), { status: 500, headers });
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