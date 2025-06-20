// File: auth.js

// THAY ĐỔI LỚN: Không còn API_URL cố định.
// Chúng ta sẽ sử dụng các đường dẫn tương đối.
// Khi chạy trên Cloudflare, /api/register sẽ tự động gọi đến function của bạn.

function toggleForms() {
  document.getElementById("login-form-container").classList.toggle("active");
  document.getElementById("register-form-container").classList.toggle("active");
}

async function handleRegister() {
  const name_account = document.getElementById("reg-name-account").value;
  const password_account = document.getElementById("reg-password").value;
  const name_user = document.getElementById("reg-name-user").value;
  const email_user = document.getElementById("reg-email").value;
  const phone_user = document.getElementById("reg-phone").value;

  // Validation có thể giữ nguyên
  if (
    !name_account ||
    !password_account ||
    !name_user ||
    !email_user ||
    !phone_user
  ) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  try {
    // Gọi đến hàm serverless tại /api/register
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
      alert(result.message);
      toggleForms();
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

async function handleLogin() {
  const email_user = document.getElementById("login-email").value;
  const password_account = document.getElementById("login-password").value;

  if (!email_user || !password_account) {
    alert("Vui lòng nhập email và mật khẩu!");
    return;
  }

  try {
    // Gọi đến hàm serverless tại /api/login
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_user, password_account }),
    });
    const result = await response.json();
    if (response.ok) {
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      window.location.href = "index.html";
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// Đoạn code này giữ nguyên
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("currentUser")) {
    window.location.href = "index.html";
  }
});
