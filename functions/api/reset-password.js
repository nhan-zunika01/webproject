// File: functions/api/reset-password.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async (context) => {
  const { request, env } = context;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Check for environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // Reset password uses anon key
    console.error(
      "Supabase environment variables are not set for password reset."
    );
    return new Response(
      JSON.stringify({
        message: "Lỗi cấu hình phía máy chủ. Vui lòng liên hệ quản trị viên.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY // It's safer to use anon key for this operation
    );
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), {
        status: 400,
        headers,
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://webproject-bxj.pages.dev/update-password.html",
    });

    // Supabase intentionally does not return an error if the email doesn't exist
    // to prevent email enumeration attacks. We always return a success message.
    if (error) {
      console.error("Supabase password reset error:", error.message);
    }

    return new Response(
      JSON.stringify({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Password reset server error:", e);
    return new Response(
      JSON.stringify({ message: "An internal server error occurred." }),
      {
        status: 500,
        headers,
      }
    );
  }
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
