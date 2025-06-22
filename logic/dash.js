// Global variable for current user
let currentUser = null;
const RICE_QUIZ_ID = "rice-basics-v1"; // Define Quiz ID as a constant

// New navigation function for the sidebar
function showSection(sectionId, element) {
  // Hide all content sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Remove 'active' class from all nav tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  // Add 'active' class to the clicked sidebar link
  if (element) {
    element.classList.add("active");
  }

  // Update the header title
  const titleElement = document.getElementById("main-content-title");
  if (titleElement && element) {
    const titleText = element.querySelector("span").textContent;
    titleElement.textContent = titleText;
  }
}

// Function to handle user logout
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("currentUser");
    window.location.reload(); // Reload the page to show guest UI
  }
}

// THÊM MỚI: Hàm để tải điểm của người dùng
async function loadUserScores() {
  if (!currentUser) return;

  const highscoreEl = document.getElementById("quiz-highscore");
  if (!highscoreEl) return;

  try {
    const response = await fetch(
      `/api/get-quiz-score?userId=${currentUser.id}&quizId=${RICE_QUIZ_ID}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch score");
    }
    const data = await response.json();
    highscoreEl.textContent = `${data.score || 0}/20`;
  } catch (error) {
    console.error("Error loading quiz score:", error);
    highscoreEl.textContent = "Lỗi";
  }
}

// Function to set up UI for logged-in users
function setupUserUI() {
  if (!currentUser) return;

  document.getElementById("user-info").style.display = "flex";
  document.getElementById("guest-menu").style.display = "none";
  document.getElementById("profile-tab").style.display = "flex";
  document.getElementById("create-post-btn").style.display = "inline-block";
  document.getElementById("forum-login-prompt").style.display = "none";

  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.classList.remove("disabled");
    startQuizBtn.removeAttribute("title");
  }

  // Hiển thị nút "Tham gia khóa học" và ẩn thông báo đăng nhập
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "inline-block";
    if (loginPrompt) loginPrompt.style.display = "none";
  });

  // Cập nhật số liệu thống kê cho người dùng đã đăng nhập (dữ liệu mẫu)
  document.getElementById("stat-courses-completed").textContent = "12";
  document.getElementById("stat-average-score").textContent = "85%";
  document.getElementById("stat-study-hours").textContent = "156";
  document.getElementById("stat-student-rating").textContent = "4.8★";

  // THÊM MỚI: Gọi hàm tải điểm khi người dùng đăng nhập
  loadUserScores();

  const usernameSpan = document.querySelector(".user-menu .username");
  if (usernameSpan) {
    usernameSpan.textContent = `Chào, ${currentUser.name_user}!`;
  }

  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profilePhone = document.getElementById("profile-phone");

  if (profileName) profileName.value = currentUser.name_user;
  if (profileEmail) profileEmail.value = currentUser.email;
  if (profilePhone) profilePhone.value = currentUser.phone_user;
}

// Function to set up UI for guest users
function setupGuestUI() {
  document.getElementById("user-info").style.display = "none";
  document.getElementById("guest-menu").style.display = "flex";
  document.getElementById("profile-tab").style.display = "none";
  document.getElementById("create-post-btn").style.display = "none";
  document.getElementById("forum-login-prompt").style.display = "block";

  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.classList.add("disabled");
    startQuizBtn.title = "Vui lòng đăng nhập để làm bài kiểm tra";
  }

  // Ẩn nút "Tham gia khóa học" và hiển thị thông báo đăng nhập
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "none";
    if (loginPrompt) loginPrompt.style.display = "block";
  });

  // Đặt lại tất cả các số liệu về 0 cho khách
  document.getElementById("stat-courses-completed").textContent = "0";
  document.getElementById("stat-average-score").textContent = "0%";
  document.getElementById("stat-study-hours").textContent = "0";
  document.getElementById("stat-student-rating").textContent = "0.0★";

  // THÊM MỚI: Đặt lại điểm cho khách
  const highscoreEl = document.getElementById("quiz-highscore");
  if (highscoreEl) {
    highscoreEl.textContent = "0/20";
  }

  document.getElementById("main-content-title").textContent = "Trang chủ";

  if (!document.getElementById("guest-welcome-message")) {
    const dashboardSection = document.getElementById("dashboard");
    const guestMessage = document.createElement("div");
    guestMessage.className = "card";
    guestMessage.id = "guest-welcome-message";
    guestMessage.innerHTML =
      '<h3>Chào mừng bạn đến với Sổ Tay Nông Dân!</h3><p>Vui lòng <a href="login.html">đăng nhập</a> hoặc <a href="register.html">đăng ký</a> để truy cập tất cả các tính năng.</p>';
    dashboardSection.prepend(guestMessage);
  }
}

// Function to enable editing the profile
function editProfile(button) {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để sử dụng tính năng này.");
    return;
  }

  const profileForm = document.getElementById("profile");
  const inputs = profileForm.querySelectorAll('input:not([type="email"])');

  if (button.textContent.includes("Chỉnh sửa")) {
    inputs.forEach((input) => input.removeAttribute("readonly"));
    button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
  } else {
    currentUser.name_user = document.getElementById("profile-name").value;
    currentUser.phone_user = document.getElementById("profile-phone").value;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    inputs.forEach((input) => input.setAttribute("readonly", true));
    button.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa thông tin';
    alert("Thông tin đã được cập nhật!");
    setupUserUI();
  }
}

// === BẮT ĐẦU: CẬP NHẬT HÀM THỜI TIẾT ===
async function getWeather(location = "Hanoi") {
  const weatherWidget = document.querySelector(".weather-widget");
  if (!weatherWidget) return;

  weatherWidget.innerHTML = "<p>Đang tải dữ liệu thời tiết...</p>";

  const weatherTranslations = {
    Sunny: "Trời nắng",
    Clear: "Trời quang",
    "Partly cloudy": "Trời có mây",
    Cloudy: "Trời nhiều mây",
    Overcast: "Trời u ám",
    Mist: "Sương mù",
    "Patchy rain possible": "Có thể có mưa vài nơi",
    "Patchy snow possible": "Có thể có tuyết vài nơi",
    "Patchy sleet possible": "Có thể có mưa tuyết vài nơi",
    "Patchy freezing drizzle possible": "Có thể có mưa phùn băng giá",
    "Thundery outbreaks possible": "Có khả năng có dông",
    "Blowing snow": "Bão tuyết",
    Blizzard: "Trận bão tuyết",
    Fog: "Sương mù",
    "Freezing fog": "Sương mù băng giá",
    "Patchy light drizzle": "Mưa phùn nhẹ",
    "Light drizzle": "Mưa phùn nhẹ",
    "Freezing drizzle": "Mưa phùn băng giá",
    "Heavy freezing drizzle": "Mưa phùn băng giá dày đặc",
    "Patchy light rain": "Mưa nhẹ vài nơi",
    "Light rain": "Mưa nhỏ",
    "Moderate rain at times": "Đôi lúc có mưa vừa",
    "Moderate rain": "Mưa vừa",
    "Heavy rain at times": "Đôi lúc có mưa to",
    "Heavy rain": "Mưa to",
    "Light freezing rain": "Mưa băng nhẹ",
    "Moderate or heavy freezing rain": "Mưa băng vừa hoặc nặng",
    "Light sleet": "Mưa tuyết nhẹ",
    "Moderate or heavy sleet": "Mưa tuyết vừa hoặc nặng",
    "Patchy light snow": "Tuyết nhẹ vài nơi",
    "Light snow": "Tuyết nhẹ",
    "Patchy moderate snow": "Tuyết vừa vài nơi",
    "Moderate snow": "Tuyết vừa",
    "Patchy heavy snow": "Tuyết dày vài nơi",
    "Heavy snow": "Tuyết dày",
    "Ice pellets": "Mưa đá",
    "Light rain shower": "Mưa rào nhẹ",
    "Moderate or heavy rain shower": "Mưa rào vừa hoặc nặng",
    "Torrential rain shower": "Mưa như trút nước",
    "Light sleet showers": "Mưa tuyết nhẹ",
    "Moderate or heavy sleet showers": "Mưa tuyết vừa hoặc nặng",
    "Light snow showers": "Mưa tuyết nhẹ",
    "Moderate or heavy snow showers": "Mưa tuyết vừa hoặc nặng",
    "Light showers of ice pellets": "Mưa đá nhẹ",
    "Moderate or heavy showers of ice pellets": "Mưa đá vừa hoặc nặng",
    "Patchy light rain with thunder": "Mưa dông vài nơi",
    "Moderate or heavy rain with thunder": "Mưa dông vừa hoặc nặng",
    "Patchy light snow with thunder": "Tuyết và dông vài nơi",
    "Moderate or heavy snow with thunder": "Tuyết và dông vừa hoặc nặng",
  };

  try {
    const weatherResponse = await fetch(
      `https://wttr.in/${location.trim().replace(/ /g, "+")}?format=j1&lang=vi`
    );
    if (!weatherResponse.ok) {
      throw new Error(
        "Không tìm thấy địa điểm. Vui lòng thử lại với tên tiếng Anh (vd: Hanoi)."
      );
    }
    const weatherData = await weatherResponse.json();
    const currentWeather = weatherData.current_condition?.[0];

    if (!currentWeather) {
      throw new Error("Dữ liệu thời tiết hiện tại không có sẵn.");
    }

    const forecast = weatherData.weather?.slice(0, 4) || [];
    const area = weatherData.nearest_area?.[0];
    const locationName = area?.areaName?.[0]?.value || location;
    const countryName = area?.country?.[0]?.value || "";

    const englishDescription = currentWeather.weatherDesc?.[0]?.value || "";
    const weatherDescription =
      weatherTranslations[englishDescription] ||
      englishDescription ||
      "Không có mô tả";

    const getIconClass = (weatherCode) => {
      const code = parseInt(weatherCode);
      if ([113].includes(code)) return "fa-sun";
      if ([116, 119, 122].includes(code)) return "fa-cloud";
      if ([176, 293, 296, 302, 308, 353, 359].includes(code))
        return "fa-cloud-rain";
      if ([200, 386, 389].includes(code)) return "fa-bolt";
      if ([227, 329, 332, 338, 371].includes(code)) return "fa-snowflake";
      if ([143, 248, 260].includes(code)) return "fa-smog";
      return "fa-cloud-sun";
    };

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const today = new Date().getDay();

    weatherWidget.innerHTML = `
            <div class="weather-main">
                <i class="fas ${getIconClass(currentWeather.weatherCode)}"></i>
                <div class="weather-temp">${currentWeather.temp_C}°C</div>
                <div class="weather-location">${locationName}${
      countryName ? ", " + countryName : ""
    }</div>
                <div class="weather-desc">${weatherDescription}</div>
            </div>
            <div class="weather-forecast">
                ${forecast
                  .map((day, index) => {
                    const dayIndex = (today + index) % 7;
                    const iconCode = day.hourly?.[4]?.weatherCode || "116";
                    return `
                    <div class="forecast-item">
                        <div>${dayNames[dayIndex]}</div>
                        <i class="fas ${getIconClass(iconCode)}"></i>
                        <div>${day.maxtempC}°</div>
                    </div>
                `;
                  })
                  .join("")}
            </div>
        `;
  } catch (error) {
    console.error("Weather fetch error:", error);
    weatherWidget.innerHTML = `<p style="color: #ffcccc;">Lỗi khi tải dữ liệu: ${error.message}</p>`;
  }
}

function changeWeatherLocation() {
  const locationInput = document.getElementById("location-input");
  const location = locationInput.value.trim();
  getWeather(location || "Hanoi");
}
// === KẾT THÚC: CẬP NHẬT HÀM THỜI TIẾT ===

// Functions for other buttons with login check
function startCourse(id) {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để tham gia khóa học.");
    return;
  }
  alert(`Bắt đầu khóa học ${id}...`);
}

function createPost() {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để tạo bài viết.");
    return;
  }
  alert("Mở form tạo bài viết mới...");
}

// === INITIALIZATION ===
document.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("currentUser");

  if (userData) {
    currentUser = JSON.parse(userData);
    setupUserUI();
  } else {
    setupGuestUI();
  }

  // Automatically fetch weather for Hanoi on page load
  getWeather();
});
