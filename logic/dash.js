// Global variable for current user
let currentUser = null;
// MỚI: Biến toàn cục để lưu tọa độ thời tiết hiện tại
let currentWeatherCoords = null; 

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

  // Load content dynamically when switching tabs
  if (sectionId === "forum") {
    loadForumPosts();
  } else if (sectionId === "quiz") {
    loadAndRenderQuizzes();
  }
}

function logout() {
  showConfirm("Bạn có chắc chắn muốn đăng xuất?", () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  });
}
// === END: GENERAL UI FUNCTIONS (MODALS, TABS) ===

// === START: DYNAMIC CONTENT LOADING FUNCTIONS ===
async function loadAndRenderCourses() {
  const coursesGrid = document.getElementById("courses-grid");
  if (!coursesGrid) return;

  coursesGrid.innerHTML = '<p class="card">Đang tải danh sách khóa học...</p>';

  try {
    const response = await fetch("data/courses.json");
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu khóa học.");
    }
    const coursesData = await response.json();

    coursesGrid.innerHTML = ""; // Clear loading message

    const isUserLoggedIn = !!currentUser;

    for (const courseId in coursesData) {
      if (Object.hasOwnProperty.call(coursesData, courseId)) {
        const course = coursesData[courseId];

        const courseCard = document.createElement("div");
        courseCard.className = "course-card card";

        const actionHTML = `
                    <a href="course.html?id=${courseId}" class="btn btn-primary btn-join-course" style="display: ${
          isUserLoggedIn ? "inline-block" : "none"
        };">Tham gia khóa học</a>
                    <p class="course-login-prompt" style="display: ${
                      isUserLoggedIn ? "none" : "block"
                    };">Vui lòng <a href="login.html">đăng nhập</a> để tham gia.</p>
                `;

        courseCard.innerHTML = `
                    <div class="course-content">
                        <h3>${course.title}</h3>
                        <p>${course.sapo}</p>
                    </div>
                    <div class="course-action">
                        ${actionHTML}
                    </div>
                `;
        coursesGrid.appendChild(courseCard);
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải khóa học:", error);
    coursesGrid.innerHTML = `<p class="card" style="color: #ffcccc;">${error.message}</p>`;
  }
}

async function loadAndRenderQuizzes() {
  const quizGrid = document.getElementById("quiz-grid");
  if (!quizGrid) return;

  quizGrid.innerHTML = '<p class="card">Đang tải danh sách bài kiểm tra...</p>';

  try {
    const [coursesResponse, quizzesResponse] = await Promise.all([
      fetch("data/courses.json"),
      fetch("data/quizzes.json"),
    ]);

    if (!coursesResponse.ok) throw new Error("Không thể tải dữ liệu khóa học.");
    if (!quizzesResponse.ok)
      throw new Error("Không thể tải dữ liệu bài kiểm tra.");

    const coursesData = await coursesResponse.json();
    const quizzesData = await quizzesResponse.json();

    let quizHistory = [];
    if (currentUser && currentUser.access_token) {
      try {
        const historyResponse = await fetch(`/api/get-quiz-history`, {
          headers: { Authorization: `Bearer ${currentUser.access_token}` },
        });
        if (historyResponse.ok) {
          quizHistory = await historyResponse.json();
        } else {
          console.error("Không thể tải lịch sử làm bài.");
        }
      } catch (historyError) {
        console.error("Lỗi khi tải lịch sử bài kiểm tra:", historyError);
      }
    }

    const highScores = {};
    quizHistory.forEach((result) => {
      if (
        !highScores[result.quiz_id] ||
        result.score > highScores[result.quiz_id]
      ) {
        highScores[result.quiz_id] = result.score;
      }
    });

    quizGrid.innerHTML = "";

    const quizzesAvailable = Object.values(coursesData).some(
      (course) => course.quizId
    );

    if (!quizzesAvailable) {
      quizGrid.innerHTML = '<p class="card">Hiện chưa có bài kiểm tra nào.</p>';
      return;
    }

    for (const courseId in coursesData) {
      const course = coursesData[courseId];
      if (course.quizId && quizzesData[course.quizId]) {
        const quiz = quizzesData[course.quizId];
        const quizCard = document.createElement("div");
        quizCard.className = "card";

        let actionHTML = "";
        const totalQuestions = quiz.totalQuestions || 0;

        if (currentUser) {
          const userHighScore = highScores[course.quizId] || 0;
          actionHTML = `
                        <p class="highscore">Điểm cao nhất: <span>${userHighScore}/${totalQuestions}</span></p>
                        <a href="quiz.html?id=${course.quizId}" class="btn btn-primary">Bắt đầu ngay</a>
                    `;
        } else {
          actionHTML = `
                        <div class="highscore">Vui lòng <a href="login.html" style="color:#a5d6a7; font-weight:bold;">đăng nhập</a> để tham gia.</div>
                    `;
        }

        quizCard.innerHTML = `
                    <h3>${quiz.title}</h3>
                    <p>Thời gian: ${quiz.timeLimit} phút | Số câu hỏi: ${totalQuestions}</p>
                    <div class="quiz-actions" style="margin-top: 15px;">
                        ${actionHTML}
                    </div>
                `;
        quizGrid.appendChild(quizCard);
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách bài kiểm tra:", error);
    quizGrid.innerHTML = `<p class="card" style="color: #ffcccc;">${error.message}</p>`;
  }
}
// === END: DYNAMIC CONTENT LOADING FUNCTIONS ===

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

function managePostContent(contentElement) {
  const fullText = contentElement.dataset.fullText;
  const currentLength = parseInt(contentElement.dataset.currentLength, 10);
  const tempDiv = document.createElement("div");
  tempDiv.textContent = fullText.substring(0, currentLength);
  const visibleHtml = tempDiv.innerHTML.replace(/\n/g, "<br />");
  const canExpand = currentLength < fullText.length;
  const isExpanded = currentLength > 200;
  let controlsHTML = "";
  if (canExpand) {
    controlsHTML += ` <a href="#" class="expand-link" data-action="more">... Xem thêm</a>`;
  }
  if (isExpanded) {
    controlsHTML += ` <a href="#" class="expand-link" data-action="less"> Ẩn đi</a>`;
  }
  contentElement.innerHTML = visibleHtml + controlsHTML;
}

function setupExpandableContent() {
  document.querySelectorAll(".post-content-container").forEach((p) => {
    const fullText = p.textContent.trim();
    if (fullText.length > 200) {
      p.dataset.fullText = fullText;
      p.dataset.currentLength = 200;
      managePostContent(p);
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
    const tempDiv = document.createElement("div");
    tempDiv.textContent = post.content || "";
    const safeContentHTML = tempDiv.innerHTML.replace(/\n/g, "<br />");

    // Xử lý hiển thị Tag
    let tagHTML = "";
    if (post.tag) {
        let tagClass = "tag-default";
        if (post.tag === "Khẩn cấp") tagClass = "tag-urgent";
        else if (post.tag === "Hỗ trợ") tagClass = "tag-support";
        else if (post.tag === "Hỏi đáp") tagClass = "tag-qa";
        else if (post.tag === "Chia sẻ") tagClass = "tag-share";
        
        tagHTML = `<span class="post-tag ${tagClass}">${post.tag}</span>`;
    }

    // FIX: Sử dụng window.toggleComments trong onclick
    postElement.innerHTML = `
            <div class="post-header">
                <div class="avatar ${randomColorClass}">${post.user_avatar_char}</div>
                <div class="post-info">
                    <h4></h4>
                    <small>${timeAgo(post.created_at)}</small>
                </div>
                <div style="margin-left: auto;">${tagHTML}</div>
            </div>
            <div class="post-body-content">
                <h3></h3>
                <p class="post-content-container">${safeContentHTML}</p>
            </div>
            <div class="post-actions">
                <button class="btn vote-btn like-btn ${likeBtnClass}" data-vote="like">
                    <i class="fas fa-thumbs-up"></i> <span class="like-count">${post.likes || 0}</span>
                </button>
                <button class="btn vote-btn dislike-btn ${dislikeBtnClass}" data-vote="dislike">
                    <i class="fas fa-thumbs-down"></i> <span class="dislike-count">${post.dislikes || 0}</span>
                </button>
                <button class="btn btn-secondary btn-discuss" onclick="window.toggleComments(this, '${post.id}')">
                    <i class="fas fa-comment"></i> Thảo luận (<span class="comment-count">${post.comment_count || 0}</span>)
                </button>
            </div>
            <div class="comments-section" id="comments-section-${post.id}" style="display:none;"></div>
        `;
    postElement.querySelector(".post-info h4").textContent = post.user_name;
    postElement.querySelector(".post-body-content h3").textContent = post.title;
    container.appendChild(postElement);
  });

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
  const tag = document.getElementById("post-tag").value;
  
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
      body: JSON.stringify({ title, content, tag }),
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

// FIX: Hàm này được gán vào window ở cuối file
async function toggleComments(button, postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  if (!commentsSection) return;

  const isVisible = commentsSection.style.display === "block";
  commentsSection.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    commentsSection.innerHTML = `<div style="text-align:center; padding:10px;"><i class="fas fa-spinner fa-spin"></i> Đang tải bình luận...</div>`;
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
                    <div class="avatar ${randomColorClass}">${comment.user_avatar_char}</div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="user-name">${comment.user_name}</span>
                            <span class="timestamp">${timeAgo(comment.created_at)}</span>
                        </div>
                        <p class="comment-content">${comment.content}</p>
                    </div>
                </div>
            `;
    });
  } else {
    commentsHTML += `<p style="text-align:center; color:#ccc; font-style:italic;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>`;
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
    commentFormHTML = `<div class="login-prompt-card"><p>Vui lòng <a href="login.html" style="color:#4CAF50;">đăng nhập</a> để bình luận.</p></div>`;
  }
  commentsSection.innerHTML = commentFormHTML + commentsHTML;
  
  if (currentUser) {
    const form = commentsSection.querySelector(".comment-form");
    if(form) form.addEventListener("submit", handleCommentSubmit);
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
    // Tải lại bình luận để hiện bình luận mới
    await fetchAndRenderComments(postId);
    // Tải lại danh sách bài viết để cập nhật số lượng comment bên ngoài
    await loadForumPosts(); 
    
    // Đảm bảo section vẫn mở sau khi load lại forum
    setTimeout(() => {
        const commentsSection = document.getElementById(`comments-section-${postId}`);
        if (commentsSection) {
            commentsSection.style.display = "block";
            // Cần load lại comment lần nữa vì loadForumPosts đã render lại toàn bộ HTML
            fetchAndRenderComments(postId); 
        }
    }, 500);

  } catch (error) {
    console.error("Lỗi khi gửi bình luận:", error);
    showAlert("Không thể gửi bình luận của bạn. Vui lòng thử lại.");
    submitBtn.disabled = false;
  }
}
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
  const completedCourses = score > 0 ? 1 : 0; // Simplified logic for now
  const completedCoursesEl = document.getElementById("stat-courses-completed");
  if (completedCoursesEl)
    animateValue(completedCoursesEl, 0, completedCourses, animationDuration);

  // Assuming only one quiz for now
  const totalQuestionsInOneQuiz = 20;
  const averageScorePercent =
    totalQuestionsInOneQuiz > 0 ? (score / totalQuestionsInOneQuiz) * 100 : 0;
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

  const rating = score > 0 ? (score / totalQuestionsInOneQuiz) * 4 + 1 : 0;
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

  try {
    const response = await fetch(`/api/get-quiz-history`, {
      headers: {
        Authorization: `Bearer ${currentUser.access_token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Could not fetch history");
    }
    const history = await response.json();
    const highestScore = history.reduce(
      (max, item) => Math.max(max, item.score),
      0
    );
    updateDashboardStats(highestScore);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu người dùng:", error);
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

  document.getElementById("stat-courses-completed").textContent = "0";
  document.getElementById("stat-average-score").textContent = "0%";
  document.getElementById("stat-study-hours").textContent = "0";
  document.getElementById("stat-student-rating").textContent = "0.0★";

  document.getElementById("main-content-title").textContent = "Trang chủ";
  if (!document.getElementById("guest-welcome-message")) {
    const dashboardSection = document.getElementById("dashboard");
    const guestMessage = document.createElement("div");
    guestMessage.className = "card";
    guestMessage.id = "guest-welcome-message";
    guestMessage.innerHTML =
      '<h3>Chào mừng bạn đến với AgriNova!</h3><p>Vui lòng <a href="login.html">đăng nhập</a> hoặc <a href="register.html">đăng ký</a> để truy cập tất cả các tính năng.</p>';
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
  // Reset tọa độ khi chọn thủ công để đảm bảo logic AI hoạt động đúng
  currentWeatherCoords = null; 
  
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
        
        // MỚI: Lưu lại tọa độ để sử dụng cho Trợ lý Nông vụ AI
        currentWeatherCoords = { lat, lon };

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

// === START: FARMING ASSISTANT LOGIC (MỚI) ===

// 1. Cơ sở tri thức (Knowledge Base) cho từng loại cây
const CROP_RULES = {
    rice: {
        name: "Cây Lúa",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 10) {
                advice.push({ type: 'warning', text: "Mưa lớn: Ngưng bón phân đạm để tránh rửa trôi." });
                advice.push({ type: 'danger', text: "Ngưng phun thuốc BVTV (hiệu quả thấp)." });
            } else if (rain > 0 && rain <= 10) {
                advice.push({ type: 'info', text: "Mưa nhỏ: Có thể bón phân đón đòng nếu đất đủ ẩm." });
            }
            
            if (temp > 35) {
                advice.push({ type: 'warning', text: "Nắng nóng: Duy trì mực nước ruộng cao để điều hòa nhiệt độ." });
            } else if (temp < 20) {
                advice.push({ type: 'warning', text: "Trời lạnh: Giữ nước ấm chân, ngưng bón đạm, tăng cường Lân và Kali." });
            }

            if (wind > 15) {
                advice.push({ type: 'danger', text: "Gió mạnh: Không phun thuốc sâu (thuốc bị bay), đề phòng lúa đổ ngã." });
            }

            if (advice.length === 0) advice.push({ type: 'success', text: "Thời tiết thuận lợi: Chăm sóc, thăm đồng bình thường." });
            return advice;
        }
    },
    durian: {
        name: "Sầu Riêng",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 20) {
                advice.push({ type: 'danger', text: "Mưa to: Kiểm tra rãnh thoát nước ngay, ngừa bệnh thối rễ/xì mủ." });
                advice.push({ type: 'warning', text: "Không bón phân gốc, dễ gây nấm bệnh tấn công rễ." });
            } else if (rain === 0 && temp > 33) {
                advice.push({ type: 'info', text: "Nắng nóng: Tưới giữ ẩm đều đặn, nên tưới vào sáng sớm hoặc chiều mát." });
                advice.push({ type: 'info', text: "Có thể phun sương làm mát lá nếu nhiệt độ quá cao." });
            }

            if (wind > 10) {
                advice.push({ type: 'warning', text: "Gió: Cẩn thận gãy cành, nên chằng chống cây mang trái lớn." });
            }
            
            if (advice.length === 0) advice.push({ type: 'success', text: "Thời tiết tốt: Thích hợp để tỉa cành, bón phân lá hoặc làm cỏ." });
            return advice;
        }
    },
    coffee: {
        name: "Cà Phê",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 5 && rain < 20) {
                advice.push({ type: 'success', text: "Đất ẩm: Thời điểm vàng để bón phân NPK mùa mưa." });
                advice.push({ type: 'info', text: "Trồng dặm cây con nếu có kế hoạch." });
            } else if (rain > 50) {
                advice.push({ type: 'warning', text: "Mưa dầm: Ngưng bón phân, chú ý phòng bệnh rỉ sắt và nấm hồng." });
            } else if (rain === 0) {
                advice.push({ type: 'info', text: "Khô ráo: Thăm vườn, cắt cành, làm cỏ, đánh chồi vượt." });
                if (temp > 34) advice.push({ type: 'warning', text: "Cảnh báo rệp sáp phát triển mạnh khi nắng nóng khô hạn." });
            }

            if (advice.length === 0) advice.push({ type: 'success', text: "Điều kiện bình thường: Canh tác theo lịch trình." });
            return advice;
        }
    }
};

// 2. Hàm xử lý chính (ĐÃ SỬA LỖI)
async function generateFarmingPlan() {
    const cropType = document.getElementById('crop-select').value;
    const resultContainer = document.getElementById('plan-results-container');
    
    // Lấy dữ liệu thời tiết hiện tại (từ biến toàn cục hoặc fetch lại nếu cần)
    const locationText = document.querySelector('.weather-location')?.textContent;

    // LOGIC KIỂM TRA MỚI:
    // Cho phép chạy nếu có tọa độ (khi dùng Tự động) HOẶC có tên địa điểm hợp lệ (khi dùng Chọn địa điểm)
    // Loại bỏ việc chặn cứng "Vị trí của bạn" nếu đã có tọa độ GPS.
    if (!currentWeatherCoords && (!locationText || locationText === "Vị trí của bạn" || locationText === "")) {
        showAlert("Vui lòng chọn địa điểm cụ thể hoặc nhấn 'Tự động' để lấy tọa độ trước khi lập kế hoạch.");
        return;
    }

    resultContainer.innerHTML = '<p class="card" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Đang phân tích dữ liệu...</p>';

    try {
        // Gọi API lấy dự báo
        // Ưu tiên dùng tọa độ nếu có (chính xác hơn), nếu không thì dùng tên địa điểm
        let apiUrl = "";
        if (currentWeatherCoords) {
             apiUrl = `/api/get-weather?lat=${currentWeatherCoords.lat}&lon=${currentWeatherCoords.lon}`;
        } else {
             apiUrl = `/api/get-weather?location=${encodeURIComponent(locationText)}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Không thể lấy dữ liệu thời tiết.");
        
        const data = await response.json();
        const forecastList = data.forecast.list; // Danh sách dự báo 3h/lần trong 5 ngày

        // Gộp dữ liệu theo ngày (Lấy mốc 12:00 trưa mỗi ngày làm đại diện)
        const dailyForecasts = processForecastData(forecastList);

        renderPlan(dailyForecasts, cropType, resultContainer);

    } catch (error) {
        console.error("Lỗi lập kế hoạch:", error);
        resultContainer.innerHTML = `<p class="card" style="color: #ffcccc;">Lỗi: ${error.message}</p>`;
    }
}

// Hàm phụ trợ: Gộp dữ liệu dự báo 3 giờ thành dự báo ngày
function processForecastData(list) {
    const dailyData = [];
    const processedDates = new Set();

    list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dateKey = dateObj.toLocaleDateString('vi-VN');
        const hour = dateObj.getHours();

        // Lấy dữ liệu vào khoảng trưa (11h - 13h) làm đại diện cho ban ngày, hoặc lấy mục đầu tiên của ngày mới
        if (!processedDates.has(dateKey) && (hour >= 11 || dailyData.length === 0)) {
            // Tính tổng lượng mưa trong 3h (nếu có)
            const rain = item.rain ? (item.rain['3h'] || 0) : 0;
            
            dailyData.push({
                date: dateKey,
                weekday: getVietnameseDay(dateObj.getDay()),
                temp: Math.round(item.main.temp),
                humidity: item.main.humidity,
                wind: Math.round(item.wind.speed * 3.6), // Đổi m/s sang km/h
                rain: rain,
                desc: item.weather[0].description,
                icon: item.weather[0].icon
            });
            processedDates.add(dateKey);
        }
    });
    return dailyData.slice(0, 5); // Lấy 5 ngày
}

function getVietnameseDay(dayIndex) {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return days[dayIndex];
}

// Hàm hiển thị giao diện kế hoạch
function renderPlan(forecasts, cropType, container) {
    const cropInfo = CROP_RULES[cropType];
    let html = `<h4 style="margin-bottom:20px; border-left: 4px solid #4CAF50; padding-left:10px;">
        Kế hoạch chăm sóc: <span style="color:#a5d6a7">${cropInfo.name}</span>
    </h4>
    <div class="plan-grid" style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">`;

    forecasts.forEach(day => {
        // Lấy lời khuyên dựa trên rules
        const adviceList = cropInfo.rules(day.temp, day.rain, day.wind);
        
        let adviceHTML = `<ul style="padding-left: 20px; margin-top: 10px;">`;
        adviceList.forEach(item => {
            // Style màu sắc dựa trên mức độ cảnh báo
            let color = '#ccc';
            let icon = 'fa-check';
            if(item.type === 'warning') { color = '#f39c12'; icon = 'fa-exclamation-triangle'; }
            if(item.type === 'danger') { color = '#e74c3c'; icon = 'fa-ban'; }
            if(item.type === 'success') { color = '#2ecc71'; icon = 'fa-check-circle'; }
            if(item.type === 'info') { color = '#3498db'; icon = 'fa-info-circle'; }

            adviceHTML += `<li style="color: ${color}; margin-bottom: 5px;">
                <i class="fas ${icon}"></i> ${item.text}
            </li>`;
        });
        adviceHTML += `</ul>`;

        html += `
        <div class="card plan-card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:10px;">
                <span style="font-weight:bold; color:#fff;">${day.weekday} (${day.date})</span>
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="icon" style="width:40px;">
            </div>
            <div style="font-size: 0.9em; color: #aaa; display:flex; justify-content:space-between; margin-bottom:10px;">
                <span><i class="fas fa-thermometer-half"></i> ${day.temp}°C</span>
                <span><i class="fas fa-tint"></i> ${day.rain.toFixed(1)} mm</span>
                <span><i class="fas fa-wind"></i> ${day.wind} km/h</span>
            </div>
            <div class="advice-content">
                ${adviceHTML}
            </div>
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// === END: FARMING ASSISTANT LOGIC ===

// === START: INITIALIZATION AND EVENT LISTENERS ===
document.addEventListener("DOMContentLoaded", function () {
  loadAndRenderCourses();

  const userData = localStorage.getItem("currentUser");
  if (userData) {
    currentUser = JSON.parse(userData);
    setupUserUI();
  } else {
    setupGuestUI();
  }

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

  if (autoLocationBtn)
    autoLocationBtn.addEventListener("click", getWeatherByBrowser);
  loadProvinces();

  const forumContainer = document.getElementById("forum-posts-container");
  if (forumContainer) {
    forumContainer.addEventListener("click", function (e) {
      if (e.target.matches("a.expand-link")) {
        e.preventDefault();
        const action = e.target.dataset.action;
        const contentP = e.target.closest(".post-content-container");
        if (!contentP) return;

        const fullText = contentP.dataset.fullText;
        let currentLength = parseInt(contentP.dataset.currentLength, 10);

        if (action === "more") {
          currentLength += 200;
          if (currentLength > fullText.length) {
            currentLength = fullText.length;
          }
        } else if (action === "less") {
          currentLength = 200;
        }

        contentP.dataset.currentLength = currentLength;
        managePostContent(contentP);
      }
    });
  }

  const hash = window.location.hash.substring(1);
  if (hash) {
    const targetLink = document.querySelector(`.nav-tab[onclick*="'${hash}'"]`);
    if (targetLink) {
      showSection(hash, targetLink);
    }
  } else {
    showSection("dashboard", document.querySelector(".nav-tab.active"));
  }

  // === MỚI: Event listener cho nút Tạo kế hoạch ===
  const btnGeneratePlan = document.getElementById("btn-generate-plan");
  if (btnGeneratePlan) {
      btnGeneratePlan.addEventListener("click", generateFarmingPlan);
  }
});
// === END: INITIALIZATION AND EVENT LISTENERS ===

// === EXPOSE FUNCTIONS TO WINDOW FOR HTML ACCESS ===
window.showSection = showSection;
window.logout = logout;
window.changeWeatherLocation = changeWeatherLocation;
window.editProfile = editProfile;
window.toggleComments = toggleComments; // Đã thêm hàm này để nút bình luận hoạt động