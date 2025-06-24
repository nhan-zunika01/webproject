// Global variable for current user
let currentUser = null;
const RICE_QUIZ_ID = "rice-basics-v1"; // ID của bài kiểm tra duy nhất
const TOTAL_QUIZ_QUESTIONS = 20; // Tổng số câu hỏi trong bài kiểm tra

// Modal thông báo
const alertModal = document.getElementById("alert-modal");
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmModalConfirmBtn = document.getElementById(
  "confirm-modal-confirm-btn"
);
const confirmModalCancelBtn = document.getElementById(
  "confirm-modal-cancel-btn"
);

function showAlert(message) {
  const alertModal = document.getElementById("alert-modal");
  const modalMessage = document.getElementById("modal-message");
  if (modalMessage && alertModal) {
    modalMessage.textContent = message;
    alertModal.classList.add("active");
  }
}


function closeAlertModal() {
  if (alertModal) {
    alertModal.classList.remove("active");
  }
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeAlertModal);
}
if (alertModal) {
  alertModal.addEventListener("click", (e) => {
    if (e.target === alertModal) {
      closeAlertModal();
    }
  });
}

function showConfirm(message, onConfirm) {
  if (
    confirmModal &&
    confirmModalMessage &&
    confirmModalConfirmBtn &&
    confirmModalCancelBtn
  ) {
    confirmModalMessage.textContent = message;
    confirmModal.classList.add("active");
    confirmModalConfirmBtn.onclick = () => {
      closeConfirmModal();
      onConfirm();
    };
  }
}

function closeConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.remove("active");
  }
}

if (confirmModal) {
  confirmModalCancelBtn.addEventListener("click", closeConfirmModal);
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
      closeConfirmModal();
    }
  });
}

function showSection(sectionId, element) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add("active");
  }
  if (element) {
    element.classList.add("active");
  }
  const titleElement = document.getElementById("main-content-title");
  if (titleElement && element) {
    const titleText = element.querySelector("span").textContent;
    titleElement.textContent = titleText;
  }
}

function logout() {
  showConfirm("Bạn có chắc chắn muốn đăng xuất?", () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  });
}

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

function updateDashboardStats(highScore) {
  const score = highScore || 0;
  const animationDuration = 1500;
  const completedCourses = score > 0 ? 1 : 0;
  const completedCoursesEl = document.getElementById("stat-courses-completed");
  if (completedCoursesEl)
    animateValue(completedCoursesEl, 0, completedCourses, animationDuration);

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

  const studyHoursPerCourse = 5;
  const totalStudyHours = completedCourses * studyHoursPerCourse;
  const studyHoursEl = document.getElementById("stat-study-hours");
  if (studyHoursEl)
    animateValue(studyHoursEl, 0, totalStudyHours, animationDuration);

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

async function loadDashboardData() {
  // SỬA LỖI: Kiểm tra cả currentUser và access_token
  if (!currentUser || !currentUser.access_token) return;

  const highscoreEl = document.getElementById("quiz-highscore");
  try {
    // SỬA LỖI: Gửi header Authorization và sử dụng đúng API
    const response = await fetch(`/api/get-quiz-score?quizId=${RICE_QUIZ_ID}`, {
      headers: {
        Authorization: `Bearer ${currentUser.access_token}`,
      },
    });
    let scoreData = { high_score: 0 };
    if (response.ok) {
      scoreData = await response.json();
    } else {
      console.error("Không thể lấy điểm, sử dụng giá trị mặc định là 0.");
    }

    const highScore = scoreData.high_score || 0;

    if (highscoreEl) {
      highscoreEl.textContent = `${highScore}/${TOTAL_QUIZ_QUESTIONS}`;
    }
    // SỬA LỖI: Chỉ truyền điểm cao nhất vào hàm thống kê
    updateDashboardStats(highScore);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu người dùng:", error);
    if (highscoreEl) highscoreEl.textContent = "Lỗi";
    updateDashboardStats(0); // Truyền 0 khi có lỗi
  }
}

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
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "inline-block";
    if (loginPrompt) loginPrompt.style.display = "none";
  });
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
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "none";
    if (loginPrompt) loginPrompt.style.display = "block";
  });
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
    if (dashboardSection.firstChild) {
      dashboardSection.insertBefore(guestMessage, dashboardSection.firstChild);
    } else {
      dashboardSection.appendChild(guestMessage);
    }
  }
}

