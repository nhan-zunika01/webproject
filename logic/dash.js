// Global variable for current user
let currentUser = null;
const RICE_QUIZ_ID = "rice-basics-v1"; // ID của bài kiểm tra duy nhất
const TOTAL_QUIZ_QUESTIONS = 20; // Tổng số câu hỏi trong bài kiểm tra

// === START: MODAL AND ALERT ELEMENTS ===
const alertModal = document.getElementById("alert-modal");
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmModalConfirmBtn = document.getElementById(
  "confirm-modal-confirm-btn"
);
const confirmModalCancelBtn = document.getElementById(
  "confirm-modal-cancel-btn"
);

// New modal for creating posts
const createPostModal = document.getElementById("create-post-modal");
const createPostBtn = document.getElementById("create-post-btn");
const closeCreatePostModalBtn = document.getElementById(
  "close-create-post-modal-btn"
);
const cancelCreatePostBtn = document.getElementById("cancel-create-post-btn");
const createPostForm = document.getElementById("create-post-form");
// === END: MODAL AND ALERT ELEMENTS ===

// === START: GENERAL UI FUNCTIONS (MODALS, TABS) ===
function showAlert(message, title = "Thông báo") {
  const alertTitle = document.getElementById("alert-modal-title");
  if (modalMessage && alertModal && alertTitle) {
    alertTitle.textContent = title;
    modalMessage.textContent = message;
    alertModal.classList.add("active");
  }
}

function closeAlertModal() {
  if (alertModal) {
    alertModal.classList.remove("active");
  }
}

function showConfirm(message, onConfirm) {
  if (
    confirmModal &&
    confirmModalMessage &&
    confirmModalConfirmBtn &&
    confirmModalCancelBtn
  ) {
    confirmModalMessage.textContent = message;
    confirmModal.classList.add("active");
    confirmModalConfirmBtn.onclick = () => {
      closeConfirmModal();
      onConfirm();
    };
  }
}

function closeConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.remove("active");
  }
}

function showSection(sectionId, element) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add("active");
  }
  if (element) {
    element.classList.add("active");
  }
  const titleElement = document.getElementById("main-content-title");
  if (titleElement && element) {
    const titleText = element.querySelector("span").textContent;
    titleElement.textContent = titleText;
  }

  if (sectionId === "forum") {
    loadForumPosts();
  }
}

function logout() {
  showConfirm("Bạn có chắc chắn muốn đăng xuất?", () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  });
}
// === END: GENERAL UI FUNCTIONS (MODALS, TABS) ===

// === START: FORUM FUNCTIONS ===

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
}

/**
 * Cập nhật nội dung của một bài đăng để hiển thị text và các nút "Xem thêm"/"Ẩn đi".
 * @param {HTMLElement} contentElement - Phần tử <p> chứa nội dung.
 */
function managePostContent(contentElement) {
  const fullText = contentElement.dataset.fullText;
  const currentLength = parseInt(contentElement.dataset.currentLength, 10);

  // Sử dụng textContent để tránh lỗi XSS, sau đó thay thế ký tự xuống dòng bằng thẻ <br>
  const tempDiv = document.createElement("div");
  tempDiv.textContent = fullText.substring(0, currentLength);
  const visibleHtml = tempDiv.innerHTML.replace(/\n/g, "<br />");

  const canExpand = currentLength < fullText.length;
  const isExpanded = currentLength > 200;

  let controlsHTML = "";
  if (canExpand) {
    // data-action được sử dụng bởi trình xử lý sự kiện được ủy quyền
    controlsHTML += ` <a href="#" class="expand-link" data-action="more">... Xem thêm</a>`;
  }
  if (isExpanded) {
    controlsHTML += ` <a href="#" class="expand-link" data-action="less"> Ẩn đi</a>`;
  }

  contentElement.innerHTML = visibleHtml + controlsHTML;
}

/**
 * Lặp qua tất cả các bài đăng và thiết lập nội dung có thể mở rộng nếu cần.
 */
