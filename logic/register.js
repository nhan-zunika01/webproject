// File: register.js

// === HELPER FUNCTIONS ===

function clearAllMessages() {
  document
    .querySelectorAll(".message")
    .forEach((msg) => (msg.textContent = ""));
}

function setMessage(fieldId, message) {
  const element = document.getElementById(fieldId);
  if (element) {
    element.textContent = message;
  }
}

// === LOGIC ĐÁNH GIÁ MẬT KHẨU (MỚI) ===
function checkPasswordStrength() {
  const passwordInput = document.getElementById("reg-password");
  const strengthContainer = document.getElementById("password-strength-container");
  const strengthBarFill = document.getElementById("strength-bar-fill");
  const strengthText = document.getElementById("strength-text");
  
  // Các phần tử tiêu chí
  const critLength = document.getElementById("crit-length");
  const critUppercase = document.getElementById("crit-uppercase");
  const critNumber = document.getElementById("crit-number");
  const critSpecial = document.getElementById("crit-special");

  if (!passwordInput) return;

  // 1. Khi bấm vào ô (Focus): Hiện khung đánh giá ngay lập tức
  passwordInput.addEventListener("focus", function() {
      strengthContainer.style.display = "block"; 
      // Dùng requestAnimationFrame để đảm bảo transition hoạt động
      requestAnimationFrame(() => {
          strengthContainer.classList.add("visible");
      });
  });

  // 2. Khi thoát khỏi ô (Blur): Ẩn khung đánh giá
  passwordInput.addEventListener("blur", function() {
      strengthContainer.classList.remove("visible");
      // Đợi transition kết thúc (400ms) rồi mới ẩn display để không chiếm chỗ
      setTimeout(() => {
         if (!strengthContainer.classList.contains("visible")) {
             strengthContainer.style.display = "none";
         }
      }, 400);
  });

  // 3. Khi nhập liệu (Input): Tính toán và chạy thanh tiến trình
  passwordInput.addEventListener("input", function() {
    const password = passwordInput.value;
    
    // Nếu rỗng, reset về 0% nhưng vẫn giữ khung hiện
    if (password.length === 0) {
        strengthBarFill.style.width = "0%";
        strengthBarFill.style.backgroundColor = "transparent";
        strengthText.textContent = "";
        
        // Hiện lại tất cả tiêu chí
        critLength.classList.remove("met");
        critUppercase.classList.remove("met");
        critNumber.classList.remove("met");
        critSpecial.classList.remove("met");
        return;
    }

    let score = 0;

    // --- KIỂM TRA TỪNG TIÊU CHÍ ---
    // 1. Độ dài >= 8
    if (password.length >= 8) {
        score++;
        critLength.classList.add("met");
    } else {
        critLength.classList.remove("met");
    }

    // 2. Chữ hoa
    if (/[A-Z]/.test(password)) {
        score++;
        critUppercase.classList.add("met");
    } else {
        critUppercase.classList.remove("met");
    }

    // 3. Số
    if (/[0-9]/.test(password)) {
        score++;
        critNumber.classList.add("met");
    } else {
        critNumber.classList.remove("met");
    }

    // 4. Ký tự đặc biệt
    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
        critSpecial.classList.add("met");
    } else {
        critSpecial.classList.remove("met");
    }

    // --- TÍNH TOÁN THANH CHẠY ---
    let widthPercent = 0;
    let color = "";
    let text = "";
    let textColor = "";

    if (score === 0) {
        widthPercent = 5; // Nhích nhẹ 1 chút để biết có phản hồi
        color = "#ff4d4d"; // Đỏ
        text = "Rất yếu";
        textColor = "#ff4d4d";
    } else if (score === 1) {
        widthPercent = 25;
        color = "#ff4d4d"; // Đỏ
        text = "Rất yếu";
        textColor = "#ff4d4d";
    } else if (score === 2) {
        widthPercent = 50;
        color = "#ff9f43"; // Cam
        text = "Yếu";
        textColor = "#ff9f43";
    } else if (score === 3) {
        widthPercent = 75;
        color = "#feca57"; // Vàng
        text = "Trung bình";
        textColor = "#feca57";
    } else if (score === 4) {
        widthPercent = 100;
        color = "#1dd1a1"; // Xanh lá
        text = "Rất mạnh";
        textColor = "#1dd1a1";
    }

    // Xử lý đặc biệt: Nếu chưa đủ 8 ký tự -> Luôn báo yếu/ngắn (dù có đủ ký tự khác)
    // Nhưng vẫn cho thanh chạy lên để khích lệ người dùng
    if (password.length < 8) {
        text = "Quá ngắn";
        textColor = "#ff4d4d";
        if (score > 1) {
             // Nếu điểm cao nhưng ngắn, có thể giữ màu cam nhưng text cảnh báo
             // Ở đây ta giữ nguyên logic màu theo điểm để thanh chạy đẹp
        }
    }

    strengthBarFill.style.width = widthPercent + "%";
    strengthBarFill.style.backgroundColor = color;
    
    strengthText.textContent = text;
    strengthText.style.color = textColor;
  });
}

// === EVENT HANDLER ===

async function handleRegister(event) {
  event.preventDefault();
  clearAllMessages();

  const name_account = document.getElementById("reg-name-account").value.trim();
  const password_account = document.getElementById("reg-password").value.trim();
  const confirm_password = document.getElementById("reg-confirm-password").value.trim();
  const name_user = document.getElementById("reg-name-user").value.trim();
  const email_user = document.getElementById("reg-email").value.trim();
  const phone_user = document.getElementById("reg-phone").value.trim();

  let isValid = true;
  if (!name_account) {
    setMessage("error-reg-name-account", "Vui lòng nhập tên tài khoản.");
    isValid = false;
  }
  
  // Kiểm tra mật khẩu (đơn giản hóa ở đây vì người dùng đã thấy thanh trạng thái)
  if (!password_account || password_account.length < 8) {
    setMessage("error-reg-password", "Mật khẩu phải có ít nhất 8 ký tự.");
    isValid = false;
  }
  
  if (password_account !== confirm_password) {
    setMessage("error-reg-confirm-password", "Mật khẩu xác nhận không khớp.");
    isValid = false;
  }

  if (!name_user) {
    setMessage("error-reg-name-user", "Vui lòng nhập họ và tên.");
    isValid = false;
  }
  if (!email_user) {
    setMessage("error-reg-email", "Vui lòng nhập email.");
    isValid = false;
  }
  if (!phone_user) {
    setMessage("error-reg-phone", "Vui lòng nhập số điện thoại.");
    isValid = false;
  }

  if (!isValid) return;

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_user,
        password_account,
        name_account,
        name_user,
        phone_user,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      window.location.href = `registration-pending.html?email=${encodeURIComponent(
        email_user
      )}`;
    } else {
      setMessage(`error-reg-${result.field || "name-account"}`, result.message);
    }
  } catch (error) {
    console.error("Registration error:", error);
    setMessage(
      "error-reg-name-account",
      "Không thể kết nối đến máy chủ. Vui lòng thử lại."
    );
  }
}

// === INITIALIZATION ===

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("currentUser")) {
    window.location.href = "index.html"; 
    return;
  }

  checkPasswordStrength();

  document
    .getElementById("register-form")
    ?.addEventListener("submit", handleRegister);
});