async function editProfile(button) {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!currentUser) {
    showAlert("Vui lòng đăng nhập để sử dụng tính năng này.");
    return;
  }

  const profileForm = document.getElementById("profile");
  const inputs = profileForm.querySelectorAll('input:not([type="email"])');

  // Nếu người dùng đang ở chế độ xem và nhấn "Chỉnh sửa"
  if (button.textContent.includes("Chỉnh sửa")) {
    // Cho phép chỉnh sửa các ô nhập liệu
    inputs.forEach((input) => input.removeAttribute("readonly"));
    // Đổi nút thành "Lưu thay đổi"
    button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
  }
  // Nếu người dùng đang ở chế độ chỉnh sửa và nhấn "Lưu thay đổi"
  else {
    // Vô hiệu hóa nút và hiển thị trạng thái "Đang lưu..." để tránh nhấp nhiều lần
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    // Lấy dữ liệu mới từ các ô nhập liệu
    const newName = document.getElementById("profile-name").value;
    const newPhone = document.getElementById("profile-phone").value;

    try {
      // Gọi API ở máy chủ để cập nhật thông tin
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Gửi kèm token xác thực để máy chủ biết ai đang yêu cầu
          Authorization: `Bearer ${currentUser.access_token}`,
        },
        body: JSON.stringify({ name_user: newName, phone_user: newPhone }),
      });

      const result = await response.json();

      // Nếu máy chủ trả về lỗi, ném lỗi để khối catch xử lý
      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi cập nhật.");
      }

      // Nếu cập nhật thành công trên máy chủ:
      // 1. Cập nhật thông tin người dùng trong biến `currentUser`
      currentUser.name_user = newName;
      currentUser.phone_user = newPhone;
      // 2. Cập nhật lại dữ liệu trong localStorage của trình duyệt
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // 3. Khóa các ô nhập liệu lại
      inputs.forEach((input) => input.setAttribute("readonly", true));

      // 4. Cập nhật lại tên chào mừng ở góc trên bên phải
      const usernameSpan = document.querySelector(".user-menu .username");
      if (usernameSpan) {
        usernameSpan.textContent = `Chào, ${newName}!`;
      }

      // 5. Thông báo thành công cho người dùng
      showAlert("Thông tin đã được cập nhật thành công!");
      // 6. Đổi nút trở lại trạng thái "Chỉnh sửa"
      button.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa thông tin';
    } catch (error) {
      // Nếu có bất kỳ lỗi nào xảy ra, thông báo cho người dùng
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      showAlert(error.message);
      // Trả lại trạng thái "Lưu thay đổi" để người dùng có thể thử lại
      button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    } finally {
      // Dù thành công hay thất bại, luôn bật lại nút sau khi xử lý xong
      button.disabled = false;
    }
  }
}

const weatherWidget = document.querySelector(".weather-widget");
const autoLocationBtn = document.getElementById("auto-location-btn");
const provinceSelect = document.getElementById("province-select");
const districtSelect = document.getElementById("district-select");

