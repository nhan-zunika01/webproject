document.addEventListener("DOMContentLoaded", () => {
  // === DOM ELEMENTS ===
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultsScreen = document.getElementById("results-screen");

  // Start Screen
  const quizTitleEl = document.getElementById("quiz-title");
  const quizQuestionCountEl = document.getElementById("quiz-question-count");
  const quizTimeLimitEl = document.getElementById("quiz-time-limit");
  const attemptsInfoEl = document.getElementById("attempts-info");
  const highscoreInfoEl = document.getElementById("highscore-info");
  const startBtn = document.getElementById("start-btn");

  // Quiz Screen
  const questionContainer = document.getElementById("question-container");
  const timeLeftEl = document.getElementById("time-left");
  const progressBar = document.getElementById("progress-bar");
  const currentQuesNumEl = document.getElementById("current-question-num");
  const totalQuestionNumEl = document.getElementById("total-question-num");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");
  const exitQuizBtn = document.getElementById("exit-quiz-btn");

  // Results Screen
  const scoreTextEl = document.getElementById("score-text");
  const resultMessageEl = document.getElementById("result-message");
  const reviewContainer = document.getElementById("review-container");
  const retakeBtn = document.getElementById("retake-btn");
  const reviewBtn = document.getElementById("review-btn");

  // Modals & Overlays
  const loadingOverlay = document.getElementById("loading-overlay");
  const confirmationModal = document.getElementById("confirmation-modal");
  const confirmTitleEl = document.getElementById("confirm-title");
  const confirmMessageEl = document.getElementById("confirm-message");
  const confirmSubmitBtn = document.getElementById("confirm-submit-btn");
  const cancelSubmitBtn = document.getElementById("cancel-submit-btn");
  const resumeModal = document.getElementById("resume-modal");
  const resumeYesBtn = document.getElementById("resume-yes-btn");
  const resumeNoBtn = document.getElementById("resume-no-btn");
  const alertModal = document.getElementById("alert-modal");
  const alertMessage = document.getElementById("alert-message");
  const alertCloseBtn = document.getElementById("alert-close-btn");

  // === STATE VARIABLES ===
  let currentUser = null;
  let quizId = null;
  let questions = [];
  let timeLimitInMinutes = 0;
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let timer;
  let timeRemaining = 0;
  let quizInProgress = false;
  let quizStateKey = "";

  // === CORE FUNCTIONS ===

  const showScreen = (screenId) => {
    document
      .querySelectorAll(".quiz-screen")
      .forEach((screen) => screen.classList.remove("active"));
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
      screenToShow.classList.add("active");
    }
  };

  const showInfoModal = (message, title = "Thông báo") => {
    if (alertModal && alertMessage) {
      document.getElementById("alert-title").textContent = title;
      alertMessage.textContent = message;
      alertModal.classList.add("active");
    }
  };

  const showConfirmModal = (message, title = "Xác nhận") => {
    confirmTitleEl.textContent = title;
    confirmMessageEl.textContent = message;
    confirmationModal.classList.add("active");
    return new Promise((resolve) => {
      confirmSubmitBtn.onclick = () => {
        confirmationModal.classList.remove("active");
        resolve(true);
      };
      cancelSubmitBtn.onclick = () => {
        confirmationModal.classList.remove("active");
        resolve(false);
      };
      confirmationModal.addEventListener(
        "click",
        (e) => {
          if (e.target === confirmationModal) {
            confirmationModal.classList.remove("active");
            resolve(false);
          }
        },
        { once: true }
      );
    });
  };

  const fetchAllQuizzes = async () => {
    try {
      const response = await fetch("data/quizzes.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch quizzes.json:", error);
      return null;
    }
  };

  const initializeQuizPage = async () => {
    loadingOverlay.style.display = "flex";
    const params = new URLSearchParams(window.location.search);
    quizId = params.get("id");

    if (!quizId) {
      showInfoModal("Không tìm thấy ID bài kiểm tra trong URL.", "Lỗi");
      loadingOverlay.style.display = "none";
      return;
    }

    const allQuizzes = await fetchAllQuizzes();
    if (!allQuizzes || !allQuizzes[quizId]) {
      showInfoModal(
        `Không tìm thấy dữ liệu cho bài kiểm tra với ID: ${quizId}.`,
        "Lỗi"
      );
      loadingOverlay.style.display = "none";
      return;
    }

    const quizData = allQuizzes[quizId];
    questions = quizData.questions;
    timeLimitInMinutes = quizData.timeLimit;

    document.title = `${quizData.title} - AgriNova`;
    quizTitleEl.textContent = quizData.title;
    quizQuestionCountEl.textContent = quizData.totalQuestions;
    quizTimeLimitEl.textContent = quizData.timeLimit;
    totalQuestionNumEl.textContent = quizData.totalQuestions;
    highscoreInfoEl.textContent = `Điểm cao nhất: 0/${quizData.totalQuestions}`;

    const userData = localStorage.getItem("currentUser");
    if (userData) {
      currentUser = JSON.parse(userData);
      quizStateKey = `quizState_${quizId}_${currentUser.id}`;
      checkAndResume();
    } else {
      showScreen("start-screen");
      loadInitialInfo();
    }
    loadingOverlay.style.display = "none";
  };

  const saveQuizState = () => {
    if (!quizInProgress || !currentUser) return;
    const state = { currentQuestionIndex, userAnswers, timeRemaining };
    localStorage.setItem(quizStateKey, JSON.stringify(state));
  };

  const clearQuizState = () => {
    if (currentUser) {
      localStorage.removeItem(quizStateKey);
    }
  };

  const loadInitialInfo = async () => {
    if (!currentUser || !currentUser.access_token) {
      attemptsInfoEl.textContent = `Số lần đã thi: -`;
      highscoreInfoEl.textContent = `Điểm cao nhất: -`;
      return;
    }
    try {
      const response = await fetch(`/api/get-quiz-history?quizId=${quizId}`, {
        headers: { Authorization: `Bearer ${currentUser.access_token}` },
      });
      if (!response.ok) {
        throw new Error("Không thể lấy lịch sử làm bài.");
      }
      const history = await response.json();
      const currentQuizHistory = history.filter((r) => r.quiz_id === quizId);
      const attempts = currentQuizHistory.length;
      attemptsInfoEl.textContent = `Số lần đã thi: ${attempts}`;
      if (attempts > 0) {
        const highScore = Math.max(
          ...currentQuizHistory.map((r) => r.score),
          0
        );
        highscoreInfoEl.textContent = `Điểm cao nhất: ${highScore}/${questions.length}`;
      } else {
        highscoreInfoEl.textContent = `Điểm cao nhất: 0/${questions.length}`;
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử bài kiểm tra:", error);
      attemptsInfoEl.textContent = `Số lần đã thi: Lỗi`;
      highscoreInfoEl.textContent = `Điểm cao nhất: Lỗi`;
    }
  };

  const checkAndResume = async () => {
    await loadInitialInfo();
    if (currentUser) {
      const savedStateJSON = localStorage.getItem(quizStateKey);
      if (savedStateJSON) {
        resumeModal.classList.add("active");
      } else {
        showScreen("start-screen");
      }
    } else {
      showScreen("start-screen");
    }
  };

  const resumeQuiz = () => {
    const savedStateJSON = localStorage.getItem(quizStateKey);
    if (!savedStateJSON) return;
    const savedState = JSON.parse(savedStateJSON);
    currentQuestionIndex = savedState.currentQuestionIndex;
    userAnswers = savedState.userAnswers;
    timeRemaining = savedState.timeRemaining;
    quizInProgress = true;
    startTimer();
    showScreen("quiz-screen");
    renderQuestion();
  };

  const startQuiz = () => {
    if (!currentUser) {
      showInfoModal("Vui lòng đăng nhập để bắt đầu bài kiểm tra.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return;
    }
    clearQuizState();
    currentQuestionIndex = 0;
    userAnswers = Array(questions.length).fill(null);
    timeRemaining = timeLimitInMinutes * 60;
    quizInProgress = true;
    showScreen("quiz-screen");
    startTimer();
    renderQuestion();
  };

  const startTimer = () => {
    updateTimerDisplay();
    clearInterval(timer);
    timer = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timer);
        endQuiz(true);
      }
    }, 1000);
  };

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeLeftEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    timeLeftEl.parentElement.classList.toggle("warning", timeRemaining < 60);
  };

  const handleOptionSelect = (e) => {
    const selectedIndex = parseInt(e.currentTarget.dataset.index);
    userAnswers[currentQuestionIndex] = selectedIndex;
    renderQuestion();
    saveQuizState();
  };

  const navigateQuestion = (direction) => {
    if (direction === "next" && currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
    } else if (direction === "prev" && currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
    renderQuestion();
  };

  const renderQuestion = () => {
    if (questions.length === 0) return;
    const question = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    currentQuesNumEl.textContent = currentQuestionIndex + 1;
    progressBar.style.width = `${
      ((currentQuestionIndex + 1) / questions.length) * 100
    }%`;
    questionContainer.innerHTML = `
      <p class="question-text">${currentQuestionIndex + 1}. ${
      question.question
    }</p>
      <ul class="options-list">${question.options
        .map(
          (option, index) =>
            `<li class="option ${
              index === userAnswer ? "selected" : ""
            }" data-index="${index}">${option}</li>`
        )
        .join("")}</ul>`;
    document.querySelectorAll(".option").forEach((optionEl) => {
      optionEl.addEventListener("click", handleOptionSelect);
    });
    prevBtn.disabled = currentQuestionIndex === 0;
    if (currentQuestionIndex === questions.length - 1) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "inline-flex";
    } else {
      nextBtn.style.display = "inline-flex";
      submitBtn.style.display = "none";
    }
  };

  const endQuiz = async (isTimeUp = false) => {
    if (!quizInProgress) return;

    if (!isTimeUp) {
      const confirmed = await showConfirmModal(
        "Bạn có chắc chắn muốn nộp bài không?"
      );
      if (!confirmed) return;
    } else {
      showInfoModal("Hết giờ làm bài! Bài của bạn sẽ được nộp tự động.");
    }

    quizInProgress = false;
    clearInterval(timer);
    let score = userAnswers.reduce(
      (total, answer, index) =>
        questions[index] && answer === questions[index].answer
          ? total + 1
          : total,
      0
    );
    scoreTextEl.textContent = `${score} / ${questions.length}`;

    const percentage = (score / questions.length) * 100;
    resultMessageEl.textContent =
      percentage >= 80
        ? "Xuất sắc! Bạn có kiến thức rất tốt."
        : percentage >= 50
        ? "Khá tốt! Hãy tiếp tục học hỏi để cải thiện nhé."
        : "Cần cố gắng hơn. Hãy xem lại bài làm để củng cố kiến thức nhé!";

    renderReview();
    showScreen("results-screen");

    try {
      loadingOverlay.querySelector("p").textContent = "Đang lưu kết quả...";
      loadingOverlay.style.display = "flex";
      await saveResultToDB(score);
    } catch (error) {
      // CẬP NHẬT: Xử lý lỗi hết hạn phiên đăng nhập một cách đặc biệt
      if (error.message === "SESSION_EXPIRED") {
        showInfoModal(
          "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để lưu kết quả.",
          "Phiên đã hết hạn"
        );
        // Chuyển hướng đến trang đăng nhập sau 3 giây
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      } else {
        console.error("Failed to save score:", error);
        showInfoModal(
          `Lỗi: ${error.message}. Vui lòng liên hệ quản trị viên.`,
          "Không thể lưu kết quả"
        );
      }
    } finally {
      loadingOverlay.style.display = "none";
      clearQuizState();
    }
  };

  const renderReview = () => {
    let reviewHTML = "<h2>Xem lại bài làm</h2>";
    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      const optionsHTML = q.options
        .map((opt, optIndex) => {
          let className = "option";
          if (optIndex === q.answer) className += " correct";
          else if (optIndex === userAnswer && userAnswer !== q.answer)
            className += " incorrect";
          const label =
            optIndex === userAnswer
              ? ' <span class="user-answer-label">Đáp án của bạn</span>'
              : "";
          return `<li class="${className}"><span>${opt}</span>${label}</li>`;
        })
        .join("");
      reviewHTML += `<div class="question-card"><p class="question-text">${
        index + 1
      }. ${
        q.question
      }</p><ul class="options-list review-options">${optionsHTML}</ul></div>`;
    });
    const reviewActionButtons =
      reviewContainer.querySelector(".result-actions");
    reviewContainer.innerHTML = reviewHTML;
    if (reviewActionButtons) reviewContainer.appendChild(reviewActionButtons);
  };

  const saveResultToDB = async (score) => {
    if (!currentUser || !currentUser.access_token) {
      throw new Error("Người dùng không được xác thực.");
    }
    const response = await fetch("/api/save-quiz-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.access_token}`,
      },
      body: JSON.stringify({ quizId: quizId, score: score }),
    });

    // CẬP NHẬT: Kiểm tra lỗi 401 (Unauthorized) để xác định phiên hết hạn
    if (response.status === 401) {
      localStorage.removeItem("currentUser");
      throw new Error("SESSION_EXPIRED");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          "Không thể lưu điểm. Phản hồi không hợp lệ từ máy chủ."
      );
    }
    return await response.json();
  };

  // --- INITIALIZATION & EVENT LISTENERS ---
  const init = () => {
    initializeQuizPage();

    startBtn.addEventListener("click", startQuiz);
    retakeBtn.addEventListener("click", () => window.location.reload());
    reviewBtn.addEventListener("click", () => {
      reviewContainer.style.display = "block";
      reviewBtn.style.display = "none";
    });
    prevBtn.addEventListener("click", () => navigateQuestion("prev"));
    nextBtn.addEventListener("click", () => navigateQuestion("next"));
    submitBtn.addEventListener("click", () => endQuiz(false));

    exitQuizBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (quizInProgress) {
        const confirmed = await showConfirmModal(
          "Tiến trình hiện tại sẽ được lưu lại. Bạn có chắc chắn muốn thoát không?",
          "Xác nhận rời đi"
        );
        if (confirmed) {
          saveQuizState();
          window.location.href = "dash.html#quiz";
        }
      } else {
        window.location.href = "dash.html#quiz";
      }
    });

    resumeYesBtn.addEventListener("click", () => {
      resumeModal.classList.remove("active");
      resumeQuiz();
    });
    resumeNoBtn.addEventListener("click", () => {
      resumeModal.classList.remove("active");
      clearQuizState();
      startQuiz();
    });

    if (alertCloseBtn) {
      alertCloseBtn.addEventListener("click", () =>
        alertModal.classList.remove("active")
      );
    }
    if (alertModal) {
      alertModal.addEventListener("click", (e) => {
        if (e.target === alertModal) {
          alertModal.classList.remove("active");
        }
      });
    }

    window.addEventListener("beforeunload", () => {
      if (quizInProgress) {
        saveQuizState();
      }
    });
  };

  init();
});
