// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Script to handle redirecting to the registration form
function handleRegisterRedirect(event) {
  event.preventDefault();
  // We use a flag in localStorage because we can't directly manipulate the DOM of the next page
  localStorage.setItem("showRegisterForm", "true");
  window.location.href = "login.html";
}

// Attach event to both register buttons (hero and nav)
// Attach event to register button in nav
const navRegisterBtn = document.querySelector("a.btn-register");

if (navRegisterBtn) {
  navRegisterBtn.addEventListener("click", handleRegisterRedirect);
}
// === THÊM HIỆU ỨNG HEADER KHI CUỘN TRANG (PHIÊN BẢN CẢI TIẾN) ===
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".main-header");
  const featuresSection = document.querySelector("#features"); // Lấy phần nội dung màu trắng

  // Kiểm tra xem các thành phần có tồn tại không để tránh lỗi
  if (!header || !featuresSection) return;

  // Hàm để xử lý việc thêm/bỏ class 'scrolled'
  const handleScroll = () => {
    const headerHeight = header.offsetHeight;
    // Lấy vị trí của phần "features" so với top của màn hình
    const featuresSectionTop = featuresSection.getBoundingClientRect().top;

    // Nếu đỉnh của phần "features" đã cuộn lên và chạm vào đáy của header
    // thì thêm class 'scrolled'
    if (featuresSectionTop <= headerHeight) {
      header.classList.add("scrolled");
    } else {
      // Ngược lại, xóa class 'scrolled'
      header.classList.remove("scrolled");
    }
  };

  // Thêm một sự kiện lắng nghe hành động cuộn của người dùng
  window.addEventListener("scroll", handleScroll);
});
