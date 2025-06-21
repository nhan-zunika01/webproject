// File: logic/login.js

// === HELPER FUNCTIONS ===

function clearAllMessages() {
  document
    .querySelectorAll(".message")
    .forEach((msg) => (msg.textContent = ""));
}

function setMessage(fieldId, message, isError = true) {
  const element = document.getElementById(fieldId);
  if (element) {
    element.textContent = message;
    element.className = isError
      ? "message error-message"
      : "message success-message";
  }
}

// Function to switch between login and forgot-password forms
function showForm(formIdToShow) {
  document.querySelectorAll(".form-container").forEach((container) => {
    container.classList.remove("active");
  });
  const formToShow = document.getElementById(formIdToShow);
  if (formToShow) {
    formToShow.classList.add("active");
  }
  clearAllMessages();
}

// === EVENT HANDLERS ===

async function handleLogin(event) {
  event.preventDefault();
  clearAllMessages();

  const email_user = document.getElementById("login-email").value.trim();
  const password_account = document.getElementById("login-password").value;
  const loginBtn = document.getElementById("login-btn");

  if (!email_user || !password_account) {
    setMessage(
      "error-login-general",
      "Vui lòng nhập đầy đủ email và mật khẩu."
    );
    return;
  }

  // Disable button and show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_user, password_account }),
    });

    const result = await response.json();
    if (response.ok) {
      if (result.user.email_confirmed_at) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        window.location.href = "index.html"; // Chuyển đến trang chính sau khi đăng nhập
      } else {
        setMessage(
          "error-login-general",
          "Vui lòng xác thực email của bạn trước khi đăng nhập."
        );
      }
    } else {
      setMessage(
        "error-login-general",
        result.message || "Email hoặc mật khẩu không chính xác."
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    setMessage(
      "error-login-general",
      "Không thể kết nối đến máy chủ. Vui lòng thử lại."
    );
  } finally {
    // Restore button state
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Đăng nhập";
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  clearAllMessages();

  const email = document.getElementById("forgot-email").value.trim();
  const submitBtn = event.target.querySelector(".btn-submit");

  if (!email) {
    setMessage("error-forgot-password", "Vui lòng nhập địa chỉ email của bạn.");
    return;
  }

  // --- BẮT ĐẦU: Phản hồi tức thì cho người dùng ---
  // Vô hiệu hóa nút và hiển thị trạng thái đang tải
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

  // Hiển thị thông báo thành công ngay lập tức để cải thiện trải nghiệm
  // Phía backend luôn trả về thông báo thành công chung vì lý do bảo mật
  setMessage(
    "success-forgot-password",
    "Nếu email tồn tại, một liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư.",
    false // Tham số isError = false
  );
  // --- KẾT THÚC: Phản hồi tức thì ---

  try {
    // Yêu cầu mạng sẽ chạy trong nền
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Nếu có lỗi từ server, chúng ta sẽ ghi đè thông báo thành công ở trên
    if (!response.ok) {
      const result = await response.json();
      setMessage(
        "error-forgot-password",
        result.message || "Đã có lỗi xảy ra."
      );
    }
  } catch (error) {
    console.error("Password reset error:", error);
    setMessage("error-forgot-password", "Không thể kết nối đến máy chủ.");
  } finally {
    // Luôn kích hoạt lại nút và khôi phục văn bản sau khi hoàn tất
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Gửi liên kết";
  }
}

// === INITIALIZATION ===

document.addEventListener("DOMContentLoaded", () => {
  // Logic chuyển hướng người dùng đã đăng nhập có thể được giữ lại hoặc xóa đi
  // Tạm thời vô hiệu hóa để dễ dàng kiểm tra
  /*
  if (localStorage.getItem("currentUser")) {
    window.location.href = "index.html"; 
    return;
  }
  */

  // Gắn sự kiện cho các form
  document
    .getElementById("login-form")
    ?.addEventListener("submit", handleLogin);
  document
    .getElementById("forgot-password-form")
    ?.addEventListener("submit", handleForgotPassword);
});
