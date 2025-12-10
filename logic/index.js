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
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // --- ĐÃ XÓA: Logic xử lý chuyển hướng đăng ký cũ ---
  // Đoạn mã cũ chặn nút đăng ký và chuyển hướng sang login.html đã được gỡ bỏ 
  // để nút hoạt động bình thường (chuyển sang register.html).
});

const oldDomain = "https://sotaynongdan.pages.dev/";
const newDomain = "https://agrinova.pages.dev/";

if (window.location.hostname === oldDomain) {
    // Hiện modal thông báo chuyển hướng nếu có phần tử modal
    const alertModal = document.getElementById("alert-modal");
    const alertTitle = document.getElementById("alert-modal-title");
    const alertMessage = document.getElementById("modal-message");
    const closeBtn = document.getElementById("modal-close-btn");

    if (alertModal && alertTitle && alertMessage && closeBtn) {
        alertTitle.textContent = "Chuyển hướng trang web";
        alertMessage.textContent = "Trang web đã chuyển sang địa chỉ mới. Bạn sẽ được chuyển hướng trong giây lát: " + newDomain;
        alertModal.style.display = "flex";

        // Đóng modal khi nhấn nút
        closeBtn.onclick = function() {
            window.location.href = newDomain;
        };
    }

    // Tự động chuyển hướng sau 5 giây
    setTimeout(function() {
        window.location.href = newDomain;
    }, 5000);
}