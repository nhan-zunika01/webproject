// Global variable for current user
let currentUser = null;
let currentWeatherCoords = null;
// MỚI: Biến lưu trữ tất cả bài viết để xử lý Sắp xếp & Lọc
let allForumPosts = [];

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

// === START: GENERAL UI FUNCTIONS ===
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

  // Load content dynamically
  if (sectionId === "forum") {
    // FIX: Luôn tải lại bài viết khi vào tab forum để đảm bảo dữ liệu mới nhất
    loadForumPosts();
    // MỚI: Khởi tạo thanh công cụ Sort/Filter/Refresh
    setupForumControls();
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
// === END: GENERAL UI FUNCTIONS ===

// === START: DYNAMIC CONTENT LOADING ===
async function loadAndRenderCourses() {
  const coursesGrid = document.getElementById("courses-grid");
  if (!coursesGrid) return;
  coursesGrid.innerHTML = '<p class="card">Đang tải danh sách khóa học...</p>';

  try {
    const response = await fetch("data/courses.json");
    if (!response.ok) throw new Error("Không thể tải dữ liệu khóa học.");
    const coursesData = await response.json();
    coursesGrid.innerHTML = "";
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
            <div class="course-action">${actionHTML}</div>
        `;
        coursesGrid.appendChild(courseCard);
      }
    }
  } catch (error) {
    console.error("Lỗi khóa học:", error);
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

    if (!coursesResponse.ok || !quizzesResponse.ok)
      throw new Error("Lỗi tải dữ liệu.");

    const coursesData = await coursesResponse.json();
    const quizzesData = await quizzesResponse.json();

    let quizHistory = [];
    if (currentUser && currentUser.access_token) {
      try {
        const historyResponse = await fetch(`/api/get-quiz-history`, {
          headers: { Authorization: `Bearer ${currentUser.access_token}` },
        });
        if (historyResponse.ok) quizHistory = await historyResponse.json();
      } catch (e) { console.error(e); }
    }

    const highScores = {};
    quizHistory.forEach((result) => {
      if (!highScores[result.quiz_id] || result.score > highScores[result.quiz_id]) {
        highScores[result.quiz_id] = result.score;
      }
    });

    quizGrid.innerHTML = "";
    const quizzesAvailable = Object.values(coursesData).some(c => c.quizId);

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
        const totalQuestions = quiz.totalQuestions || 0;
        let actionHTML = "";
        if (currentUser) {
          const userHighScore = highScores[course.quizId] || 0;
          actionHTML = `<p class="highscore">Điểm cao nhất: <span>${userHighScore}/${totalQuestions}</span></p>
                        <a href="quiz.html?id=${course.quizId}" class="btn btn-primary">Bắt đầu ngay</a>`;
        } else {
          actionHTML = `<div class="highscore">Vui lòng <a href="login.html" style="color:#a5d6a7;">đăng nhập</a> để tham gia.</div>`;
        }
        quizCard.innerHTML = `<h3>${quiz.title}</h3><p>Thời gian: ${quiz.timeLimit} phút | Số câu: ${totalQuestions}</p><div class="quiz-actions" style="margin-top: 15px;">${actionHTML}</div>`;
        quizGrid.appendChild(quizCard);
      }
    }
  } catch (error) {
    quizGrid.innerHTML = `<p class="card" style="color: #ffcccc;">${error.message}</p>`;
  }
}
// === END: DYNAMIC CONTENT LOADING ===

// === START: FORUM FUNCTIONS (OPTIMIZED) ===
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
  if (canExpand) controlsHTML += ` <a href="#" class="expand-link" data-action="more">... Xem thêm</a>`;
  if (isExpanded) controlsHTML += ` <a href="#" class="expand-link" data-action="less"> Ẩn đi</a>`;
  contentElement.innerHTML = visibleHtml + controlsHTML;
}

function setupExpandableContent() {
  document.querySelectorAll(".post-content-container").forEach((p) => {
    if(!p.dataset.fullText) {
        const fullText = p.textContent.trim();
        if (fullText.length > 200) {
        p.dataset.fullText = fullText;
        p.dataset.currentLength = 200;
        managePostContent(p);
        }
    }
  });
}

// MỚI: Hàm tạo UI Toolbar cho diễn đàn (Sort, Filter, Refresh) - ĐƯỢC THIẾT KẾ LẠI ĐẸP HƠN
function setupForumControls() {
    const container = document.getElementById("forum-posts-container");
    // Kiểm tra xem toolbar đã tồn tại chưa để tránh tạo trùng
    if (!container || document.getElementById("forum-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.id = "forum-toolbar";
    // Thiết kế mới: Nền tối mờ, bo tròn, có đổ bóng nhẹ
    toolbar.style.cssText = `
        display: flex; 
        gap: 20px; 
        margin-bottom: 25px; 
        flex-wrap: wrap; 
        align-items: center; 
        background: rgba(20, 20, 20, 0.6); 
        backdrop-filter: blur(10px); 
        padding: 15px 25px; 
        border-radius: 15px; 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;

    // Style chung cho các ô select
    const selectStyle = `
        padding: 8px 15px; 
        border-radius: 20px; 
        border: 1px solid rgba(255, 255, 255, 0.2); 
        background: rgba(0, 0, 0, 0.5); 
        color: #f0f0f0; 
        font-size: 0.95rem;
        cursor: pointer;
        outline: none;
        font-family: inherit;
        transition: all 0.3s ease;
    `;

    // Style cho nhãn (label)
    const labelStyle = `
        font-size: 0.95em; 
        margin-right: 10px; 
        color: #ccc; 
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
    `;

    // 1. Sort Select
    const sortWrapper = document.createElement("div");
    sortWrapper.style.display = "flex";
    sortWrapper.style.alignItems = "center";
    sortWrapper.innerHTML = `
        <label style="${labelStyle}"><i class="fas fa-sort-amount-down" style="color: #4CAF50;"></i> Sắp xếp:</label>
        <select id="forum-sort-select" style="${selectStyle}">
            <option value="newest">⏱️ Mới nhất</option>
            <option value="oldest">🕰️ Cũ nhất</option>
            <option value="popular">🔥 Phổ biến nhất</option>
        </select>
    `;
    const sortSelect = sortWrapper.querySelector("select");
    sortSelect.onchange = applyForumFilters;
    sortSelect.onfocus = () => sortSelect.style.borderColor = "#4CAF50";
    sortSelect.onblur = () => sortSelect.style.borderColor = "rgba(255, 255, 255, 0.2)";

    // 2. Filter Tag Select
    const filterWrapper = document.createElement("div");
    filterWrapper.style.display = "flex";
    filterWrapper.style.alignItems = "center";
    filterWrapper.innerHTML = `
        <label style="${labelStyle}"><i class="fas fa-filter" style="color: #4CAF50;"></i> Chủ đề:</label>
        <select id="forum-filter-select" style="${selectStyle}">
            <option value="all">🌐 Tất cả</option>
            <option value="Khẩn cấp">🚨 Khẩn cấp</option>
            <option value="Hỗ trợ">🛠️ Hỗ trợ</option>
            <option value="Hỏi đáp">❓ Hỏi đáp</option>
            <option value="Chia sẻ">💡 Chia sẻ</option>
        </select>
    `;
    const filterSelect = filterWrapper.querySelector("select");
    filterSelect.onchange = applyForumFilters;
    filterSelect.onfocus = () => filterSelect.style.borderColor = "#4CAF50";
    filterSelect.onblur = () => filterSelect.style.borderColor = "rgba(255, 255, 255, 0.2)";

    // 3. Refresh Button
    const refreshBtn = document.createElement("button");
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Tải lại';
    refreshBtn.className = "btn";
    // Style riêng cho nút refresh để nó nổi bật nhưng tinh tế
    refreshBtn.style.cssText = `
        padding: 8px 20px; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        margin-left: auto; /* Đẩy nút sang phải cùng */
        background: rgba(255, 255, 255, 0.1); 
        border: 1px solid rgba(255, 255, 255, 0.2); 
        color: #fff;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
    `;
    
    // Hiệu ứng hover cho nút
    refreshBtn.onmouseover = () => {
        refreshBtn.style.background = "rgba(76, 175, 80, 0.2)";
        refreshBtn.style.borderColor = "#4CAF50";
    };
    refreshBtn.onmouseout = () => {
        refreshBtn.style.background = "rgba(255, 255, 255, 0.1)";
        refreshBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
    };

    refreshBtn.onclick = () => {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        // Disable nút để tránh spam click
        refreshBtn.style.opacity = "0.7";
        refreshBtn.style.pointerEvents = "none";
        
        loadForumPosts().then(() => {
            setTimeout(() => {
                 refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Tải lại';
                 refreshBtn.style.opacity = "1";
                 refreshBtn.style.pointerEvents = "auto";
            }, 500);
        });
    };

    toolbar.appendChild(sortWrapper);
    toolbar.appendChild(filterWrapper);
    toolbar.appendChild(refreshBtn);

    // Chèn toolbar vào trước container bài viết
    container.parentNode.insertBefore(toolbar, container);
}

// MỚI: Hàm xử lý Sort và Filter dữ liệu client-side
function applyForumFilters() {
    const sortType = document.getElementById("forum-sort-select")?.value || "newest";
    const filterTag = document.getElementById("forum-filter-select")?.value || "all";

    let filtered = [...allForumPosts];

    // 1. Filter
    if (filterTag !== "all") {
        filtered = filtered.filter(p => p.tag === filterTag);
    }

    // 2. Sort
    if (sortType === "newest") {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortType === "oldest") {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortType === "popular") {
        filtered.sort((a, b) => {
            const scoreA = (a.likes || 0) + (a.comment_count || 0);
            const scoreB = (b.likes || 0) + (b.comment_count || 0);
            return scoreB - scoreA;
        });
    }

    renderForumPosts(filtered);
}

function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "forum-post card";
    postElement.dataset.postId = post.id;
    postElement.style.animation = "fadeIn 0.5s ease-out"; 

    const randomColorClass = `color-${(post.user_avatar_char.charCodeAt(0) % 7) + 1}`;
    const likeBtnClass = post.user_vote === 1 ? "liked" : "";
    const dislikeBtnClass = post.user_vote === -1 ? "disliked" : "";
    
    const tempDiv = document.createElement("div");
    tempDiv.textContent = post.content || "";
    const safeContentHTML = tempDiv.innerHTML.replace(/\n/g, "<br />");

    let tagHTML = "";
    if (post.tag) {
        let tagClass = "tag-default";
        if (post.tag === "Khẩn cấp") tagClass = "tag-urgent";
        else if (post.tag === "Hỗ trợ") tagClass = "tag-support";
        else if (post.tag === "Hỏi đáp") tagClass = "tag-qa";
        else if (post.tag === "Chia sẻ") tagClass = "tag-share";
        tagHTML = `<span class="post-tag ${tagClass}">${post.tag}</span>`;
    }

    postElement.innerHTML = `
            <div class="post-header">
                <div class="avatar ${randomColorClass}">${post.user_avatar_char}</div>
                <div class="post-info">
                    <h4>${post.user_name}</h4>
                    <small>${timeAgo(post.created_at)}</small>
                </div>
                <div style="margin-left: auto;">${tagHTML}</div>
            </div>
            <div class="post-body-content">
                <h3>${post.title}</h3>
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

    postElement.querySelectorAll(".vote-btn").forEach((btn) => {
        btn.addEventListener("click", handleVote);
    });

    return postElement;
}

async function loadForumPosts() {
  const container = document.getElementById("forum-posts-container");
  if (!container) return;
  // Chỉ hiển thị loading nếu container đang trống (lần đầu load)
  if (!container.hasChildNodes()) {
      container.innerHTML = "<p>Đang tải các bài viết...</p>";
  }

  const headers = {};
  if (currentUser && currentUser.access_token) {
    headers["Authorization"] = `Bearer ${currentUser.access_token}`;
  }

  try {
    const response = await fetch("/api/forum", { headers });
    if (!response.ok) throw new Error("Không thể kết nối đến máy chủ diễn đàn.");
    const posts = await response.json();

    // MỚI: Lưu dữ liệu vào biến toàn cục và render thông qua bộ lọc
    allForumPosts = posts;
    applyForumFilters();

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="card" style="color: #ffcccc;">${error.message}</p>`;
  }
}

