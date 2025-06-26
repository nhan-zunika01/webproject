// This single script should be used for both course-rice-detail.html and course-chicken-detail.html
document.addEventListener("DOMContentLoaded", async function () {
  // --- CONFIG & STATE ---
  // The following variables MUST be defined in a <script> tag in the HTML file
  // BEFORE this script is included.
  // const courseId = 'unique-course-id';
  // const courseData = [ { title: '...', lessons: [ ... ] } ];

  let currentUser = null;
  let progressData = { completed_lessons: [] }; // Default empty progress
  let currentChapterIndex = -1;
  let currentLessonIndex = -1;
  let supabaseToken = null;

  // --- DOM ELEMENTS ---
  const overviewView = document.getElementById("course-overview");
  const lessonView = document.getElementById("lesson-view");
  const accordionContainer = document.getElementById("accordion-container");
  const progressBar = document.getElementById("course-progress-bar");
  const progressText = document.getElementById("progress-text");
  const loginPromptContainer = document.getElementById(
    "login-prompt-container"
  );
  const backToOverviewBtn = document.getElementById("back-to-overview-btn");
  const lessonTitle = document.getElementById("lesson-title");
  const lessonContent = document.getElementById("lesson-content");
  const markLessonCompleteBtn = document.getElementById("mark-lesson-complete");
  const prevLessonBtn = document.getElementById("prev-lesson-btn");
  const nextLessonBtn = document.getElementById("next-lesson-btn");
  const breadcrumbChapter = document.getElementById("breadcrumb-chapter");
  const breadcrumbLesson = document.getElementById("breadcrumb-lesson");

  // --- API HELPER ---
  const fetchAPI = async (endpoint, method = "GET", body = null) => {
    if (!supabaseToken) {
      // console.log("No auth token, skipping API call.");
      return null;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseToken}`,
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      if (method === "GET" && response.status !== 204) {
        return response.json();
      }
      return response;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  };

  // --- DATA FUNCTIONS ---
  async function loadProgressFromDB() {
    if (!currentUser) return;
    try {
      const savedProgress = await fetchAPI(
        `/api/course-progress?courseId=${window.courseId}`
      );
      if (savedProgress && savedProgress.completed_lessons) {
        progressData.completed_lessons = savedProgress.completed_lessons;
      }
    } catch (error) {
      console.error("Could not load progress from database.", error.message);
    }
  }

  async function saveProgressToDB() {
    if (!currentUser) return;
    try {
      await fetchAPI("/api/course-progress", "POST", {
        courseId: window.courseId,
        completed_lessons: progressData.completed_lessons,
      });
    } catch (error) {
      console.error("Could not save progress to database.", error.message);
    }
  }

  // --- RENDER FUNCTIONS ---
  function renderOverview() {
    overviewView.classList.remove("view-hidden");
    lessonView.classList.add("view-hidden");

    accordionContainer.innerHTML = "";
    let completedChapters = 0;
    const localCourseData = window.courseData || [];

    localCourseData.forEach((chapter, chapterIndex) => {
      const lessonsInChapter = chapter.lessons;
      let lessonsHTML = "<ul>";
      let completedLessonsInChapter = 0;

      lessonsInChapter.forEach((lesson) => {
        const isCompleted = progressData.completed_lessons.includes(lesson.id);
        if (isCompleted) completedLessonsInChapter++;
        lessonsHTML += `
                    <li>
                        <span>${lesson.title}</span>
                        <i class="fas ${
                          isCompleted ? "fa-check-circle" : "fa-circle"
                        } lesson-status-icon ${
          isCompleted ? "completed" : ""
        }"></i>
                    </li>`;
      });
      lessonsHTML += "</ul>";

      if (
        completedLessonsInChapter === lessonsInChapter.length &&
        lessonsInChapter.length > 0
      ) {
        completedChapters++;
      }

      const accordionItem = document.createElement("div");
      accordionItem.className = "accordion-item";
      accordionItem.innerHTML = `
                <button class="accordion-header">
                    <span>Chương ${chapterIndex + 1}: ${chapter.title}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="accordion-content">
                    <div class="content-inner">
                        ${lessonsHTML}
                        <div class="btn-start-chapter">
                            <button class="btn btn-secondary btn-start" data-chapter="${chapterIndex}">Bắt đầu chương học</button>
                        </div>
                    </div>
                </div>`;
      accordionContainer.appendChild(accordionItem);
    });

    const totalChapters = localCourseData.length;
    const progressPercentage =
      totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `${completedChapters}/${totalChapters} chương hoàn thành`;

    document.querySelectorAll(".accordion-header").forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        header.classList.toggle("active");
        content.style.maxHeight = header.classList.contains("active")
          ? content.scrollHeight + "px"
          : null;
      });
    });

    document.querySelectorAll(".btn-start").forEach((button) => {
      button.addEventListener("click", (e) => {
        const chapterIndex = parseInt(e.target.dataset.chapter);
        startChapter(chapterIndex);
      });
    });
  }

  function renderLesson(chapterIndex, lessonIndex) {
    currentChapterIndex = chapterIndex;
    currentLessonIndex = lessonIndex;

    overviewView.classList.add("view-hidden");
    lessonView.classList.remove("view-hidden");

    const chapter = window.courseData[chapterIndex];
    const lesson = chapter.lessons[lessonIndex];

    breadcrumbChapter.textContent = `Chương ${chapterIndex + 1}`;
    breadcrumbLesson.textContent = lesson.title;

    lessonTitle.textContent = lesson.title;
    lessonContent.innerHTML =
      lesson.content || "<p>Nội dung đang được cập nhật.</p>";

    const isCompleted = progressData.completed_lessons.includes(lesson.id);
    markLessonCompleteBtn.classList.toggle("completed", isCompleted);
    markLessonCompleteBtn.querySelector("span").textContent = isCompleted
      ? "Đã hoàn thành"
      : "Đánh dấu đã học xong";
    markLessonCompleteBtn.disabled = !currentUser || isCompleted;

    prevLessonBtn.disabled = chapterIndex === 0 && lessonIndex === 0;

    const isLastLessonInCourse =
      chapterIndex === window.courseData.length - 1 &&
      lessonIndex === chapter.lessons.length - 1;
    nextLessonBtn.disabled = isLastLessonInCourse;
    if (lessonIndex === chapter.lessons.length - 1 && !isLastLessonInCourse) {
      nextLessonBtn.innerHTML =
        'Chương tiếp theo <i class="fas fa-arrow-right"></i>';
    } else {
      nextLessonBtn.innerHTML =
        'Bài tiếp theo <i class="fas fa-arrow-right"></i>';
    }

    window.scrollTo(0, 0);
  }

  function startChapter(chapterIndex) {
    const localCourseData = window.courseData || [];
    if (
      localCourseData[chapterIndex] &&
      localCourseData[chapterIndex].lessons.length > 0
    ) {
      renderLesson(chapterIndex, 0);
    } else {
      alert("Chương này hiện chưa có bài học.");
    }
  }

  async function handleMarkComplete() {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để lưu tiến độ.");
      return;
    }
    const lesson =
      window.courseData[currentChapterIndex].lessons[currentLessonIndex];
    if (!progressData.completed_lessons.includes(lesson.id)) {
      progressData.completed_lessons.push(lesson.id);
      await saveProgressToDB();
    }
    renderLesson(currentChapterIndex, currentLessonIndex);
  }

  function handleNavigation(direction) {
    let nextLesson = currentLessonIndex;
    let nextChapter = currentChapterIndex;
    const localCourseData = window.courseData || [];

    if (direction === "next") {
      if (
        currentLessonIndex <
        localCourseData[currentChapterIndex].lessons.length - 1
      ) {
        nextLesson++;
      } else if (currentChapterIndex < localCourseData.length - 1) {
        nextChapter++;
        nextLesson = 0;
      }
    } else if (direction === "prev") {
      if (currentLessonIndex > 0) {
        nextLesson--;
      } else if (currentChapterIndex > 0) {
        nextChapter--;
        nextLesson = localCourseData[nextChapter].lessons.length - 1;
      }
    }
    renderLesson(nextChapter, nextLesson);
  }

  // --- INITIALIZATION ---
  async function init() {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      currentUser = JSON.parse(userData);
      if (currentUser.access_token) supabaseToken = currentUser.access_token;
    }

    await loadProgressFromDB();
    renderOverview();
    loginPromptContainer.classList.toggle("view-hidden", !!currentUser);

    // Add event listeners
    backToOverviewBtn.addEventListener("click", renderOverview);
    markLessonCompleteBtn.addEventListener("click", handleMarkComplete);
    prevLessonBtn.addEventListener("click", () => handleNavigation("prev"));
    nextLessonBtn.addEventListener("click", () => handleNavigation("next"));
  }

  init();
});
