// Global variables
let currentUser = null; // Khởi tạo là null
let quizAnswers = {
  q1: "b", // correct answer
  q2: "c", // correct answer
  q3: "b", // correct answer
};

// Navigation function
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  // Remove active class from all tabs
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected section
  document.getElementById(sectionId).classList.add("active");

  // Add active class to clicked tab
  event.target.classList.add("active");
}

// Course functions
function startCourse(courseId) {
  let courseName = "";
  switch (courseId) {
    case "rice":
      courseName = "Kỹ thuật trồng lúa hiệu quả";
      break;
    case "chicken":
      courseName = "Chăn nuôi gà an toàn";
      break;
    case "hydroponic":
      courseName = "Trồng rau sạch thủy canh";
      break;
    case "smart":
      courseName = "Nông nghiệp thông minh 4.0";
      break;
  }

  alert(`Đang mở khóa học: ${courseName}\n\nTính năng đang được phát triển...`);
}

// Quiz functions
function submitQuiz() {
  const form = document.querySelector(".quiz-container");
  const questions = ["q1", "q2", "q3"];
  let userAnswers = {};
  let score = 0;

  // Get user answers
  questions.forEach((q) => {
    const selected = form.querySelector(`input[name="${q}"]:checked`);
    if (selected) {
      userAnswers[q] = selected.value;
      if (selected.value === quizAnswers[q]) {
        score++;
      }
    }
  });

  // Check if all questions are answered
  if (Object.keys(userAnswers).length < questions.length) {
    alert("Vui lòng trả lời tất cả các câu hỏi!");
    return;
  }

  // Calculate percentage
  const percentage = Math.round((score / questions.length) * 100);

  // Show result
  let resultMessage = `Kết quả kiểm tra:\n\n`;
  resultMessage += `Số câu đúng: ${score}/${questions.length}\n`;
  resultMessage += `Điểm số: ${percentage}%\n\n`;

  if (percentage >= 80) {
    resultMessage += `🎉 Xuất sắc! Bạn đã nắm vững kiến thức.`;
  } else if (percentage >= 60) {
    resultMessage += `👍 Khá tốt! Bạn cần ôn lại một số kiến thức.`;
  } else {
    resultMessage += `📚 Cần cố gắng hơn! Hãy xem lại bài học.`;
  }

  alert(resultMessage);
}

function showQuizResult() {
  const resultHTML = `
        <div class="alert alert-success">
            <h4><i class="fas fa-trophy"></i> Kết quả bài kiểm tra gần nhất</h4>
            <p><strong>Bài kiểm tra:</strong> Kỹ thuật trồng lúa cơ bản</p>
            <p><strong>Thời gian:</strong> 12 phút 30 giây</p>
            <p><strong>Điểm số:</strong> 85% (Khá tốt)</p>
            <p><strong>Số câu đúng:</strong> 17/20 câu</p>
            <p><strong>Xếp hạng:</strong> Top 15% lớp học</p>
        </div>
    `;

  // Insert result after quiz container
  const quizContainer = document.querySelector(".quiz-container");
  if (!document.querySelector(".quiz-result")) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "quiz-result";
    resultDiv.innerHTML = resultHTML;
    quizContainer.parentNode.insertBefore(resultDiv, quizContainer.nextSibling);
  }
}

// Forum functions
function showNewPostForm() {
  const formHTML = `
        <div class="forum-post" style="border-left: 4px solid #2196F3;">
            <h3><i class="fas fa-plus"></i> Tạo bài viết mới</h3>
            <div class="form-group">
                <label>Tiêu đề:</label>
                <input type="text" placeholder="Nhập tiêu đề bài viết..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 5px;">
            </div>
            <div class="form-group">
                <label>Nội dung:</label>
                <textarea placeholder="Chia sẻ kinh nghiệm, đặt câu hỏi..." rows="5" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 5px; resize: vertical;"></textarea>
            </div>
            <div class="form-group">
                <label>Chủ đề:</label>
                <select style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 5px;">
                    <option>Trồng trọt</option>
                    <option>Chăn nuôi</option>
                    <option>Công nghệ</option>
                    <option>Kinh nghiệm</option>
                    <option>Khác</option>
                </select>
            </div>
            <button class="btn" onclick="submitPost()">
                <i class="fas fa-paper-plane"></i> Đăng bài
            </button>
            <button class="btn" onclick="cancelPost()" style="background: #666; margin-left: 10px;">
                <i class="fas fa-times"></i> Hủy
            </button>
        </div>
    `;

  const forumSection = document.getElementById("forum");
  if (!document.querySelector(".new-post-form")) {
    const formDiv = document.createElement("div");
    formDiv.className = "new-post-form";
    formDiv.innerHTML = formHTML;
    forumSection.insertBefore(formDiv, forumSection.children[2]);
  }
}

function submitPost() {
  alert(
    "Bài viết đã được đăng thành công!\n\nCảm ơn bạn đã chia sẻ kiến thức với cộng đồng."
  );
  cancelPost();
}

