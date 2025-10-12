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

// === EVENT HANDLER ===

async function handleRegister(event) {
  event.preventDefault();
  clearAllMessages();

  const name_account = document.getElementById("reg-name-account").value.trim();
  const password_account = document.getElementById("reg-password").value.trim();
  const name_user = document.getElementById("reg-name-user").value.trim();
  const email_user = document.getElementById("reg-email").value.trim();
  const phone_user = document.getElementById("reg-phone").value.trim();

  let isValid = true;
  if (!name_account) {
    setMessage("error-reg-name-account", "Vui lòng nhập tên tài khoản.");
    isValid = false;
  }
  if (!password_account || password_account.length < 8) {
    setMessage("error-reg-password", "Mật khẩu phải có ít nhất 8 ký tự.");
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
      // After successful registration, redirect to the registration pending page
      window.location.href = `registration-pending.html`;
    } else {
      // Display a more specific error if possible
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
  // Redirect if already logged in
  if (localStorage.getItem("currentUser")) {
    window.location.href = "index.html"; // Chuyển đến trang dashboard
    return;
  }

  // Attach event listener
  document
    .getElementById("register-form")
    ?.addEventListener("submit", handleRegister);
});
