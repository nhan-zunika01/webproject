// File: functions/api/reset-password.js
// Placeholder for password reset functionality after migrating from Supabase.

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // NOTE: Cloudflare D1 does not have a built-in email sending service like Supabase.
  // A full implementation of password reset requires integrating a third-party
  // email provider (e.g., SendGrid, Mailgun) to send a reset link with a secure,
  // single-use token. This is a significant feature addition beyond the scope of
  // the database migration.

  // For now, we return a helpful message to the user.
  return new Response(
    JSON.stringify({
      message:
        "Chức năng tự động đặt lại mật khẩu không có sẵn. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
    }),
    { status: 501, headers } // 501 Not Implemented
  );
};

export const onRequest = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return onRequestPost(context);
};