function setupExpandableContent() {
  document.querySelectorAll(".post-content-container").forEach((p) => {
    // Sử dụng textContent để lấy toàn bộ văn bản, trim để loại bỏ khoảng trắng thừa
    const fullText = p.textContent.trim();
    if (fullText.length > 200) {
      p.dataset.fullText = fullText;
      p.dataset.currentLength = 200;
      managePostContent(p); // Thiết lập trạng thái ban đầu
    }
  });
}

async function loadForumPosts() {
  const container = document.getElementById("forum-posts-container");
  if (!container) return;
  container.innerHTML = "<p>Đang tải các bài viết...</p>";

  const headers = {};
  if (currentUser && currentUser.access_token) {
    headers["Authorization"] = `Bearer ${currentUser.access_token}`;
  }

  try {
    const response = await fetch("/api/forum", { headers });
    if (!response.ok) {
      throw new Error("Không thể kết nối đến máy chủ diễn đàn.");
    }
    const posts = await response.json();

    if (posts.length === 0) {
      container.innerHTML =
        '<p class="card">Chưa có bài viết nào. Hãy là người đầu tiên bắt đầu cuộc thảo luận!</p>';
      return;
    }

    renderForumPosts(posts);
  } catch (error) {
    console.error("Lỗi khi tải bài viết:", error);
    container.innerHTML = `<p class="card" style="color: #ffcccc;">${error.message}</p>`;
  }
}

function renderForumPosts(posts) {
  const container = document.getElementById("forum-posts-container");
  container.innerHTML = "";
  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className = "forum-post card";
    postElement.dataset.postId = post.id;

    const randomColorClass = `color-${
      (post.user_avatar_char.charCodeAt(0) % 7) + 1
    }`;
    const likeBtnClass = post.user_vote === 1 ? "liked" : "";
    const dislikeBtnClass = post.user_vote === -1 ? "disliked" : "";

    // Sử dụng textContent để gán nội dung an toàn, tránh lỗi XSS
    const tempDiv = document.createElement("div");
    tempDiv.textContent = post.content || "";
    const safeContentHTML = tempDiv.innerHTML.replace(/\n/g, "<br />");

    postElement.innerHTML = `
            <div class="post-header">
                <div class="avatar ${randomColorClass}">${
      post.user_avatar_char
    }</div>
                <div class="post-info">
                    <h4></h4>
                    <small>${timeAgo(post.created_at)}</small>
                </div>
            </div>
            <div class="post-body-content">
                <h3></h3>
                <p class="post-content-container">${safeContentHTML}</p>
            </div>
            <div class="post-actions">
                <button class="btn vote-btn like-btn ${likeBtnClass}" data-vote="like">
                    <i class="fas fa-thumbs-up"></i> <span class="like-count">${
                      post.likes
                    }</span>
                </button>
                <button class="btn vote-btn dislike-btn ${dislikeBtnClass}" data-vote="dislike">
                    <i class="fas fa-thumbs-down"></i> <span class="dislike-count">${
                      post.dislikes
                    }</span>
                </button>
                <button class="btn btn-secondary btn-discuss" onclick="toggleComments(this, '${
                  post.id
                }')">
                    <i class="fas fa-comment"></i> Thảo luận (<span class="comment-count">${
                      post.comment_count
                    }</span>)
                </button>
            </div>
            <div class="comments-section" id="comments-section-${
              post.id
            }"></div>
        `;

    // Gán tiêu đề và tên người dùng một cách an toàn
    postElement.querySelector(".post-info h4").textContent = post.user_name;
    postElement.querySelector(".post-body-content h3").textContent = post.title;

    container.appendChild(postElement);
  });

  // Chạy hàm thiết lập nội dung có thể mở rộng sau khi tất cả các bài đăng đã được thêm vào DOM
  setupExpandableContent();

  document.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", handleVote);
  });
}

async function handleVote(event) {
  if (!currentUser || !currentUser.access_token) {
    showAlert("Vui lòng đăng nhập để đánh giá bài viết.");
    return;
  }

  const button = event.currentTarget;
  const postElement = button.closest(".forum-post");
  const postId = postElement.dataset.postId;
  const voteType = button.dataset.vote;

  const allVoteButtons = postElement.querySelectorAll(".vote-btn");
  allVoteButtons.forEach((btn) => (btn.disabled = true));

  try {
    await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ postId, voteType }),
    });
    await loadForumPosts();
  } catch (error) {
    console.error("Lỗi khi vote:", error);
    showAlert(error.message);
    allVoteButtons.forEach((btn) => (btn.disabled = false));
  }
}

