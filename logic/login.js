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

  const identifier = document.getElementById("login-identifier").value.trim();
  const password_account = document.getElementById("login-password").value;

  if (!identifier || !password_account) {
    setMessage(
      "error-login-general",
      "Vui lòng nhập đầy đủ email/tên tài khoản và mật khẩu."
    );
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password_account }),
    });

    const result = await response.json();

    if (response.ok) {
      // Status 200-299
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      window.location.href = "dash.html";
    } else {
      // Handle error codes from the backend
      // The backend now provides more specific messages and statuses
      setMessage("error-login-general", result.message || "Đã có lỗi xảy ra.");
    }
  } catch (error) {
    console.error("Login error:", error);
    setMessage("error-login-general", "Không thể kết nối đến máy chủ.");
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  clearAllMessages();

  const email = document.getElementById("forgot-email").value.trim();

  if (!email) {
    setMessage("error-forgot-password", "Vui lòng nhập địa chỉ email của bạn.");
    return;
  }

  try {
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage(
        "success-forgot-password",
        "Nếu email tồn tại, một liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư.",
        false
      );
    } else {
      setMessage(
        "error-forgot-password",
        result.message || "Đã có lỗi xảy ra."
      );
    }
  } catch (error) {
    console.error("Password reset error:", error);
    setMessage("error-forgot-password", "Không thể kết nối đến máy chủ.");
  }
}

// === INITIALIZATION ===

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("currentUser")) {
    window.location.href = "dash.html";
    return;
  }

  document
    .getElementById("login-form")
    ?.addEventListener("submit", handleLogin);
  document
    .getElementById("forgot-password-form")
    ?.addEventListener("submit", handleForgotPassword);
});
