// File: logic/login.js

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
    // Hiển thị message box nếu có nội dung
    element.style.display = message ? 'block' : 'none';
  }
}

// === EVENT HANDLERS ===

async function handleLogin(event) {
  event.preventDefault();
  clearAllMessages();

  const email_user = document.getElementById("login-email").value.trim();
  const password_account = document.getElementById("login-password").value;
  const submitBtn = document.getElementById("login-btn");

  // Lấy token từ widget Login
  const formData = new FormData(document.getElementById("login-form"));
  const turnstileToken = formData.get("cf-turnstile-response");

  if (!email_user || !password_account) {
    setMessage(
      "error-login-general",
      "Vui lòng nhập đầy đủ email và mật khẩu."
    );
    return;
  }

  if (!turnstileToken) {
    setMessage("error-login-general", "Vui lòng hoàn thành xác thực bảo mật (CAPTCHA).");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Đang xử lý...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          email_user, 
          password_account,
          turnstileToken 
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Lưu thông tin user và chuyển hướng
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      window.location.href = "dash.html";
    } else {
      // Nếu lỗi, reset captcha để thử lại
      if (typeof turnstile !== 'undefined') turnstile.reset();
      setMessage("error-login-general", result.message || "Đã có lỗi xảy ra.");
    }
  } catch (error) {
    console.error("Login error:", error);
    setMessage("error-login-general", "Không thể kết nối đến máy chủ.");
  } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Đăng nhập";
  }
}

// === INITIALIZATION ===

document.addEventListener("DOMContentLoaded", () => {
  // Nếu đã đăng nhập thì chuyển luôn vào dash
  if (localStorage.getItem("currentUser")) {
    window.location.href = "dash.html";
    return;
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
  }
});