async function handleCreatePost(event) {
  event.preventDefault();
  if (!currentUser || !currentUser.access_token) {
    showAlert("Vui lòng đăng nhập để đăng bài.");
    return;
  }

  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const submitBtn = document.getElementById("submit-post-btn");

  if (!title || !content) {
    showAlert("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng...';

  try {
    await fetch("/api/forum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ title, content }),
    });

    showAlert("Đăng bài thành công!");
    createPostModal.classList.remove("active");
    createPostForm.reset();
    await loadForumPosts();
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    showAlert(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Đăng bài";
  }
}

// === START: NEW COMMENT-RELATED FUNCTIONS ===

async function toggleComments(button, postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  if (!commentsSection) return;

  // Toggle visibility
  const isVisible = commentsSection.style.display === "block";
  commentsSection.style.display = isVisible ? "none" : "block";

  // If we are showing it for the first time or it's empty, fetch comments
  if (!isVisible) {
    commentsSection.innerHTML = `<p>Đang tải bình luận...</p>`;
    await fetchAndRenderComments(postId);
  }
}

async function fetchAndRenderComments(postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  try {
    const response = await fetch(`/api/comments?postId=${postId}`);
    if (!response.ok) throw new Error("Không thể tải bình luận.");
    const comments = await response.json();

    renderComments(postId, comments);
  } catch (error) {
    commentsSection.innerHTML = `<p style="color: #ffcccc;">${error.message}</p>`;
  }
}

function renderComments(postId, comments) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);

  let commentsHTML = '<div class="comment-list">';
  if (comments.length > 0) {
    comments.forEach((comment) => {
      const randomColorClass = `color-${
        (comment.user_avatar_char.charCodeAt(0) % 7) + 1
      }`;
      commentsHTML += `
                <div class="comment-item">
                    <div class="avatar ${randomColorClass}">${
        comment.user_avatar_char
      }</div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="user-name">${comment.user_name}</span>
                            <span class="timestamp">${timeAgo(
                              comment.created_at
                            )}</span>
                        </div>
                        <p class="comment-content">${comment.content}</p>
                    </div>
                </div>
            `;
    });
  } else {
    commentsHTML += "<p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>";
  }
  commentsHTML += "</div>";

  let commentFormHTML = "";
  if (currentUser) {
    commentFormHTML = `
            <form class="comment-form" data-post-id="${postId}">
                <textarea name="comment-content" placeholder="Viết bình luận của bạn..." required></textarea>
                <button type="submit" class="btn btn-primary">Gửi</button>
            </form>
        `;
  } else {
    commentFormHTML = `<p>Vui lòng <a href="login.html">đăng nhập</a> để bình luận.</p>`;
  }

  commentsSection.innerHTML = commentFormHTML + commentsHTML;

  // Add event listener to the new form
  if (currentUser) {
    const form = commentsSection.querySelector(".comment-form");
    form.addEventListener("submit", handleCommentSubmit);
  }
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const postId = form.dataset.postId;
  const textarea = form.querySelector("textarea");
  const content = textarea.value.trim();
  const submitBtn = form.querySelector("button");

  if (!content) {
    showAlert("Vui lòng nhập nội dung bình luận.");
    return;
  }

  submitBtn.disabled = true;

  try {
    await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ postId, content }),
    });

    // Refresh comments for this post
    await fetchAndRenderComments(postId);

    // Also refresh all posts to update the comment count on the button
    await loadForumPosts();
    // After reloading, make sure the comment section stays open
    const commentsSection = document.getElementById(
      `comments-section-${postId}`
    );
    if (commentsSection) commentsSection.style.display = "block";
  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    showAlert("Không thể gửi bình luận của bạn. Vui lòng thử lại.");
    submitBtn.disabled = false;
  }
}

// === END: NEW COMMENT-RELATED FUNCTIONS ===

// === END: FORUM FUNCTIONS ===

