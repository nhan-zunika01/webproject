// File: functions/api/get-ip-location.js
// This function leverages Cloudflare's built-in geolocation feature.

export const onRequestGet = async ({ request }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // The 'cf' object is automatically attached to the request by Cloudflare
  // and contains geolocation data based on the user's IP.
  const cf = request.cf;

  // Check if Cloudflare was able to determine the location.
  if (!cf || !cf.city || !cf.region) {
    return new Response(
      JSON.stringify({
        error: "Không thể xác định vị trí từ máy chủ Cloudflare.",
      }),
      { status: 500, headers }
    );
  }

  // Return the location data found by Cloudflare.
  const locationData = {
    city: cf.city, // e.g., "Hanoi"
    region: cf.region, // e.g., "Hanoi"
    country: cf.country, // e.g., "VN"
  };

  return new Response(JSON.stringify(locationData), { status: 200, headers });
};
