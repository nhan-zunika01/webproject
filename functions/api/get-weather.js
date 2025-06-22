// File: functions/api/get-weather.js

export const onRequestGet = async ({ request, env }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Cho phép gọi từ bất kỳ đâu
    "Content-Type": "application/json",
  };

  // 1. Kiểm tra xem API Key đã được thiết lập trên Cloudflare chưa
  if (!env.OPENWEATHER_API_KEY) {
    return new Response(
      JSON.stringify({
        message:
          "Lỗi cấu hình: OPENWEATHER_API_KEY chưa được thiết lập trên máy chủ.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({
          message: "Vĩ độ (lat) và kinh độ (lon) là bắt buộc.",
        }),
        { status: 400, headers }
      );
    }

    const apiKey = env.OPENWEATHER_API_KEY;

    // 2. Gọi đồng thời cả hai API từ máy chủ của Cloudflare
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;

    const [currentWeatherRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentWeatherRes.ok || !forecastRes.ok) {
      throw new Error("Không thể lấy dữ liệu từ OpenWeatherMap.");
    }

    const currentWeatherData = await currentWeatherRes.json();
    const forecastData = await forecastRes.json();

    // 3. Gộp và trả kết quả về cho trình duyệt
    const responsePayload = {
      current: currentWeatherData,
      forecast: forecastData,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Lỗi trong hàm get-weather:", error);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi phía máy chủ." }),
      { status: 500, headers }
    );
  }
};