// === START: DASHBOARD STATS FUNCTIONS ===
function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = Math.floor(progress * (end - start) + start);
    obj.innerHTML = currentValue;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function updateDashboardStats(highScore) {
  const score = highScore || 0;
  const animationDuration = 1500;
  const completedCourses = score > 0 ? 1 : 0;
  const completedCoursesEl = document.getElementById("stat-courses-completed");
  if (completedCoursesEl)
    animateValue(completedCoursesEl, 0, completedCourses, animationDuration);

  const averageScorePercent =
    TOTAL_QUIZ_QUESTIONS > 0 ? (score / TOTAL_QUIZ_QUESTIONS) * 100 : 0;
  const averageScoreEl = document.getElementById("stat-average-score");
  if (averageScoreEl) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(
        (timestamp - startTimestamp) / animationDuration,
        1
      );
      const currentValue = progress * averageScorePercent;
      averageScoreEl.innerHTML = `${currentValue.toFixed(0)}%`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  const studyHoursPerCourse = 5;
  const totalStudyHours = completedCourses * studyHoursPerCourse;
  const studyHoursEl = document.getElementById("stat-study-hours");
  if (studyHoursEl)
    animateValue(studyHoursEl, 0, totalStudyHours, animationDuration);

  const rating = score > 0 ? (score / TOTAL_QUIZ_QUESTIONS) * 4 + 1 : 0;
  const ratingEl = document.getElementById("stat-student-rating");
  if (ratingEl) {
    let startTimestampRating = null;
    const stepRating = (timestamp) => {
      if (!startTimestampRating) startTimestampRating = timestamp;
      const progress = Math.min(
        (timestamp - startTimestampRating) / animationDuration,
        1
      );
      const currentValue = progress * rating;
      ratingEl.innerHTML = `${currentValue.toFixed(1)}★`;
      if (progress < 1) {
        window.requestAnimationFrame(stepRating);
      }
    };
    window.requestAnimationFrame(stepRating);
  }
}

async function loadDashboardData() {
  if (!currentUser || !currentUser.access_token) return;

  const highscoreEl = document.getElementById("quiz-highscore");
  try {
    const response = await fetch(`/api/get-quiz-score?quizId=${RICE_QUIZ_ID}`, {
      headers: {
        Authorization: `Bearer ${currentUser.access_token}`,
      },
    });
    let scoreData = { high_score: 0 };
    if (response.ok) {
      scoreData = await response.json();
    } else {
      console.error("Không thể lấy điểm, sử dụng giá trị mặc định là 0.");
    }

    const highScore = scoreData.high_score || 0;

    if (highscoreEl) {
      highscoreEl.textContent = `${highScore}/${TOTAL_QUIZ_QUESTIONS}`;
    }
    updateDashboardStats(highScore);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu người dùng:", error);
    if (highscoreEl) highscoreEl.textContent = "Lỗi";
    updateDashboardStats(0);
  }
}
// === END: DASHBOARD STATS FUNCTIONS ===

// === START: USER & PROFILE FUNCTIONS ===
function setupUserUI() {
  if (!currentUser) return;
  document.getElementById("user-info").style.display = "flex";
  document.getElementById("guest-menu").style.display = "none";
  document.getElementById("profile-tab").style.display = "flex";
  document.getElementById("create-post-btn").style.display = "inline-block";
  document.getElementById("forum-login-prompt").style.display = "none";
  const guestMessage = document.getElementById("guest-welcome-message");
  if (guestMessage) guestMessage.style.display = "none";
  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.classList.remove("disabled");
    startQuizBtn.removeAttribute("title");
  }
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "inline-block";
    if (loginPrompt) loginPrompt.style.display = "none";
  });
  loadDashboardData();
  const usernameSpan = document.querySelector(".user-menu .username");
  if (usernameSpan) {
    usernameSpan.textContent = `Chào, ${currentUser.name_user}!`;
  }
  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profilePhone = document.getElementById("profile-phone");
  if (profileName) profileName.value = currentUser.name_user;
  if (profileEmail) profileEmail.value = currentUser.email;
  if (profilePhone) profilePhone.value = currentUser.phone_user;
}