function renderForumPosts(posts) {
  const container = document.getElementById("forum-posts-container");
  container.innerHTML = "";
  
  if (posts.length === 0) {
      container.innerHTML = '<p class="card" id="no-posts-msg">Không tìm thấy bài viết nào phù hợp.</p>';
      return;
  }

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    container.appendChild(postElement);
  });
  setupExpandableContent();
}

// 2. Tối ưu hàm Vote: Cập nhật DOM trực tiếp, không reload
async function handleVote(event) {
  if (!currentUser || !currentUser.access_token) {
    showAlert("Vui lòng đăng nhập để đánh giá bài viết.");
    return;
  }

  const button = event.currentTarget;
  const postElement = button.closest(".forum-post");
  const postId = postElement.dataset.postId;
  const voteType = button.dataset.vote; // 'like' or 'dislike'

  // Tìm các element UI
  const likeBtn = postElement.querySelector(".like-btn");
  const dislikeBtn = postElement.querySelector(".dislike-btn");
  const likeCountSpan = likeBtn.querySelector(".like-count");
  const dislikeCountSpan = dislikeBtn.querySelector(".dislike-count");

  // Disable nút để tránh spam
  likeBtn.disabled = true;
  dislikeBtn.disabled = true;

  try {
    const response = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ postId, voteType }),
    });

    if (!response.ok) throw new Error("Lỗi kết nối");

    // === START: OPTIMISTIC UI UPDATE (Logic cập nhật giao diện ngay lập tức) ===
    let currentLikes = parseInt(likeCountSpan.textContent) || 0;
    let currentDislikes = parseInt(dislikeCountSpan.textContent) || 0;
    const isLiked = likeBtn.classList.contains("liked");
    const isDisliked = dislikeBtn.classList.contains("disliked");

    if (voteType === 'like') {
        if (isLiked) {
            // Đang like -> Bỏ like
            likeBtn.classList.remove("liked");
            currentLikes--;
        } else {
            // Chưa like -> Like (nếu đang dislike thì bỏ dislike luôn)
            likeBtn.classList.add("liked");
            currentLikes++;
            if (isDisliked) {
                dislikeBtn.classList.remove("disliked");
                currentDislikes--;
            }
        }
    } else if (voteType === 'dislike') {
        if (isDisliked) {
            // Đang dislike -> Bỏ dislike
            dislikeBtn.classList.remove("disliked");
            currentDislikes--;
        } else {
            // Chưa dislike -> Dislike (nếu đang like thì bỏ like luôn)
            dislikeBtn.classList.add("disliked");
            currentDislikes++;
            if (isLiked) {
                likeBtn.classList.remove("liked");
                currentLikes--;
            }
        }
    }

    // Cập nhật số lên màn hình
    likeCountSpan.textContent = currentLikes;
    dislikeCountSpan.textContent = currentDislikes;
    
    // Cập nhật cả trong biến allForumPosts để khi sort không bị mất dữ liệu
    const postInCache = allForumPosts.find(p => p.id === postId);
    if (postInCache) {
        postInCache.likes = currentLikes;
        postInCache.dislikes = currentDislikes;
        // Cập nhật trạng thái vote user giả định (để nếu render lại vẫn đúng màu)
        if (voteType === 'like') postInCache.user_vote = isLiked ? 0 : 1; 
        else postInCache.user_vote = isDisliked ? 0 : -1;
    }
    // === END: OPTIMISTIC UI UPDATE ===

  } catch (error) {
    console.error("Lỗi khi vote:", error);
    showAlert("Có lỗi xảy ra, vui lòng thử lại.");
  } finally {
    // Mở lại nút
    likeBtn.disabled = false;
    dislikeBtn.disabled = false;
  }
}

