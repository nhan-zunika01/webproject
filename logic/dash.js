// Global variable for current user
let currentUser = null;
const RICE_QUIZ_ID = "rice-basics-v1"; // ID của bài kiểm tra duy nhất
const TOTAL_COURSES_AVAILABLE = 2; // Tổng số khóa học trên nền tảng
const TOTAL_QUIZ_QUESTIONS = 20; // Tổng số câu hỏi trong bài kiểm tra

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

// --- START: HOÀN THIỆN THUẬT TOÁN TÍNH TOÁN ---

// Helper function to animate numbers counting up
function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = Math.floor(progress * (end - start) + start);
    obj.innerHTML = currentValue;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Calculates and updates all statistics on the dashboard.
 * @param {object} scoreData - The score data object, e.g., { score: 15 }.
 */
function updateDashboardStats(scoreData) {
  const score = scoreData ? scoreData.score || 0 : 0;
  const animationDuration = 1500;

  // 1. Khóa học đã hoàn thành: Nếu có điểm > 0, tính là đã hoàn thành 1/2 khóa học.
  const completedCourses = score > 0 ? 1 : 0;
  const completedCoursesEl = document.getElementById("stat-courses-completed");
  if (completedCoursesEl)
    animateValue(completedCoursesEl, 0, completedCourses, animationDuration);

  // 2. Điểm trung bình: Tính dựa trên điểm của 1 bài kiểm tra (20 câu).
  const averageScorePercent =
    TOTAL_QUIZ_QUESTIONS > 0 ? (score / TOTAL_QUIZ_QUESTIONS) * 100 : 0;
  const averageScoreEl = document.getElementById("stat-average-score");
  if (averageScoreEl) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(
        (timestamp - startTimestamp) / animationDuration,
        1
      );
      const currentValue = progress * averageScorePercent;
      averageScoreEl.innerHTML = `${currentValue.toFixed(0)}%`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // 3. Giờ học tích lũy (Giả định mỗi khóa học hoàn thành là 5 giờ)
  const studyHoursPerCourse = 5;
  const totalStudyHours = completedCourses * studyHoursPerCourse;
  const studyHoursEl = document.getElementById("stat-study-hours");
  if (studyHoursEl)
    animateValue(studyHoursEl, 0, totalStudyHours, animationDuration);

  // 4. Đánh giá học viên (Dựa trên điểm, thang 5 sao)
  const rating = score > 0 ? (score / TOTAL_QUIZ_QUESTIONS) * 4 + 1 : 0;
  const ratingEl = document.getElementById("stat-student-rating");
  if (ratingEl) {
    let startTimestampRating = null;
    const stepRating = (timestamp) => {
      if (!startTimestampRating) startTimestampRating = timestamp;
      const progress = Math.min(
        (timestamp - startTimestampRating) / animationDuration,
        1
      );
      const currentValue = progress * rating;
      ratingEl.innerHTML = `${currentValue.toFixed(1)}★`;
      if (progress < 1) {
        window.requestAnimationFrame(stepRating);
      }
    };
    window.requestAnimationFrame(stepRating);
  }
}

/**
 * Fetches all necessary user data for the dashboard from the backend.
 */
async function loadDashboardData() {
  if (!currentUser) return;

  const highscoreEl = document.getElementById("quiz-highscore");
  try {
    const response = await fetch(
      `/api/get-quiz-score?userId=${currentUser.id}&quizId=${RICE_QUIZ_ID}`
    );
    let scoreData = { score: 0 }; // Default to 0
    if (response.ok) {
      scoreData = await response.json();
    } else {
      console.error("Failed to fetch score, defaulting to 0.");
    }

    // Update high score display in the quiz section
    if (highscoreEl) {
      highscoreEl.textContent = `${
        scoreData.score || 0
      }/${TOTAL_QUIZ_QUESTIONS}`;
    }

    // Update the main dashboard stats based on fetched score
    updateDashboardStats(scoreData);
  } catch (error) {
    console.error("Error loading user data:", error);
    if (highscoreEl) highscoreEl.textContent = "Lỗi";
    // Update stats with zero state in case of error
    updateDashboardStats({ score: 0 });
  }
}

// --- END: HOÀN THIỆN THUẬT TOÁN TÍNH TOÁN ---