async function loadProvinces() {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/p/");
    if (!response.ok) throw new Error("Không thể tải danh sách tỉnh thành");
    const provinces = await response.json();
    provinceSelect.innerHTML =
      '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
    provinces.forEach((province) => {
      const option = document.createElement("option");
      option.value = province.code;
      option.textContent = province.name;
      provinceSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi tải tỉnh/thành phố:", error);
    provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

async function loadDistricts(provinceCode) {
  if (!provinceCode) {
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
    districtSelect.disabled = true;
    return;
  }
  try {
    districtSelect.disabled = true;
    districtSelect.innerHTML = '<option value="">Đang tải...</option>';
    const response = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    if (!response.ok) throw new Error("Không thể tải danh sách quận huyện");
    const provinceData = await response.json();
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
    provinceData.districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district.name;
      option.textContent = district.name;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) {
    console.error("Lỗi tải quận/huyện:", error);
    districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

provinceSelect.addEventListener("change", () =>
  loadDistricts(provinceSelect.value)
);

function changeWeatherLocation() {
  const districtName = districtSelect.value;
  const provinceName =
    provinceSelect.options[provinceSelect.selectedIndex].text;
  if (districtName && provinceName && provinceSelect.value) {
    const locationQuery = `${districtName}, ${provinceName}`;
    getWeatherByManualSelection(locationQuery);
  } else {
    showAlert("Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện.");
  }
}

async function getWeatherByManualSelection(locationQuery) {
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang tìm kiếm và tải dữ liệu thời tiết...</p>";

  try {
    const response = await fetch(
      `/api/get-weather?location=${encodeURIComponent(locationQuery)}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Lỗi ${response.status}: ${errorData.message}`);
    }
    const weatherData = await response.json();
    renderWeatherData(weatherData.current, weatherData.forecast, locationQuery);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thời tiết:", error);
    weatherWidget.innerHTML = `<p style="color: #ffcccc; font-weight: bold;">Lỗi: ${error.message}</p>`;
  }
}

async function getWeatherByBrowser() {
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang yêu cầu quyền truy cập vị trí...</p>";
  autoLocationBtn.disabled = true;

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        weatherWidget.innerHTML =
          "<p>Đã có tọa độ, đang tải dữ liệu thời tiết...</p>";

        try {
          const response = await fetch(
            `/api/get-weather?lat=${lat}&lon=${lon}`
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi ${response.status}: ${errorData.message}`);
          }
          const weatherData = await response.json();
          const locationName = await getLocationName(lat, lon);
          renderWeatherData(
            weatherData.current,
            weatherData.forecast,
            locationName
          );
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu thời tiết:", error);
          weatherWidget.innerHTML = `<p style="color: #ffcccc; font-weight: bold;">Lỗi: ${error.message}</p>`;
        } finally {
          autoLocationBtn.disabled = false;
        }
      },
      (error) => {
        let message = "Không thể lấy vị trí của bạn.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt nếu muốn sử dụng tính năng này.";
        }
        weatherWidget.innerHTML = `<p style="color: #ffcccc;">${message}</p>`;
        autoLocationBtn.disabled = false;
      }
    );
  } else {
    weatherWidget.innerHTML =
      "<p>Trình duyệt của bạn không hỗ trợ tính năng định vị tự động.</p>";
    autoLocationBtn.disabled = false;
  }
}

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`
    );
    const data = await response.json();
    if (data && data.address) {
      const { road, suburb, village, town, city_district, city, state } =
        data.address;
      const locationParts = [
        road,
        suburb || village || town,
        city_district,
        city || state,
      ].filter(Boolean);
      return locationParts.join(", ");
    }
    return "Vị trí của bạn";
  } catch (error) {
    console.error("Lỗi khi lấy tên địa danh:", error);
    return "Vị trí của bạn";
  }
}

function renderWeatherData(current, forecast, locationName) {
  const getIconClass = (iconCode) => {
    const firstTwoChars = iconCode.substring(0, 2);
    const iconMap = {
      "01": "fa-sun",
      "02": "fa-cloud-sun",
      "03": "fa-cloud",
      "04": "fa-cloud-meatball",
      "09": "fa-cloud-showers-heavy",
      10: "fa-cloud-sun-rain",
      11: "fa-poo-storm",
      13: "fa-snowflake",
      50: "fa-smog",
    };
    return iconMap[firstTwoChars] || "fa-cloud-sun";
  };
  const currentTemp = Math.round(current.main.temp);
  const weatherDescription = current.weather[0].description;
  const currentIcon = getIconClass(current.weather[0].icon);
  const dailyForecasts = [];
  const processedDays = {};
  const today = new Date().getUTCDate();
  for (const entry of forecast.list) {
    const entryDate = new Date(entry.dt * 1000);
    const dayKey = entryDate.getUTCDate();
    if (
      dayKey !== today &&
      !processedDays[dayKey] &&
      dailyForecasts.length < 4
    ) {
      dailyForecasts.push(entry);
      processedDays[dayKey] = true;
    }
  }
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  weatherWidget.innerHTML = `
    <div class="weather-main">
        <i class="fas ${currentIcon}"></i>
        <div class="weather-temp">${currentTemp}°C</div>
        <div class="weather-location">${locationName}</div>
        <div class="weather-desc" style="text-transform: capitalize;">${weatherDescription}</div>
    </div>
    <div class="weather-forecast">
        ${dailyForecasts
          .map(
            (day) => `
            <div class="forecast-item">
                <div>${dayNames[new Date(day.dt * 1000).getDay()]}</div>
                <i class="fas ${getIconClass(day.weather[0].icon)}"></i>
                <div>${Math.round(day.main.temp_max)}°</div>
            </div>`
          )
          .join("")}
    </div>
  `;
}

function createPost() {
  if (!currentUser) {
    showAlert("Vui lòng đăng nhập để tạo bài viết.");
    return;
  }
  showAlert(
    "Chức năng tạo bài viết mới đang được phát triển. Vui lòng quay lại sau!"
  );
}

document.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("currentUser");
  if (userData) {
    currentUser = JSON.parse(userData);
    setupUserUI();
  } else {
    setupGuestUI();
  }

  if (autoLocationBtn) {
    autoLocationBtn.addEventListener("click", getWeatherByBrowser);
  }

  loadProvinces();

  const hash = window.location.hash.substring(1);
  if (hash) {
    const targetLink = document.querySelector(`.nav-tab[onclick*="'${hash}'"]`);
    if (targetLink) {
      showSection(hash, targetLink);
    }
  }
});