// 3. Tối ưu hàm Tạo bài viết: Thêm vào đầu danh sách, không reload
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
    const response = await fetch("/api/forum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ title, content, tag }),
    });

    if (!response.ok) throw new Error("Không thể đăng bài.");
    
    const result = await response.json(); 
    const newPostId = result.id || result.postId || "temp-id-" + Date.now(); 

    showAlert("Đăng bài thành công!");
    createPostModal.classList.remove("active");
    createPostForm.reset();

    // === START: INSTANT UI UPDATE ===
    const newPost = {
        id: newPostId,
        title: title,
        content: content,
        tag: tag,
        user_id: currentUser.id,
        user_name: currentUser.name_user,
        user_avatar_char: currentUser.name_user.charAt(0).toUpperCase(),
        created_at: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        comment_count: 0,
        user_vote: 0
    };

    // MỚI: Thêm vào cache và render lại để đảm bảo đúng thứ tự sort
    allForumPosts.unshift(newPost);
    applyForumFilters();
    // === END: INSTANT UI UPDATE ===

  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    showAlert(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Đăng bài";
  }
}

async function toggleComments(button, postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  if (!commentsSection) return;

  const isVisible = commentsSection.style.display === "block";
  commentsSection.style.display = isVisible ? "none" : "block";

  // Chỉ tải nếu chưa có nội dung (hoặc muốn tải lại mỗi lần mở - ở đây tải 1 lần)
  if (!isVisible && commentsSection.innerHTML === "") {
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

// Tách hàm tạo HTML bình luận
function createCommentHTML(comment) {
    const randomColorClass = `color-${(comment.user_avatar_char.charCodeAt(0) % 7) + 1}`;
    return `
        <div class="comment-item" style="animation: fadeIn 0.3s ease-out;">
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
}

function renderComments(postId, comments) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  let commentsListHTML = '<div class="comment-list">';
  
  if (comments.length > 0) {
    comments.forEach(c => { commentsListHTML += createCommentHTML(c); });
  } else {
    commentsListHTML += `<p class="no-comments-msg" style="text-align:center; color:#ccc; font-style:italic;">Chưa có bình luận nào.</p>`;
  }
  commentsListHTML += "</div>";

  let commentFormHTML = "";
  if (currentUser) {
    commentFormHTML = `
        <form class="comment-form" data-post-id="${postId}">
            <textarea name="comment-content" placeholder="Viết bình luận..." required></textarea>
            <button type="submit" class="btn btn-primary">Gửi</button>
        </form>`;
  } else {
    commentFormHTML = `<div class="login-prompt-card"><p>Vui lòng <a href="login.html">đăng nhập</a> để bình luận.</p></div>`;
  }
  
  commentsSection.innerHTML = commentFormHTML + commentsListHTML;

  if (currentUser) {
    const form = commentsSection.querySelector(".comment-form");
    if(form) form.addEventListener("submit", handleCommentSubmit);
  }
}

// 4. Tối ưu hàm Gửi bình luận: Thêm vào danh sách, tăng count, không reload
async function handleCommentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const postId = form.dataset.postId;
  const textarea = form.querySelector("textarea");
  const content = textarea.value.trim();
  const submitBtn = form.querySelector("button");

  if (!content) return;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ postId, content }),
    });

    // === START: INSTANT UI UPDATE ===
    // 1. Tạo object bình luận giả lập
    const newComment = {
        user_name: currentUser.name_user,
        user_avatar_char: currentUser.name_user.charAt(0).toUpperCase(),
        content: content,
        created_at: new Date().toISOString()
    };

    // 2. Chèn vào danh sách comment
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    const commentList = commentsSection.querySelector(".comment-list");
    const noCommentMsg = commentsSection.querySelector(".no-comments-msg");
    if (noCommentMsg) noCommentMsg.remove();
    
    // Append HTML mới
    commentList.insertAdjacentHTML('beforeend', createCommentHTML(newComment));

    // 3. Cập nhật số lượng bình luận ở nút bên ngoài (Post Action)
    const postElement = document.querySelector(`.forum-post[data-post-id="${postId}"]`);
    if (postElement) {
        const countSpan = postElement.querySelector(".comment-count");
        if (countSpan) {
            let currentCount = parseInt(countSpan.textContent) || 0;
            countSpan.textContent = currentCount + 1;
        }
    }
    
    // MỚI: Cập nhật cache allForumPosts để khi sort theo Popularity nó chính xác
    const postInCache = allForumPosts.find(p => p.id === postId);
    if(postInCache) {
        postInCache.comment_count = (postInCache.comment_count || 0) + 1;
    }

    // 4. Reset form
    textarea.value = "";
    // === END: INSTANT UI UPDATE ===

  } catch (error) {
    console.error("Lỗi gửi bình luận:", error);
    showAlert("Lỗi kết nối.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Gửi";
  }
}
// === END: FORUM FUNCTIONS (OPTIMIZED) ===

// === START: DASHBOARD STATS ===
function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function updateDashboardStats(highScore) {
  const score = highScore || 0;
  const animationDuration = 1500;
  const completedCourses = score > 0 ? 1 : 0; 
  const completedCoursesEl = document.getElementById("stat-courses-completed");
  if (completedCoursesEl) animateValue(completedCoursesEl, 0, completedCourses, animationDuration);

  const totalQuestionsInOneQuiz = 20;
  const averageScorePercent = totalQuestionsInOneQuiz > 0 ? (score / totalQuestionsInOneQuiz) * 100 : 0;
  const averageScoreEl = document.getElementById("stat-average-score");
  if (averageScoreEl) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
      averageScoreEl.innerHTML = `${(progress * averageScorePercent).toFixed(0)}%`;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  const studyHoursEl = document.getElementById("stat-study-hours");
  if (studyHoursEl) animateValue(studyHoursEl, 0, completedCourses * 5, animationDuration);

  const ratingEl = document.getElementById("stat-student-rating");
  if (ratingEl) {
    const rating = score > 0 ? (score / totalQuestionsInOneQuiz) * 4 + 1 : 0;
    let startTimestampRating = null;
    const stepRating = (timestamp) => {
      if (!startTimestampRating) startTimestampRating = timestamp;
      const progress = Math.min((timestamp - startTimestampRating) / animationDuration, 1);
      ratingEl.innerHTML = `${(progress * rating).toFixed(1)}★`;
      if (progress < 1) window.requestAnimationFrame(stepRating);
    };
    window.requestAnimationFrame(stepRating);
  }
}

async function loadDashboardData() {
  if (!currentUser || !currentUser.access_token) return;
  try {
    const response = await fetch(`/api/get-quiz-history`, {
      headers: { Authorization: `Bearer ${currentUser.access_token}` },
    });
    if (!response.ok) throw new Error("History fetch failed");
    const history = await response.json();
    const highestScore = history.reduce((max, item) => Math.max(max, item.score), 0);
    updateDashboardStats(highestScore);
  } catch (error) { updateDashboardStats(0); }
}
// === END: DASHBOARD STATS ===

// === START: USER & PROFILE ===
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
  if (usernameSpan) usernameSpan.textContent = `Chào, ${currentUser.name_user}!`;
  
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
  document.getElementById("main-content-title").textContent = "Trang chủ";
  if (!document.getElementById("guest-welcome-message")) {
    const dashboardSection = document.getElementById("dashboard");
    const guestMessage = document.createElement("div");
    guestMessage.className = "card";
    guestMessage.id = "guest-welcome-message";
    guestMessage.innerHTML = '<h3>Chào mừng!</h3><p>Vui lòng <a href="login.html">đăng nhập</a> để sử dụng tính năng.</p>';
    if (dashboardSection.firstChild) dashboardSection.insertBefore(guestMessage, dashboardSection.firstChild);
    else dashboardSection.appendChild(guestMessage);
  }
}

async function editProfile(button) {
  if (!currentUser) { showAlert("Vui lòng đăng nhập."); return; }
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.access_token}` },
        body: JSON.stringify({ name_user: newName, phone_user: newPhone }),
      });
      if (!response.ok) throw new Error("Lỗi cập nhật.");
      currentUser.name_user = newName;
      currentUser.phone_user = newPhone;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      inputs.forEach((input) => input.setAttribute("readonly", true));
      document.querySelector(".user-menu .username").textContent = `Chào, ${newName}!`;
      showAlert("Cập nhật thành công!");
      button.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa thông tin';
    } catch (error) {
      showAlert(error.message);
      button.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    } finally {
      button.disabled = false;
    }
  }
}
// === END: USER & PROFILE ===