function setupGuestUI() {
  document.getElementById("user-info").style.display = "none";
  document.getElementById("guest-menu").style.display = "flex";
  document.getElementById("profile-tab").style.display = "none";
  document.getElementById("create-post-btn").style.display = "none";
  document.getElementById("forum-login-prompt").style.display = "block";
  const startQuizBtn = document.getElementById("start-quiz-btn");
  if (startQuizBtn) {
    startQuizBtn.classList.add("disabled");
    startQuizBtn.title = "Vui lòng đăng nhập để làm bài kiểm tra";
  }
  document.querySelectorAll(".course-action").forEach((action) => {
    const joinButton = action.querySelector(".btn-join-course");
    const loginPrompt = action.querySelector(".course-login-prompt");
    if (joinButton) joinButton.style.display = "none";
    if (loginPrompt) loginPrompt.style.display = "block";
  });
  document.getElementById("stat-courses-completed").textContent = "0";
  document.getElementById("stat-average-score").textContent = "0%";
  document.getElementById("stat-study-hours").textContent = "0";
  document.getElementById("stat-student-rating").textContent = "0.0★";
  const highscoreEl = document.getElementById("quiz-highscore");
  if (highscoreEl) {
    highscoreEl.textContent = "0/20";
  }
  document.getElementById("main-content-title").textContent = "Trang chủ";
  if (!document.getElementById("guest-welcome-message")) {
    const dashboardSection = document.getElementById("dashboard");
    const guestMessage = document.createElement("div");
    guestMessage.className = "card";
    guestMessage.id = "guest-welcome-message";
    guestMessage.innerHTML =
      '<h3>Chào mừng bạn đến với Sổ Tay Nông Dân!</h3><p>Vui lòng <a href="login.html">đăng nhập</a> hoặc <a href="register.html">đăng ký</a> để truy cập tất cả các tính năng.</p>';
    if (dashboardSection.firstChild) {
      dashboardSection.insertBefore(guestMessage, dashboardSection.firstChild);
    } else {
      dashboardSection.appendChild(guestMessage);
    }
  }
}

