// === CẬP NHẬT: Gộp tất cả logic vào một trình xử lý sự kiện ===
document.addEventListener("DOMContentLoaded", () => {
  // --- Bắt đầu: Logic kiểm tra trạng thái đăng nhập ---
  const guestNav = document.getElementById("guest-nav");
  const userNav = document.getElementById("user-nav");
  const currentUser = localStorage.getItem("currentUser");

  if (currentUser) {
    // Nếu người dùng đã đăng nhập
    if (guestNav) guestNav.style.display = "none";
    if (userNav) userNav.style.display = "block";
  } else {
    // Nếu là khách
    if (guestNav) guestNav.style.display = "flex"; // Sử dụng flex để các nút nằm cạnh nhau
    if (userNav) userNav.style.display = "none";
  }
  // --- Kết thúc: Logic kiểm tra trạng thái đăng nhập ---

  // --- Logic hiệu ứng header khi cuộn trang ---
  const header = document.querySelector(".main-header");
  const featuresSection = document.querySelector("#features");

  if (header && featuresSection) {
    const handleScroll = () => {
      const headerHeight = header.offsetHeight;
      const featuresSectionTop = featuresSection.getBoundingClientRect().top;
      if (featuresSectionTop <= headerHeight) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
  }

  // --- Logic cuộn mượt cho các liên kết anchor ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });
    });
  });

  // --- Logic xử lý chuyển hướng đăng ký ---
  function handleRegisterRedirect(event) {
    event.preventDefault();
    localStorage.setItem("showRegisterForm", "true");
    window.location.href = "login.html";
  }

  const navRegisterBtn = document.querySelector("a.btn-register");
  if (navRegisterBtn) {
    navRegisterBtn.addEventListener("click", handleRegisterRedirect);
  }
});