// === START: WEATHER FUNCTIONS ===
const weatherWidget = document.querySelector(".weather-widget");
const autoLocationBtn = document.getElementById("auto-location-btn");
const provinceSelect = document.getElementById("province-select");
const districtSelect = document.getElementById("district-select");

async function loadProvinces() {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/p/");
    if (!response.ok) throw new Error("Lỗi tải tỉnh thành");
    const provinces = await response.json();
    provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
    provinces.forEach(p => {
      const option = document.createElement("option");
      option.value = p.code;
      option.textContent = p.name;
      provinceSelect.appendChild(option);
    });
  } catch (error) { provinceSelect.innerHTML = '<option value="">Lỗi dữ liệu</option>'; }
}

async function loadDistricts(provinceCode) {
  if (!provinceCode) { districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>'; districtSelect.disabled = true; return; }
  try {
    districtSelect.disabled = true;
    districtSelect.innerHTML = '<option value="">Đang tải...</option>';
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    if (!response.ok) throw new Error("Lỗi tải quận huyện");
    const data = await response.json();
    districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    data.districts.forEach(d => {
      const option = document.createElement("option");
      option.value = d.name;
      option.textContent = d.name;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) { districtSelect.innerHTML = '<option value="">Lỗi dữ liệu</option>'; }
}

provinceSelect.addEventListener("change", () => loadDistricts(provinceSelect.value));

function changeWeatherLocation() {
  const dName = districtSelect.value;
  const pName = provinceSelect.options[provinceSelect.selectedIndex].text;
  if (dName && pName && provinceSelect.value) {
    getWeatherByManualSelection(`${dName}, ${pName}`);
  } else { showAlert("Vui lòng chọn đầy đủ thông tin."); }
}

async function getWeatherByManualSelection(query) {
  currentWeatherCoords = null; 
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang tải thời tiết...</p>";
  try {
    const response = await fetch(`/api/get-weather?location=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Lỗi tải thời tiết");
    const data = await response.json();
    renderWeatherData(data.current, data.forecast, query);
  } catch (error) { weatherWidget.innerHTML = `<p style="color: #ffcccc;">${error.message}</p>`; }
}

async function getWeatherByBrowser() {
  if (!weatherWidget) return;
  weatherWidget.innerHTML = "<p>Đang lấy vị trí...</p>";
  autoLocationBtn.disabled = true;
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        currentWeatherCoords = { lat, lon };
        weatherWidget.innerHTML = "<p>Đang tải dữ liệu...</p>";
        try {
          const response = await fetch(`/api/get-weather?lat=${lat}&lon=${lon}`);
          if (!response.ok) throw new Error("Lỗi API");
          const data = await response.json();
          const locationName = await getLocationName(lat, lon);
          renderWeatherData(data.current, data.forecast, locationName);
        } catch (error) { weatherWidget.innerHTML = `<p style="color: #ffcccc;">${error.message}</p>`; }
        finally { autoLocationBtn.disabled = false; }
      },
      (err) => {
        weatherWidget.innerHTML = `<p style="color: #ffcccc;">Không thể lấy vị trí.</p>`;
        autoLocationBtn.disabled = false;
      }
    );
  } else {
    weatherWidget.innerHTML = "<p>Trình duyệt không hỗ trợ.</p>";
    autoLocationBtn.disabled = false;
  }
}

async function getLocationName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`);
    const data = await res.json();
    if (data && data.address) {
      const { road, suburb, village, town, city_district, city, state } = data.address;
      return [road, suburb || village || town, city_district, city || state].filter(Boolean).join(", ");
    }
    return "Vị trí của bạn";
  } catch { return "Vị trí của bạn"; }
}

function renderWeatherData(current, forecast, locationName) {
  const getIcon = (code) => {
    const map = { "01": "fa-sun", "02": "fa-cloud-sun", "03": "fa-cloud", "04": "fa-cloud-meatball", "09": "fa-cloud-showers-heavy", "10": "fa-cloud-sun-rain", "11": "fa-poo-storm", "13": "fa-snowflake", "50": "fa-smog" };
    return map[code.substring(0, 2)] || "fa-cloud-sun";
  };
  const daily = [];
  const seen = {};
  forecast.list.forEach(item => {
    const d = new Date(item.dt * 1000).getUTCDate();
    if (d !== new Date().getUTCDate() && !seen[d] && daily.length < 4) {
      daily.push(item); seen[d] = true;
    }
  });
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  weatherWidget.innerHTML = `
    <div class="weather-main">
        <i class="fas ${getIcon(current.weather[0].icon)}"></i>
        <div class="weather-temp">${Math.round(current.main.temp)}°C</div>
        <div class="weather-location">${locationName}</div>
        <div class="weather-desc" style="text-transform: capitalize;">${current.weather[0].description}</div>
    </div>
    <div class="weather-forecast">
        ${daily.map(d => `
            <div class="forecast-item">
                <div>${days[new Date(d.dt * 1000).getDay()]}</div>
                <i class="fas ${getIcon(d.weather[0].icon)}"></i>
                <div>${Math.round(d.main.temp_max)}°</div>
            </div>`).join("")}
    </div>`;
}
// === END: WEATHER FUNCTIONS ===

// === START: FARMING ASSISTANT ===
const CROP_RULES = {
    rice: {
        name: "Cây Lúa",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 10) advice.push({ type: 'warning', text: "Mưa lớn: Ngưng bón đạm." });
            else if (rain > 0) advice.push({ type: 'info', text: "Mưa nhỏ: Có thể bón đón đòng." });
            if (temp > 35) advice.push({ type: 'warning', text: "Nắng nóng: Giữ nước cao." });
            if (wind > 15) advice.push({ type: 'danger', text: "Gió mạnh: Không phun thuốc." });
            if (advice.length === 0) advice.push({ type: 'success', text: "Thời tiết tốt: Chăm sóc bình thường." });
            return advice;
        }
    },
    durian: {
        name: "Sầu Riêng",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 20) advice.push({ type: 'danger', text: "Mưa to: Ngừa thối rễ, không bón gốc." });
            else if (rain === 0 && temp > 33) advice.push({ type: 'info', text: "Nắng nóng: Tưới giữ ẩm." });
            if (wind > 10) advice.push({ type: 'warning', text: "Gió: Chằng chống cây." });
            if (advice.length === 0) advice.push({ type: 'success', text: "Thời tiết tốt: Tỉa cành, làm cỏ." });
            return advice;
        }
    },
    coffee: {
        name: "Cà Phê",
        rules: (temp, rain, wind) => {
            let advice = [];
            if (rain > 5 && rain < 20) advice.push({ type: 'success', text: "Đất ẩm: Bón phân NPK." });
            else if (rain > 50) advice.push({ type: 'warning', text: "Mưa dầm: Ngưng bón phân." });
            else if (rain === 0) advice.push({ type: 'info', text: "Khô ráo: Làm cỏ, cắt cành." });
            if (advice.length === 0) advice.push({ type: 'success', text: "Canh tác bình thường." });
            return advice;
        }
    }
};

