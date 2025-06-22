document.addEventListener("DOMContentLoaded", () => {
  // === DOM ELEMENTS ===
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultsScreen = document.getElementById("results-screen");
  const startBtn = document.getElementById("start-btn");
  const submitBtn = document.getElementById("submit-btn");
  const reviewBtn = document.getElementById("review-btn");
  const questionContainer = document.getElementById("question-container");
  const timeLeftEl = document.getElementById("time-left");
  const progressBar = document.getElementById("progress-bar");
  const currentQuesNumEl = document.getElementById("current-question-num");
  const scoreTextEl = document.getElementById("score-text");
  const resultMessageEl = document.getElementById("result-message");
  const reviewContainer = document.getElementById("review-container");
  const loadingOverlay = document.getElementById("loading-overlay");

  // === QUIZ DATA ===
  const QUIZ_ID = "rice-basics-v1";
  const questions = [
    {
      question: "Giai đoạn nào cây lúa cần nhiều nước nhất?",
      options: ["Làm đòng - trổ bông", "Mạ", "Đẻ nhánh", "Chín sáp"],
      answer: 0,
    },
    {
      question:
        "Loại phân bón nào quan trọng nhất cho sự phát triển của cây lúa?",
      options: [
        "Phân Lân (P)",
        "Phân Kali (K)",
        "Phân Đạm (N)",
        "Phân vi lượng",
      ],
      answer: 2,
    },
    {
      question: "Sâu đục thân gây hại cho cây lúa ở giai đoạn nào?",
      options: [
        "Chỉ giai đoạn mạ",
        "Chỉ giai đoạn trổ bông",
        "Mọi giai đoạn",
        "Chỉ giai đoạn chín",
      ],
      answer: 2,
    },
    {
      question: "Bệnh đạo ôn trên lúa thường do tác nhân nào gây ra?",
      options: ["Vi khuẩn", "Virus", "Nấm", "Côn trùng"],
      answer: 2,
    },
    {
      question: "Mật độ sạ lúa thích hợp là bao nhiêu?",
      options: [
        "20-40 kg/ha",
        "80-120 kg/ha",
        "200-250 kg/ha",
        "Trên 300 kg/ha",
      ],
      answer: 1,
    },
    {
      question: "Biện pháp '3 giảm 3 tăng' trong canh tác lúa là gì?",
      options: [
        "Giảm đạm, sâu bệnh, thất thoát; Tăng năng suất, chất lượng, hiệu quả",
        "Giảm nước, phân, thuốc; Tăng giống, công, vốn",
        "Giảm giống, thuốc trừ sâu, phân đạm; Tăng năng suất, chất lượng, lợi nhuận",
        "Giảm chi phí, thời gian, công sức; Tăng thu nhập, an toàn, bền vững",
      ],
      answer: 2,
    },
    {
      question: "Thời điểm thu hoạch lúa tốt nhất là khi nào?",
      options: [
        "Khi lúa còn xanh",
        "Khi 85-90% số hạt trên bông đã chín vàng",
        "Khi 100% hạt đã chín vàng",
        "Bất kỳ lúc nào sau khi trổ bông",
      ],
      answer: 1,
    },
    {
      question: "Phương pháp tưới 'ngập khô xen kẽ' giúp gì?",
      options: [
        "Tăng sâu bệnh",
        "Lãng phí nước",
        "Giảm phát thải khí nhà kính và tiết kiệm nước",
        "Làm đất chai cứng",
      ],
      answer: 2,
    },
    {
      question: "Cây lúa thuộc họ thực vật nào?",
      options: ["Họ Cà", "Họ Đậu", "Họ Hòa thảo (Cỏ)", "Họ Bầu bí"],
      answer: 2,
    },
    {
      question: "Rầy nâu hại lúa bằng cách nào?",
      options: [
        "Ăn lá",
        "Cắn rễ",
        "Chích hút nhựa cây và truyền bệnh virus",
        "Đục vào thân cây",
      ],
      answer: 2,
    },
    {
      question: "Làm đất kỹ trước khi gieo sạ có tác dụng gì?",
      options: [
        "Tăng cỏ dại",
        "Tạo điều kiện cho rễ phát triển, diệt mầm bệnh",
        "Làm đất mất dinh dưỡng",
        "Không có tác dụng gì",
      ],
      answer: 1,
    },
    {
      question: "Phân chuồng hoai mục tốt cho đất vì:",
      options: [
        "Cung cấp nhiều đạm tức thì",
        "Làm chua đất",
        "Cải tạo đất, tăng độ phì nhiêu, cung cấp vi sinh vật có lợi",
        "Không có lợi ích",
      ],
      answer: 2,
    },
    {
      question: "Bón vôi cho đất trồng lúa nhằm mục đích gì?",
      options: [
        "Tăng độ phì nhiêu",
        "Cung cấp dinh dưỡng",
        "Khử chua, hạ phèn cho đất",
        "Diệt côn trùng",
      ],
      answer: 2,
    },
    {
      question: "Giống lúa kháng sâu bệnh có nghĩa là gì?",
      options: [
        "Không bao giờ bị sâu bệnh",
        "Có khả năng chống chịu sâu bệnh tốt hơn giống thường",
        "Chỉ cần bón ít phân hơn",
        "Năng suất luôn cao hơn",
      ],
      answer: 1,
    },
    {
      question: "Giai đoạn 'ngậm sữa' của cây lúa là giai đoạn nào?",
      options: [
        "Trước khi trổ bông",
        "Sau khi thụ phấn, hạt lúa bắt đầu tích lũy tinh bột dạng lỏng",
        "Khi hạt lúa cứng lại",
        "Lúc cây đẻ nhánh",
      ],
      answer: 1,
    },
    {
      question: "Tại sao cần phải quản lý cỏ dại trên ruộng lúa?",
      options: [
        "Để ruộng đẹp hơn",
        "Cỏ dại không ảnh hưởng gì",
        "Cỏ dại cạnh tranh dinh dưỡng, ánh sáng, nước với cây lúa",
        "Cỏ dại giúp giữ ẩm cho đất",
      ],
      answer: 2,
    },
    {
      question:
        "Nhiệt độ thích hợp cho sự sinh trưởng của cây lúa là khoảng bao nhiêu?",
      options: ["Dưới 15°C", "15-20°C", "25-32°C", "Trên 40°C"],
      answer: 2,
    },
    {
      question: "Bón phân không cân đối (thừa đạm) sẽ dẫn đến hậu quả gì?",
      options: [
        "Cây lúa cứng cáp, ít sâu bệnh",
        "Lúa chín sớm hơn",
        "Cây lúa yếu, dễ đổ ngã và dễ bị sâu bệnh tấn công",
        "Không ảnh hưởng gì",
      ],
      answer: 2,
    },
    {
      question: "Thuật ngữ 'lúa chét' có nghĩa là gì?",
      options: [
        "Một giống lúa mới",
        "Lúa mọc từ gốc rạ của vụ trước",
        "Lúa bị bệnh",
        "Lúa trồng trên cạn",
      ],
      answer: 1,
    },
    {
      question: "Mục đích của việc phơi thóc sau khi thu hoạch là gì?",
      options: [
        "Để thóc có màu đẹp hơn",
        "Giảm độ ẩm của hạt để dễ bảo quản, tránh nấm mốc",
        "Làm tăng trọng lượng",
        "Không cần thiết",
      ],
      answer: 1,
    },
  ];

  // === STATE VARIABLES ===
  let currentUser = null;
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let timer;
  let timeRemaining = 15 * 60; // 15 minutes in seconds

  // === FUNCTIONS ===
  const initQuiz = () => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      currentUser = JSON.parse(userData);
      showScreen("start-screen");
    } else {
      // If user is not logged in, redirect them
      alert("Vui lòng đăng nhập để làm bài kiểm tra.");
      window.location.href = "login.html";
      return;
    }

    startBtn.addEventListener("click", startQuiz);
    submitBtn.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn nộp bài?")) {
        endQuiz();
      }
    });
    reviewBtn.addEventListener("click", () => {
      reviewContainer.style.display = "block";
      reviewBtn.style.display = "none";
    });
  };

  const showScreen = (screenId) => {
    document
      .querySelectorAll(".quiz-screen")
      .forEach((screen) => screen.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
  };

  const startQuiz = () => {
    currentQuestionIndex = 0;
    userAnswers = Array(questions.length).fill(null);
    timeRemaining = 15 * 60;
    showScreen("quiz-screen");
    renderQuestion();
    startTimer();
  };

  const startTimer = () => {
    updateTimerDisplay();
    timer = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timer);
        alert("Hết giờ làm bài!");
        endQuiz();
      }
    }, 1000);
  };

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeLeftEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    if (timeRemaining < 60) {
      timeLeftEl.parentElement.classList.add("warning");
    } else {
      timeLeftEl.parentElement.classList.remove("warning");
    }
  };

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    currentQuesNumEl.textContent = currentQuestionIndex + 1;
    progressBar.style.width = `${
      ((currentQuestionIndex + 1) / questions.length) * 100
    }%`;

    let optionsHTML = question.options
      .map(
        (option, index) =>
          `<li class="option" data-index="${index}">${option}</li>`
      )
      .join("");

    questionContainer.innerHTML = `
            <p class="question-text">${currentQuestionIndex + 1}. ${
      question.question
    }</p>
            <ul class="options-list">${optionsHTML}</ul>
        `;

    document.querySelectorAll(".option").forEach((optionEl) => {
      optionEl.addEventListener("click", (e) => {
        const selectedIndex = parseInt(e.currentTarget.dataset.index);
        userAnswers[currentQuestionIndex] = selectedIndex;

        // Move to next question automatically
        if (currentQuestionIndex < questions.length - 1) {
          currentQuestionIndex++;
          renderQuestion();
        } else {
          renderQuestion(); // Re-render to show selection on last question
          document
            .querySelectorAll(".option")
            .forEach((opt) => opt.classList.remove("selected"));
          e.currentTarget.classList.add("selected");
        }
      });
    });

    // Highlight selected answer on re-render
    if (userAnswers[currentQuestionIndex] !== null) {
      const selectedOption = questionContainer.querySelector(
        `.option[data-index='${userAnswers[currentQuestionIndex]}']`
      );
      if (selectedOption) {
        selectedOption.classList.add("selected");
      }
    }
  };

  const endQuiz = async () => {
    clearInterval(timer);
    let score = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === questions[index].answer) {
        score++;
      }
    });

    scoreTextEl.textContent = `${score} / ${questions.length}`;

    if (score >= 15) {
      resultMessageEl.textContent =
        "Xuất sắc! Bạn có kiến thức rất tốt về trồng lúa.";
    } else if (score >= 10) {
      resultMessageEl.textContent =
        "Khá tốt! Hãy tiếp tục học hỏi để cải thiện nhé.";
    } else {
      resultMessageEl.textContent =
        "Cần cố gắng hơn. Hãy xem lại bài làm để củng cố kiến thức nhé!";
    }

    renderReview();
    showScreen("results-screen");

    try {
      loadingOverlay.style.display = "flex";
      await saveResultToDB(score);
    } catch (error) {
      console.error("Failed to save score:", error);
      alert("Không thể lưu kết quả. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      loadingOverlay.style.display = "none";
    }
  };

  const renderReview = () => {
    let reviewHTML = "<h2>Xem lại bài làm</h2>";
    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.answer;

      const optionsHTML = q.options
        .map((opt, optIndex) => {
          let className = "option";
          if (optIndex === q.answer) {
            className += " correct"; // Always highlight correct answer
          }
          if (userAnswer !== null && optIndex === userAnswer && !isCorrect) {
            className += " incorrect"; // Highlight user's wrong answer
          }
          return `<li class="${className}">${opt}</li>`;
        })
        .join("");

      reviewHTML += `
                <div class="question-card">
                    <p class="question-text">${index + 1}. ${q.question}</p>
                    <ul class="options-list review-options">${optionsHTML}</ul>
                </div>
            `;
    });
    reviewContainer.innerHTML = reviewHTML;
  };

  const saveResultToDB = async (score) => {
    if (!currentUser) return;

    const response = await fetch("/api/save-quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        quizId: QUIZ_ID,
        score: score,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save score");
    }

    return await response.json();
  };

  // === INITIALIZATION ===
  initQuiz();
});
