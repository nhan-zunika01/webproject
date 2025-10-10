// File: functions/api/resend-confirmation.js
// Placeholder for email confirmation resend functionality after migrating from Supabase.

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // NOTE: Cloudflare D1 does not have a built-in email sending service like Supabase.
  // A full implementation of resending a confirmation email requires integrating a
  // third-party email provider (e.g., SendGrid, Mailgun), which is a significant
  // feature addition beyond the scope of the database migration.

  // For now, we return a helpful message to the user.
  return new Response(
    JSON.stringify({
      message:
        "Chức năng gửi lại email xác nhận không có sẵn. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
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