async function generateFarmingPlan() {
    const cropType = document.getElementById('crop-select').value;
    const resultContainer = document.getElementById('plan-results-container');
    const locationText = document.querySelector('.weather-location')?.textContent;

    if (!currentWeatherCoords && (!locationText || locationText === "Vị trí của bạn" || locationText === "")) {
        showAlert("Vui lòng xác định vị trí trước.");
        return;
    }
    resultContainer.innerHTML = '<p class="card" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Đang phân tích...</p>';
    try {
        let apiUrl = currentWeatherCoords 
            ? `/api/get-weather?lat=${currentWeatherCoords.lat}&lon=${currentWeatherCoords.lon}`
            : `/api/get-weather?location=${encodeURIComponent(locationText)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Lỗi thời tiết.");
        const data = await response.json();
        
        const dailyData = [];
        const processed = new Set();
        data.forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const key = date.toLocaleDateString('vi-VN');
            if (!processed.has(key) && (date.getHours() >= 11 || dailyData.length === 0)) {
                dailyData.push({
                    date: key,
                    weekday: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()],
                    temp: Math.round(item.main.temp),
                    rain: item.rain ? (item.rain['3h'] || 0) : 0,
                    wind: Math.round(item.wind.speed * 3.6),
                    icon: item.weather[0].icon
                });
                processed.add(key);
            }
        });

        const cropInfo = CROP_RULES[cropType];
        let html = `<h4 style="margin-bottom:20px; border-left: 4px solid #4CAF50; padding-left:10px;">Kế hoạch: <span style="color:#a5d6a7">${cropInfo.name}</span></h4><div class="plan-grid" style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">`;
        dailyData.slice(0, 5).forEach(day => {
            const advice = cropInfo.rules(day.temp, day.rain, day.wind);
            html += `
            <div class="card plan-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">
                    <span style="font-weight:bold;">${day.weekday} (${day.date})</span>
                    <img src="https://openweathermap.org/img/wn/${day.icon}.png" width="30">
                </div>
                <div style="font-size:0.9em; color:#aaa; display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>${day.temp}°C</span><span>${day.rain.toFixed(1)}mm</span><span>${day.wind}km/h</span>
                </div>
                <ul style="padding-left:20px; margin:0;">
                    ${advice.map(a => `<li style="color:${a.type==='warning'?'#f39c12':a.type==='danger'?'#e74c3c':a.type==='success'?'#2ecc71':'#3498db'}">${a.text}</li>`).join('')}
                </ul>
            </div>`;
        });
        resultContainer.innerHTML = html + "</div>";
    } catch (error) { resultContainer.innerHTML = `<p class="card" style="color:#ffcccc;">Lỗi: ${error.message}</p>`; }
}
// === END: FARMING ASSISTANT ===

