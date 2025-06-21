// Global variable for current user
let currentUser = null;

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

// Function to set up UI for logged-in users
function setupUserUI() {
  if (!currentUser) return;

  document.getElementById("user-info").style.display = "flex";
  document.getElementById("guest-menu").style.display = "none";
  document.getElementById("profile-tab").style.display = "flex";
  document.getElementById("create-post-btn").style.display = "inline-block";
  document.getElementById("forum-login-prompt").style.display = "none";

  const usernameSpan = document.querySelector(".user-menu .username");
  if (usernameSpan) {
    usernameSpan.textContent = `Chào, ${currentUser.name_user}!`;
  }

  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profilePhone = document.getElementById("profile-phone");

  if (profileName) profileName.value = currentUser.name_user;
  if (profileEmail) profileEmail.value = currentUser.email_user;
  if (profilePhone) profilePhone.value = currentUser.phone_user;
}

// Function to set up UI for guest users
function setupGuestUI() {
  document.getElementById("user-info").style.display = "none";
  document.getElementById("guest-menu").style.display = "flex";
  document.getElementById("profile-tab").style.display = "none";
  document.getElementById("create-post-btn").style.display = "none";
  document.getElementById("forum-login-prompt").style.display = "block";

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

// === BẮT ĐẦU: Tính năng thời tiết động ===
async function getWeather(city = null) {
  const weatherWidget = document.querySelector(".weather-widget");
  if (!weatherWidget) return;

  weatherWidget.innerHTML = "<p>Đang tải dữ liệu thời tiết...</p>";
  let location = city;

  try {
    if (!location) {
      const ipResponse = await fetch("https://ipapi.co/json/");
      const ipData = await ipResponse.json();
      location = ipData.city || "Hanoi";
    }

    const weatherResponse = await fetch(
      `https://wttr.in/${location.trim().replace(/ /g, "+")}?format=j1`
    );
    if (!weatherResponse.ok) {
      throw new Error(
        "Không tìm thấy địa điểm. Vui lòng thử lại với tên tiếng Anh (vd: Hanoi)."
      );
    }
    const weatherData = await weatherResponse.json();

    const currentWeather = weatherData.current_condition[0];
    const forecast = weatherData.weather.slice(0, 4);

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
                <div class="weather-location">${
                  weatherData.nearest_area[0].areaName[0].value
                }, ${weatherData.nearest_area[0].country[0].value}</div>
                <div class="weather-desc">${
                  currentWeather.lang_vi[0].value
                }</div>
            </div>
            <div class="weather-forecast">
                ${forecast
                  .map((day, index) => {
                    // wttr.in API doesn't provide full date for forecast, so we approximate days
                    const dayIndex = (today + index + 1) % 7;
                    return `
                    <div class="forecast-item">
                        <div>${dayNames[dayIndex]}</div>
                        <i class="fas ${getIconClass(
                          day.hourly[4].weatherCode
                        )}"></i>
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
  if (locationInput && locationInput.value) {
    getWeather(locationInput.value);
  } else {
    // If input is empty, fetch for auto location
    getWeather();
  }
}
// === KẾT THÚC: Tính năng thời tiết động ===

// Functions for other buttons with login check
function startCourse(id) {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để tham gia khóa học.");
    return;
  }
  alert(`Bắt đầu khóa học ${id}...`);
}
function submitQuiz() {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để làm bài kiểm tra.");
    return;
  }
  alert("Bắt đầu bài kiểm tra...");
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

  // Automatically fetch weather on page load
  getWeather();
});
