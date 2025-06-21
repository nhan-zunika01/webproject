// File: functions/api/update-password.js
import { createClient } from "@supabase/supabase-js";

export const onRequestPost = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { access_token, password } = await request.json();

    if (!access_token || !password) {
      return new Response(
        JSON.stringify({ message: "Access token and password are required." }),
        { status: 400, headers }
      );
    }

    // Use the access token to authenticate the user session
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser(access_token);

    if (sessionError) {
      return new Response(
        JSON.stringify({
          message: "Mã khôi phục không hợp lệ hoặc đã hết hạn.",
        }),
        { status: 401, headers }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ message: "Password updated successfully." }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Update password server error:", e);
    const errorMessage = e.message || "An internal server error occurred.";
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers,
    });
  }
};