// === START: INIT ===
document.addEventListener("DOMContentLoaded", function () {
  loadAndRenderCourses();
  const userData = localStorage.getItem("currentUser");
  if (userData) { currentUser = JSON.parse(userData); setupUserUI(); } 
  else { setupGuestUI(); }

  // Modal events
  if (modalCloseBtn) modalCloseBtn.onclick = closeAlertModal;
  if (alertModal) alertModal.onclick = (e) => { if (e.target === alertModal) closeAlertModal(); };
  if (confirmModalCancelBtn) confirmModalCancelBtn.onclick = closeConfirmModal;
  if (confirmModal) confirmModal.onclick = (e) => { if (e.target === confirmModal) closeConfirmModal(); };
  if (createPostBtn) createPostBtn.onclick = () => createPostModal.classList.add("active");
  if (closeCreatePostModalBtn) closeCreatePostModalBtn.onclick = () => createPostModal.classList.remove("active");
  if (cancelCreatePostBtn) cancelCreatePostBtn.onclick = () => createPostModal.classList.remove("active");
  if (createPostModal) createPostModal.onclick = (e) => { if (e.target === createPostModal) createPostModal.classList.remove("active"); };
  if (createPostForm) createPostForm.addEventListener("submit", handleCreatePost);

  if (autoLocationBtn) autoLocationBtn.onclick = getWeatherByBrowser;
  loadProvinces();

  // Delegation cho nút xem thêm
  const forumContainer = document.getElementById("forum-posts-container");
  if (forumContainer) {
    forumContainer.addEventListener("click", function (e) {
      if (e.target.matches("a.expand-link")) {
        e.preventDefault();
        const action = e.target.dataset.action;
        const p = e.target.closest(".post-content-container");
        if (!p) return;
        let len = parseInt(p.dataset.currentLength, 10);
        const full = p.dataset.fullText;
        if (action === "more") len = Math.min(len + 200, full.length);
        else len = 200;
        p.dataset.currentLength = len;
        managePostContent(p);
      }
    });
  }

  // Hash navigation
  const hash = window.location.hash.substring(1);
  if (hash) {
    const link = document.querySelector(`.nav-tab[onclick*="'${hash}'"]`);
    if (link) showSection(hash, link);
  } else { showSection("dashboard", document.querySelector(".nav-tab.active")); }

  const btnGen = document.getElementById("btn-generate-plan");
  if (btnGen) btnGen.addEventListener("click", generateFarmingPlan);
});
// === END: INIT ===

// EXPOSE TO WINDOW
window.showSection = showSection;
window.logout = logout;
window.changeWeatherLocation = changeWeatherLocation;
window.editProfile = editProfile;
window.toggleComments = toggleComments;