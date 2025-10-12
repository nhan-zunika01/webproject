// File: functions/api/verify-email.js
// Handles the email verification process when a user clicks the link in their email.

/**
 * Hashes a token using the Web Crypto API (SHA-256).
 * @param {string} token The token to hash.
 * @returns {Promise<string>} The hexadecimal representation of the hash.
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestGet = async ({ request, env }) => {
  // --- Define Redirect URLs ---
  // On success, the user is redirected here.
  const successRedirectUrl = "/verification-success.html";
  // On failure (e.g., invalid token, expired token), the user is redirected here.
  const failureRedirectUrl = "/verification-failure.html";

  // Ensure the D1 database is bound
  if (!env.DB) {
    console.error("D1 database binding not found.");
    // Redirect to a generic failure page if the server is misconfigured.
    return Response.redirect(failureRedirectUrl, 302);
  }

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      // If no token is provided, redirect to the failure page.
      return Response.redirect(failureRedirectUrl, 302);
    }

    const hashedToken = await hashToken(token);

    // Find the user with the matching verification token
    const user = await env.DB.prepare(
      `SELECT id, email_verification_token_expires_at FROM users WHERE email_verification_token = ?`
    ).bind(hashedToken).first();

    if (!user) {
      // Token is invalid or has already been used.
      console.log("Invalid or already used token provided.");
      return Response.redirect(failureRedirectUrl, 302);
    }

    // Check if the token has expired
    const tokenExpiry = new Date(user.email_verification_token_expires_at);
    if (tokenExpiry < new Date()) {
      // Token has expired.
      console.log(`Token for user ${user.id} has expired.`);
      return Response.redirect(failureRedirectUrl, 302);
    }

    // If the token is valid and not expired, update the user's record
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE users
       SET email_confirmed_at = ?,
           email_verification_token = NULL,
           email_verification_token_expires_at = NULL
       WHERE id = ?`
    ).bind(now, user.id).run();

    console.log(`User ${user.id} email verified successfully.`);
    // Redirect to a success page
    return Response.redirect(successRedirectUrl, 302);

  } catch (e) {
    console.error("Email verification error:", e);
    // On any server error, redirect to the failure page.
    return Response.redirect(failureRedirectUrl, 302);
  }
};

export const onRequest = onRequestGet;