function cancelPost() {
  const form = document.querySelector(".new-post-form");
  if (form) {
    form.remove();
  }
}

// Profile functions
function editProfile() {
  const inputs = document.querySelectorAll("#profile input");
  const editBtn = document.querySelector("#profile .btn");

  if (editBtn.textContent.includes("Chỉnh sửa")) {
    // Enable editing
    inputs.forEach((input) => {
      if (input.type !== "email") {
        // Giữ email và tên tài khoản không thể sửa
        input.removeAttribute("readonly");
        input.style.borderColor = "#4CAF50";
      }
    });
    editBtn.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    editBtn.style.background = "#4CAF50";
  } else {
    // Save changes
    // Cập nhật đối tượng currentUser trong JavaScript
    currentUser.name_user = document.querySelector(
      'input[data-key="name_user"]'
    ).value;
    currentUser.phone_user = document.querySelector(
      'input[data-key="phone_user"]'
    ).value;
    // Giả sử có thêm các trường address và specialty
    // currentUser.address = document.querySelector('input[data-key="address"]').value;
    // currentUser.specialty = document.querySelector('input[data-key="specialty"]').value;

    // Lưu lại vào localStorage
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    // TODO: Gửi các thay đổi này lên backend để cập nhật vào database

    inputs.forEach((input) => {
      input.setAttribute("readonly", true);
      input.style.borderColor = "#e0e0e0";
    });
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa thông tin';
    editBtn.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";

    alert("Thông tin đã được cập nhật thành công!");
  }
}

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    // Xóa dữ liệu người dùng khỏi localStorage
    localStorage.removeItem("currentUser");
    alert("Đã đăng xuất thành công!");
    // Chuyển về trang đăng nhập
    window.location.href = "login.html";
  }
}

function loadProfileData() {
  if (!currentUser) return;

  // Cập nhật các trường input trong Profile
  document.querySelector(".login-form h3").textContent = currentUser.name_user;

  // Thêm data-key để dễ dàng truy vấn
  document.querySelector('#profile .form-group input[type="text"]').value =
    currentUser.name_user;
  document.querySelector(
    '#profile .form-group input[type="text"]'
  ).dataset.key = "name_user";

  document.querySelector('#profile .form-group input[type="email"]').value =
    currentUser.email_user;
  document.querySelector(
    '#profile .form-group input[type="email"]'
  ).dataset.key = "email_user";

  document.querySelector('#profile .form-group input[type="tel"]').value =
    currentUser.phone_user;
  document.querySelector('#profile .form-group input[type="tel"]').dataset.key =
    "phone_user";

  // Bạn có thể thêm các trường khác như địa chỉ, chuyên môn nếu có trong DB
  // document.querySelector('input[data-key="address"]').value = currentUser.address || '';
  // document.querySelector('input[data-key="specialty"]').value = currentUser.specialty || '';
}


// Weather update function
function updateWeather() {
  // Simulate real-time weather updates
  const weatherDetails = document.querySelectorAll(".weather-detail");
  const temps = ["28°C", "30°C", "26°C", "25°C"];
  const conditions = ["Nắng đẹp", "Có mây", "Mưa nhẹ", "Mưa to"];

  // This would typically fetch from weather API
  console.log("Weather updated");
}

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  console.log("Sổ tay nông dân thông minh đã được khởi tạo");

  // Simulate data loading
  setTimeout(() => {
    console.log("Dữ liệu đã được tải");
  }, 1000);

  // Update weather every 30 minutes (in real app)
  setInterval(updateWeather, 1800000);
});

// Add some interactive effects
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("course-card")) {
    e.target.style.transform = "scale(1.02)";
    setTimeout(() => {
      e.target.style.transform = "scale(1)";
    }, 200);
  }
});

// Add keyboard navigation
document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const userData = localStorage.getItem("currentUser");
  if (!userData) {
    // Nếu chưa, chuyển về trang đăng nhập
    alert("Vui lòng đăng nhập để tiếp tục.");
    window.location.href = "login.html";
    return; // Dừng thực thi script
  }

  // Nếu đã đăng nhập, phân tích dữ liệu và gán cho currentUser
  currentUser = JSON.parse(userData);

  console.log("Sổ tay nông dân thông minh đã được khởi tạo");
  console.log("Người dùng hiện tại:", currentUser.name_account);

  // Tải dữ liệu hồ sơ lên giao diện
  loadProfileData();

  // Simulate data loading
  setTimeout(() => {
    console.log("Dữ liệu đã được tải");
  }, 1000);

  // Update weather every 30 minutes
  setInterval(updateWeather, 1800000);
});


// Simulate real-time notifications
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type}`;
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.zIndex = "1000";
  notification.style.minWidth = "300px";
  notification.innerHTML = `
        <i class="fas fa-bell"></i> ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Simulate periodic notifications
setTimeout(() => {
  showNotification("Nhắc nhở: Đã đến lúc tưới nước cho cây trồng!", "success");
}, 10000);

setTimeout(() => {
  showNotification("Thời tiết: Dự báo mưa trong 2 ngày tới", "success");
}, 20000);
