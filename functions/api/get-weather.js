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
    let lat = url.searchParams.get("lat");
    let lon = url.searchParams.get("lon");
    const location = url.searchParams.get("location");
    const apiKey = env.OPENWEATHER_API_KEY;

    // Nếu có tham số 'location' (và không có lat/lon), chúng ta sẽ chuyển đổi nó thành tọa độ
    if (location && (!lat || !lon)) {
      // --- FIX START: Tự động xóa các tiền tố "Huyện", "Tỉnh", v.v. ---
      // Điều này giúp API Geocoding của OpenWeatherMap hiểu đúng tên địa danh.
      const cleanLocation = location.replace(
        /(Huyện|Quận|Thị xã|Thành phố|Tỉnh)\s/g,
        ""
      );
      // Ví dụ: "Huyện Văn Chấn, Tỉnh Yên Bái" -> "Văn Chấn,Yên Bái"
      // --- FIX END ---

      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        cleanLocation // Sử dụng tên địa danh đã được làm sạch
      )},VN&limit=1&appid=${apiKey}`;

      const geocodeRes = await fetch(geocodeUrl);

      if (!geocodeRes.ok) {
        throw new Error("Dịch vụ chuyển đổi địa danh không phản hồi.");
      }

      const geocodeData = await geocodeRes.json();
      if (!geocodeData || geocodeData.length === 0) {
        return new Response(
          JSON.stringify({
            message: `Không tìm thấy thông tin cho địa điểm: ${location}`,
          }),
          { status: 404, headers }
        );
      }

      // Gán vĩ độ và kinh độ từ kết quả chuyển đổi
      lat = geocodeData[0].lat;
      lon = geocodeData[0].lon;
    }

    // Sau khi đã có tọa độ (từ request hoặc từ chuyển đổi), kiểm tra lại lần cuối
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({
          message:
            "Vĩ độ (lat) và kinh độ (lon) hoặc tên địa điểm (location) là bắt buộc.",
        }),
        { status: 400, headers }
      );
    }

    // 2. Gọi đồng thời cả hai API từ máy chủ của Cloudflare bằng tọa độ đã có
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;

    const [currentWeatherRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentWeatherRes.ok || !forecastRes.ok) {
      const errorText = await currentWeatherRes.text();
      console.error("OpenWeatherMap API error:", errorText);
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
    console.error("Lỗi trong hàm get-weather:", error.message);
    return new Response(
      JSON.stringify({ message: "Đã xảy ra lỗi phía máy chủ." }),
      { status: 500, headers }
    );
  }
};