async function editProfile(button) {
  if (!currentUser) {
    showAlert("Vui lòng đăng nhập để sử dụng tính năng này.");
    return;
  }
  const profileForm = document.getElementById("profile");
  const inputs = profileForm.querySelectorAll('input:not([type="email"])');
  if (button.textContent.includes("Chỉnh sửa")) {
    inputs.forEach((input) => input.removeAttribute("readonly"));
    button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
  } else {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    const newName = document.getElementById("profile-name").value;
    const newPhone = document.getElementById("profile-phone").value;
    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.access_token}`,
        },
        body: JSON.stringify({ name_user: newName, phone_user: newPhone }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi cập nhật.");
      }
      currentUser.name_user = newName;
      currentUser.phone_user = newPhone;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      inputs.forEach((input) => input.setAttribute("readonly", true));
      const usernameSpan = document.querySelector(".user-menu .username");
      if (usernameSpan) {
        usernameSpan.textContent = `Chào, ${newName}!`;
      }
      showAlert("Thông tin đã được cập nhật thành công!");
      button.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa thông tin';
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      showAlert(error.message);
      button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    } finally {
      button.disabled = false;
    }
  }
}
// === END: USER & PROFILE FUNCTIONS ===

// === START: WEATHER FUNCTIONS ===
const weatherWidget = document.querySelector(".weather-widget");
const autoLocationBtn = document.getElementById("auto-location-btn");
const provinceSelect = document.getElementById("province-select");
const districtSelect = document.getElementById("district-select");

async function loadProvinces() {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/p/");
    if (!response.ok) throw new Error("Không thể tải danh sách tỉnh thành");
    const provinces = await response.json();
    provinceSelect.innerHTML =
      '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
    provinces.forEach((province) => {
      const option = document.createElement("option");
      option.value = province.code;
      option.textContent = province.name;
      provinceSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi tải tỉnh/thành phố:", error);
    provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

async function loadDistricts(provinceCode) {
  if (!provinceCode) {
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
    districtSelect.disabled = true;
    return;
  }
  try {
    districtSelect.disabled = true;
    districtSelect.innerHTML = '<option value="">Đang tải...</option>';
    const response = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    if (!response.ok) throw new Error("Không thể tải danh sách quận huyện");
    const provinceData = await response.json();
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
    provinceData.districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district.name;
      option.textContent = district.name;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) {
    console.error("Lỗi tải quận/huyện:", error);
    districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

provinceSelect.addEventListener("change", () =>
  loadDistricts(provinceSelect.value)
);

function changeWeatherLocation() {
  const districtName = districtSelect.value;
  const provinceName =
    provinceSelect.options[provinceSelect.selectedIndex].text;
  if (districtName && provinceName && provinceSelect.value) {
    const locationQuery = `${districtName}, ${provinceName}`;
    getWeatherByManualSelection(locationQuery);
  } else {
    showAlert("Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện.");
  }
}

async function getWeatherByManualSelection(locationQuery) {
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang tìm kiếm và tải dữ liệu thời tiết...</p>";

  try {
    const response = await fetch(
      `/api/get-weather?location=${encodeURIComponent(locationQuery)}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Lỗi ${response.status}: ${errorData.message}`);
    }
    const weatherData = await response.json();
    renderWeatherData(weatherData.current, weatherData.forecast, locationQuery);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thời tiết:", error);
    weatherWidget.innerHTML = `<p style="color: #ffcccc; font-weight: bold;">Lỗi: ${error.message}</p>`;
  }
}

async function getWeatherByBrowser() {
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang yêu cầu quyền truy cập vị trí...</p>";
  autoLocationBtn.disabled = true;

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        weatherWidget.innerHTML =
          "<p>Đã có tọa độ, đang tải dữ liệu thời tiết...</p>";
        try {
          const response = await fetch(
            `/api/get-weather?lat=${lat}&lon=${lon}`
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi ${response.status}: ${errorData.message}`);
          }
          const weatherData = await response.json();
          const locationName = await getLocationName(lat, lon);
          renderWeatherData(
            weatherData.current,
            weatherData.forecast,
            locationName
          );
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu thời tiết:", error);
          weatherWidget.innerHTML = `<p style="color: #ffcccc; font-weight: bold;">Lỗi: ${error.message}</p>`;
        } finally {
          autoLocationBtn.disabled = false;
        }
      },
      (error) => {
        let message = "Không thể lấy vị trí của bạn.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt nếu muốn sử dụng tính năng này.";
        }
        weatherWidget.innerHTML = `<p style="color: #ffcccc;">${message}</p>`;
        autoLocationBtn.disabled = false;
      }
    );
  } else {
    weatherWidget.innerHTML =
      "<p>Trình duyệt của bạn không hỗ trợ tính năng định vị tự động.</p>";
    autoLocationBtn.disabled = false;
  }
}

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`
    );
    const data = await response.json();
    if (data && data.address) {
      const { road, suburb, village, town, city_district, city, state } =
        data.address;
      const locationParts = [
        road,
        suburb || village || town,
        city_district,
        city || state,
      ].filter(Boolean);
      return locationParts.join(", ");
    }
    return "Vị trí của bạn";
  } catch (error) {
    console.error("Lỗi khi lấy tên địa danh:", error);
    return "Vị trí của bạn";
  }
}

function renderWeatherData(current, forecast, locationName) {
  const getIconClass = (iconCode) => {
    const firstTwoChars = iconCode.substring(0, 2);
    const iconMap = {
      "01": "fa-sun",
      "02": "fa-cloud-sun",
      "03": "fa-cloud",
      "04": "fa-cloud-meatball",
      "09": "fa-cloud-showers-heavy",
      10: "fa-cloud-sun-rain",
      11: "fa-poo-storm",
      13: "fa-snowflake",
      50: "fa-smog",
    };
    return iconMap[firstTwoChars] || "fa-cloud-sun";
  };
  const currentTemp = Math.round(current.main.temp);
  const weatherDescription = current.weather[0].description;
  const currentIcon = getIconClass(current.weather[0].icon);
  const dailyForecasts = [];
  const processedDays = {};
  const today = new Date().getUTCDate();
  for (const entry of forecast.list) {
    const entryDate = new Date(entry.dt * 1000);
    const dayKey = entryDate.getUTCDate();
    if (
      dayKey !== today &&
      !processedDays[dayKey] &&
      dailyForecasts.length < 4
    ) {
      dailyForecasts.push(entry);
      processedDays[dayKey] = true;
    }
  }
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  weatherWidget.innerHTML = `
    <div class="weather-main">
        <i class="fas ${currentIcon}"></i>
        <div class="weather-temp">${currentTemp}°C</div>
        <div class="weather-location">${locationName}</div>
        <div class="weather-desc" style="text-transform: capitalize;">${weatherDescription}</div>
    </div>
    <div class="weather-forecast">
        ${dailyForecasts
          .map(
            (day) => `
            <div class="forecast-item">
                <div>${dayNames[new Date(day.dt * 1000).getDay()]}</div>
                <i class="fas ${getIconClass(day.weather[0].icon)}"></i>
                <div>${Math.round(day.main.temp_max)}°</div>
            </div>`
          )
          .join("")}
    </div>`;
}
// === END: WEATHER FUNCTIONS ===

// === START: INITIALIZATION AND EVENT LISTENERS ===
document.addEventListener("DOMContentLoaded", function () {
  // --- Authentication Check ---
  const userData = localStorage.getItem("currentUser");
  if (userData) {
    currentUser = JSON.parse(userData);
    setupUserUI();
  } else {
    setupGuestUI();
  }

  // --- Modal Event Listeners ---
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAlertModal);
  if (alertModal)
    alertModal.addEventListener("click", (e) => {
      if (e.target === alertModal) closeAlertModal();
    });
  if (confirmModalCancelBtn)
    confirmModalCancelBtn.addEventListener("click", closeConfirmModal);
  if (confirmModal)
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) closeConfirmModal();
    });

  // --- Forum Modal Event Listeners ---
  if (createPostBtn)
    createPostBtn.addEventListener("click", () =>
      createPostModal.classList.add("active")
    );
  if (closeCreatePostModalBtn)
    closeCreatePostModalBtn.addEventListener("click", () =>
      createPostModal.classList.remove("active")
    );
  if (cancelCreatePostBtn)
    cancelCreatePostBtn.addEventListener("click", () =>
      createPostModal.classList.remove("active")
    );
  if (createPostModal)
    createPostModal.addEventListener("click", (e) => {
      if (e.target === createPostModal)
        createPostModal.classList.remove("active");
    });
  if (createPostForm)
    createPostForm.addEventListener("submit", handleCreatePost);

  // --- Weather Event Listeners ---
  if (autoLocationBtn)
    autoLocationBtn.addEventListener("click", getWeatherByBrowser);
  loadProvinces();

  // --- THÊM MỚI: Event Listener được ủy quyền cho các nút "Xem thêm" / "Ẩn đi" ---
  const forumContainer = document.getElementById("forum-posts-container");
  if (forumContainer) {
    forumContainer.addEventListener("click", function (e) {
      // Chỉ xử lý nếu mục tiêu là một liên kết có class 'expand-link'
      if (e.target.matches("a.expand-link")) {
        e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
        const action = e.target.dataset.action;
        const contentP = e.target.closest(".post-content-container");
        if (!contentP) return;

        const fullText = contentP.dataset.fullText;
        let currentLength = parseInt(contentP.dataset.currentLength, 10);

        if (action === "more") {
          currentLength += 200;
          // Đảm bảo không vượt quá độ dài tối đa
          if (currentLength > fullText.length) {
            currentLength = fullText.length;
          }
        } else if (action === "less") {
          currentLength = 200;
        }

        contentP.dataset.currentLength = currentLength;
        managePostContent(contentP); // Render lại nội dung của bài đăng này
      }
    });
  }

  // --- Handle Hash Navigation ---
  const hash = window.location.hash.substring(1);
  if (hash) {
    const targetLink = document.querySelector(`.nav-tab[onclick*="'${hash}'"]`);
    if (targetLink) {
      showSection(hash, targetLink);
    }
  } else {
    // Default to dashboard if no hash
    showSection("dashboard", document.querySelector(".nav-tab.active"));
  }
});
// === END: INITIALIZATION AND EVENT LISTENERS ===
