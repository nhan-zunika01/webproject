// File: auth.js

// Hàm chuyển đổi giữa form đăng nhập và đăng ký
function toggleForms() {
  document.getElementById("login-form-container").classList.toggle("active");
  document.getElementById("register-form-container").classList.toggle("active");
  // Reset các thông báo lỗi khi chuyển form
  clearAllErrorMessages();
}

// Hàm xóa tất cả thông báo lỗi
function clearAllErrorMessages() {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => (msg.textContent = ""));
}

// Hàm hiển thị lỗi cho một trường cụ thể
function setErrorMessage(fieldId, message) {
  document.getElementById(`error-${fieldId}`).textContent = message;
}

// Hàm xử lý sự kiện đăng ký
async function handleRegister(event) {
  event.preventDefault(); // Ngăn form gửi đi theo cách truyền thống
  clearAllErrorMessages(); // Xóa lỗi cũ

  const name_account = document.getElementById("reg-name-account").value.trim();
  const password_account = document.getElementById("reg-password").value.trim();
  const name_user = document.getElementById("reg-name-user").value.trim();
  const email_user = document.getElementById("reg-email").value.trim();
  const phone_user = document.getElementById("reg-phone").value.trim();

  // --- VALIDATION ---
  let isValid = true;
  if (!name_account) {
    setErrorMessage("reg-name-account", "Vui lòng nhập tên tài khoản.");
    isValid = false;
  } else if (name_account.length < 5) {
    setErrorMessage(
      "reg-name-account",
      "Tên tài khoản phải có ít nhất 5 ký tự."
    );
    isValid = false;
  }

  if (!password_account) {
    setErrorMessage("reg-password", "Vui lòng nhập mật khẩu.");
    isValid = false;
  } else if (password_account.length < 8) {
    setErrorMessage("reg-password", "Mật khẩu phải có ít nhất 8 ký tự.");
    isValid = false;
  }

  if (!name_user) {
    setErrorMessage("reg-name-user", "Vui lòng nhập họ và tên.");
    isValid = false;
  }

  if (!email_user) {
    setErrorMessage("reg-email", "Vui lòng nhập email.");
    isValid = false;
  }

  if (!phone_user) {
    setErrorMessage("reg-phone", "Vui lòng nhập số điện thoại.");
    isValid = false;
  }

  if (!isValid) {
    return; // Dừng nếu có lỗi
  }

  try {
    const response = await fetch("/api/register", {
      // Gọi đến Cloudflare Function
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
      // Chuyển sang trang chờ xác thực email
      window.location.href = "registration-pending.html";
    } else {
      // Kiểm tra lỗi email đã tồn tại từ phản hồi của Supabase
      if (
        result.message &&
        result.message.toLowerCase().includes("user already registered")
      ) {
        setErrorMessage("reg-email", "Địa chỉ email này đã được sử dụng.");
      } else {
        alert(`Lỗi đăng ký: ${result.message}`);
      }
    }
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    alert("Đã có lỗi xảy ra phía máy chủ, vui lòng thử lại sau.");
  }
}

// Hàm xử lý sự kiện đăng nhập
async function handleLogin(event) {
  event.preventDefault(); // Ngăn form gửi đi
  const email_user = document.getElementById("login-email").value;
  const password_account = document.getElementById("login-password").value;

  if (!email_user || !password_account) {
    alert("Vui lòng nhập email và mật khẩu!");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      // Gọi đến Cloudflare Function
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_user, password_account }),
    });

    const result = await response.json();
    if (response.ok) {
      // Kiểm tra xem email đã được xác thực chưa
      if (result.user.email_confirmed_at) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        window.location.href = "index.html";
      } else {
        alert(
          "Vui lòng xác thực email của bạn trước khi đăng nhập. Kiểm tra hộp thư đến (và cả spam) để tìm email xác thực."
        );
      }
    } else {
      alert(`Lỗi đăng nhập: ${result.message}`);
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// Lắng nghe sự kiện khi trang đã tải xong
document.addEventListener("DOMContentLoaded", () => {
  // Chuyển hướng nếu người dùng đã đăng nhập
  if (localStorage.getItem("currentUser")) {
    window.location.href = "index.html";
    return;
  }

  // Gán sự kiện cho các form
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});
