// File: logic/course.js
// Script này sẽ điều khiển trang course.html
// PHIÊN BẢN CẬP NHẬT: Tải dữ liệu từ file JSON.

function initializeCoursePage(allCourses) {
  // Nhận dữ liệu khóa học làm tham số
  // Bọc toàn bộ logic trong khối try...catch để xử lý lỗi an toàn
  try {
    // --- LẤY DỮ LIỆU KHÓA HỌC HIỆN TẠI ---
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("id");

    if (!courseId) {
      throw new Error(
        "Không tìm thấy 'id' của khóa học trong URL. URL phải có dạng 'course.html?id=TEN_KHOA_HOC'."
      );
    }

    const course = allCourses[courseId]; // Sử dụng dữ liệu đã được truyền vào

    if (!course) {
      throw new Error(
        `Không tìm thấy dữ liệu cho khóa học với ID: "${courseId}". Vui lòng kiểm tra lại ID trong file 'data/courses.json'.`
      );
    }

    // --- STATE & DOM ELEMENTS ---
    let currentUser = null;
    let progressData = { completed_lessons: [] };
    let currentChapterIndex = -1;
    let currentLessonIndex = -1;
    let supabaseToken = null;

    const overviewView = document.getElementById("course-overview");
    const mainTitle = document.getElementById("course-title-main");
    const pageTitle = document.querySelector("title");
    const metaExpert = document.getElementById("meta-expert");
    const metaField = document.getElementById("meta-field");
    const metaDuration = document.getElementById("meta-duration");
    const courseImage = document.getElementById("course-image");
    const courseSapo = document.getElementById("course-sapo");
    const progressBar = document.getElementById("course-progress-bar");
    const progressText = document.getElementById("progress-text");
    const accordionContainer = document.getElementById("accordion-container");
    const loginPromptContainer = document.getElementById(
      "login-prompt-container"
    );
    const quizCtaContainer = document.getElementById("quiz-cta-container");

    const lessonView = document.getElementById("lesson-view");
    const backToOverviewBtn = document.getElementById("back-to-overview-btn");
    const lessonTitle = document.getElementById("lesson-title");
    const lessonContent = document.getElementById("lesson-content");
    const markLessonCompleteBtn = document.getElementById(
      "mark-lesson-complete"
    );
    const prevLessonBtn = document.getElementById("prev-lesson-btn");
    const nextLessonBtn = document.getElementById("next-lesson-btn");
    const breadcrumbChapter = document.getElementById("breadcrumb-chapter");
    const breadcrumbLesson = document.getElementById("breadcrumb-lesson");

    // --- FUNCTIONS ---
    async function loadProgressFromDB() {
      if (!currentUser) return;
      try {
        const response = await fetch(
          `/api/course-progress?courseId=${courseId}`,
          {
            headers: { Authorization: `Bearer ${supabaseToken}` },
          }
        );
        if (!response.ok) throw new Error("Could not fetch progress");
        const savedProgress = await response.json();
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
        await fetch("/api/course-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify({
            courseId: courseId,
            completed_lessons: progressData.completed_lessons,
          }),
        });
      } catch (error) {
        console.error("Could not save progress to database.", error.message);
      }
    }

    function populateCourseOverview() {
      pageTitle.textContent = `${course.title} - ArgiNova`;
      mainTitle.textContent = course.title;
      metaExpert.innerHTML = `<i class="fas fa-user-tie"></i> Chuyên gia: ${course.meta.expert}`;
      metaField.innerHTML = `<i class="fas fa-layer-group"></i> Lĩnh vực: ${course.meta.field}`;
      metaDuration.innerHTML = `<i class="fas fa-clock"></i> Thời lượng: ${course.meta.duration}`;
      courseImage.src = course.image;
      courseImage.alt = course.imageAlt;
      courseSapo.textContent = course.sapo;

      if (course.quizId) {
        // === SỬA LỖI TẠI ĐÂY ===
        // Đường dẫn `href` đã được sửa để trỏ đến quiz.html với đúng ID.
        quizCtaContainer.innerHTML = `
                  <h3>Kiểm tra kiến thức của bạn!</h3>
                  <p>Sau khi hoàn thành khóa học, hãy làm bài kiểm tra để củng cố kiến thức.</p>
                  <a href="quiz.html?id=${course.quizId}" class="btn btn-primary">Làm bài kiểm tra ngay</a>`;
      } else {
        quizCtaContainer.innerHTML = `
                  <h3>Kiểm tra kiến thức của bạn!</h3>
                  <p>Bài kiểm tra cho khóa học này đang được phát triển. Vui lòng quay lại sau!</p>
                  <button class="btn btn-primary disabled" disabled>Bài kiểm tra sắp ra mắt</button>`;
      }
    }

    function renderOverview() {
      overviewView.classList.remove("view-hidden");
      lessonView.classList.add("view-hidden");
      accordionContainer.innerHTML = "";
      let completedChapters = 0;

      course.chapters.forEach((chapter, chapterIndex) => {
        const lessonsInChapter = chapter.lessons;
        let lessonsHTML = "<ul>";
        let completedLessonsInChapter = 0;

        lessonsInChapter.forEach((lesson) => {
          const isCompleted = progressData.completed_lessons.includes(
            lesson.id
          );
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

      const totalChapters = course.chapters.length;
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
        button.addEventListener("click", (e) =>
          startChapter(parseInt(e.currentTarget.dataset.chapter))
        );
      });
    }

    function renderLesson(chapterIndex, lessonIndex) {
      currentChapterIndex = chapterIndex;
      currentLessonIndex = lessonIndex;
      overviewView.classList.add("view-hidden");
      lessonView.classList.remove("view-hidden");
      const chapter = course.chapters[chapterIndex];
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
        chapterIndex === course.chapters.length - 1 &&
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
      if (
        course.chapters[chapterIndex] &&
        course.chapters[chapterIndex].lessons.length > 0
      ) {
        renderLesson(chapterIndex, 0);
      } else {
        alert("Chương này hiện chưa có bài học.");
      }
    }

    async function handleMarkComplete() {
      if (!currentUser) return;
      const lesson =
        course.chapters[currentChapterIndex].lessons[currentLessonIndex];
      if (!progressData.completed_lessons.includes(lesson.id)) {
        progressData.completed_lessons.push(lesson.id);
        await saveProgressToDB();
      }
      renderLesson(currentChapterIndex, currentLessonIndex);
    }

    function handleNavigation(direction) {
      let nextLesson = currentLessonIndex;
      let nextChapter = currentChapterIndex;
      if (direction === "next") {
        if (
          currentLessonIndex <
          course.chapters[currentChapterIndex].lessons.length - 1
        )
          nextLesson++;
        else if (currentChapterIndex < course.chapters.length - 1) {
          nextChapter++;
          nextLesson = 0;
        }
      } else if (direction === "prev") {
        if (currentLessonIndex > 0) nextLesson--;
        else if (currentChapterIndex > 0) {
          nextChapter--;
          nextLesson = course.chapters[nextChapter].lessons.length - 1;
        }
      }
      renderLesson(nextChapter, nextLesson);
    }

    // Hàm init chính, được gọi sau khi dữ liệu sẵn sàng
    async function main() {
      const userData = localStorage.getItem("currentUser");
      if (userData) {
        currentUser = JSON.parse(userData);
        supabaseToken = currentUser.access_token;
      }
      populateCourseOverview();
      await loadProgressFromDB();
      renderOverview();
      loginPromptContainer.classList.toggle("view-hidden", !!currentUser);
      backToOverviewBtn.addEventListener("click", renderOverview);
      markLessonCompleteBtn.addEventListener("click", handleMarkComplete);
      prevLessonBtn.addEventListener("click", () => handleNavigation("prev"));
      nextLessonBtn.addEventListener("click", () => handleNavigation("next"));
    }

    // Chạy hàm chính
    main();
  } catch (error) {
    // Nếu có bất kỳ lỗi nào, hiển thị thông báo thân thiện
    console.error("Lỗi nghiêm trọng khi khởi tạo trang khóa học:", error);
    const container = document.getElementById("course-container");
    if (container) {
      container.innerHTML = `
              <div style="padding: 40px; text-align: center;">
                  <h1>Đã xảy ra lỗi</h1>
                  <p>Không thể tải nội dung khóa học. Vui lòng thử lại sau.</p>
                  <p style="background: rgba(255, 100, 100, 0.1); color: #ffcccc; padding: 15px; border-radius: 8px; font-family: monospace; text-align: left; margin-top: 20px; border: 1px solid rgba(255, 100, 100, 0.2);">
                      <strong>Chi tiết lỗi:</strong> ${error.message}
                  </p>
              </div>`;
    }
  }
}

// Hàm khởi động ứng dụng, sẽ tải dữ liệu JSON trước
async function startApp() {
  try {
    const response = await fetch("data/courses.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allCourses = await response.json();
    initializeCoursePage(allCourses); // Bắt đầu ứng dụng với dữ liệu đã tải
  } catch (error) {
    const errorMessage = `Không thể tải hoặc phân tích tệp 'data/courses.json'. Vui lòng kiểm tra lại đường dẫn và đảm bảo tệp có định dạng JSON hợp lệ. Chi tiết: ${error.message}`;
    console.error(errorMessage);
    const container = document.getElementById("course-container");
    if (container) {
      container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h1>Đã xảy ra lỗi</h1>
                    <p>Không thể tải nội dung khóa học. Vui lòng thử lại sau.</p>
                    <p style="background: rgba(255, 100, 100, 0.1); color: #ffcccc; padding: 15px; border-radius: 8px; font-family: monospace; text-align: left; margin-top: 20px; border: 1px solid rgba(255, 100, 100, 0.2);">
                        <strong>Chi tiết lỗi:</strong> ${errorMessage}
                    </p>
                </div>`;
    }
  }
}

// Bắt đầu ứng dụng khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", startApp);