// Function to set up UI for logged-in users
function setupUserUI() {
  if (!currentUser) return;

  document.getElementById("user-info").style.display = "flex";
  document.getElementById("guest-menu").style.display = "none";
  document.getElementById("profile-tab").style.display = "flex";
  document.getElementById("create-post-btn").style.display = "inline-block";
  document.getElementById("forum-login-prompt").style.display = "none";
  const guestMessage = document.getElementById("guest-welcome-message");
  if (guestMessage) guestMessage.style.display = "none";

  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.classList.remove("disabled");
    startQuizBtn.removeAttribute("title");
  }

  // **FIXED LOGIC**: Setup for course cards for logged-in users
  document.querySelectorAll(".course-card").forEach((card) => {
    const joinButton = card.querySelector(".btn-join-course");
    const loginPrompt = card.querySelector(".course-login-prompt");

    // Show the details button and hide the login prompt
    if (joinButton) joinButton.style.display = "inline-block";
    if (loginPrompt) loginPrompt.style.display = "none";

    // No special click handler needed. The card is an <a> tag
    // and will navigate to its href attribute correctly.
  });

  // Call function to load and calculate data
  loadDashboardData();

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
    startQuizBtn.href = "#"; // Prevent navigation
    startQuizBtn.onclick = (e) => e.preventDefault();
    startQuizBtn.title = "Vui lòng đăng nhập để làm bài kiểm tra";
  }

  // **FIXED LOGIC**: Setup for course cards for guest users
  document.querySelectorAll(".course-card").forEach((card) => {
    const joinButton = card.querySelector(".btn-join-course");
    const loginPrompt = card.querySelector(".course-login-prompt");

    // Hide the details button and show the login prompt
    if (joinButton) joinButton.style.display = "none";
    if (loginPrompt) loginPrompt.style.display = "block";

    // Make the entire card redirect to login page
    card.addEventListener("click", function (event) {
      // This check allows the inner "đăng nhập" link to work correctly
      // because it has event.stopPropagation() in the HTML.
      event.preventDefault();
      window.location.href = "login.html";
    });
  });

  // Reset stats to 0 for guests
  document.getElementById("stat-courses-completed").textContent = "0";
  document.getElementById("stat-average-score").textContent = "0%";
  document.getElementById("stat-study-hours").textContent = "0";
  document.getElementById("stat-student-rating").textContent = "0.0★";

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
    if (dashboardSection) {
      if (dashboardSection.firstChild) {
        dashboardSection.insertBefore(
          guestMessage,
          dashboardSection.firstChild
        );
      } else {
        dashboardSection.appendChild(guestMessage);
      }
    }
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

// Weather function
async function getWeather(location = "Hanoi") {
  const weatherWidget = document.querySelector(".weather-widget");
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang tải dữ liệu thời tiết...</p>";
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

    const weatherTranslations = {
      Sunny: "Trời nắng",
      Clear: "Trời quang",
      "Partly cloudy": "Trời có mây",
      Cloudy: "Trời nhiều mây",
      Overcast: "Trời u ám",
      Mist: "Sương mù",
      "Patchy rain possible": "Có thể có mưa vài nơi",
      Fog: "Sương mù",
      "Light rain": "Mưa nhỏ",
      "Moderate rain": "Mưa vừa",
      "Heavy rain": "Mưa to",
    };
    const englishDescription = currentWeather.weatherDesc?.[0]?.value || "";
    const weatherDescription =
      weatherTranslations[englishDescription] ||
      englishDescription ||
      "Không có mô tả";
    const getIconClass = (code) =>
      ({
        113: "fa-sun",
        116: "fa-cloud-sun",
        119: "fa-cloud",
        122: "fa-cloud",
        266: "fa-cloud-rain",
        296: "fa-cloud-showers-heavy",
        302: "fa-cloud-showers-heavy",
      }[code] || "fa-cloud-sun");

    const forecast = weatherData.weather?.slice(0, 4) || [];
    const area = weatherData.nearest_area?.[0];
    const locationName = area?.areaName?.[0]?.value || location;
    const countryName = area?.country?.[0]?.value || "";

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
                  .map(
                    (day, index) =>
                      `<div class="forecast-item"><div>${
                        dayNames[(today + index) % 7]
                      }</div><i class="fas ${getIconClass(
                        day.hourly?.[4]?.weatherCode || "116"
                      )}"></i><div>${day.maxtempC}°</div></div>`
                  )
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

// Functions for other buttons with login check
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

  getWeather();
});
