// File: data/courses-data.js
// Đây là nơi bạn sẽ quản lý nội dung của tất cả các khóa học.
// Khi muốn thêm khóa học mới, bạn chỉ cần thêm một đối tượng vào danh sách `allCourses` này.

const allCourses = {
  // === KHÓA HỌC LÚA ===
  "rice-course-v1": {
    title: "Kỹ thuật trồng lúa hiệu quả",
    meta: {
      expert: "GS.TS. Bùi Chí Bửu",
      field: "Trồng trọt",
      duration: "5 giờ",
    },
    image:
      "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1974&auto=format&fit=crop",
    imageAlt: "Cánh đồng lúa xanh mướt",
    sapo: "Khóa học này cung cấp kiến thức toàn diện từ cơ bản đến nâng cao về kỹ thuật canh tác lúa, giúp bà con nông dân tối ưu hóa năng suất, giảm chi phí và canh tác bền vững theo các tiêu chuẩn hiện đại.",
    quizUrl: "quiz.html", // Đường dẫn đến bài kiểm tra tương ứng
    chapters: [
      {
        title: "Chuẩn bị đất và chọn giống",
        lessons: [
          {
            id: "rice-c0l0",
            title: "Phân tích và cải tạo đất",
            content:
              "<h3>Tại sao cần phân tích đất?</h3><p>Phân tích đất giúp xác định độ pH, hàm lượng hữu cơ, và các chất dinh dưỡng đa, trung, vi lượng. Từ đó, ta có thể đưa ra biện pháp cải tạo phù hợp, tránh bón phân thừa hoặc thiếu.</p><h3>Các bước cải tạo đất cơ bản:</h3><ul><li>Đối với đất phèn: Bón vôi để nâng pH, kết hợp rửa phèn bằng nước ngọt.</li><li>Đối với đất mặn: Xây dựng hệ thống kênh mương để rửa mặn, trồng các giống cây chịu mặn.</li><li>Đối với đất bạc màu: Tăng cường bón phân hữu cơ, phân chuồng ủ hoai để bổ sung mùn và vi sinh vật.</li></ul>",
          },
          {
            id: "rice-c0l1",
            title: "Phương pháp làm đất hiện đại",
            content:
              "<h3>Làm đất tối thiểu:</h3><p>Phương pháp này hạn chế xới lật đất, chỉ làm đất trên hàng gieo trồng. Giúp giữ cấu trúc đất, chống xói mòn và giữ ẩm.</p><h3>San phẳng mặt ruộng bằng laser:</h3><p>Sử dụng công nghệ laser giúp mặt ruộng bằng phẳng tuyệt đối. Lợi ích: tiết kiệm nước tưới, lúa sinh trưởng đồng đều, giảm cỏ dại, dễ dàng cơ giới hóa.</p>",
          },
          {
            id: "rice-c0l2",
            title: "Lựa chọn giống lúa",
            content:
              "<h3>Tiêu chí chọn giống:</h3><ul><li>Phù hợp với điều kiện khí hậu, thổ nhưỡng của địa phương.</li><li>Khả năng chống chịu sâu bệnh tốt.</li><li>Thời gian sinh trưởng phù hợp với khung thời vụ.</li><li>Năng suất cao, chất lượng gạo tốt, đáp ứng thị hiệu thị trường.</li></ul><p>Ví dụ: Vùng Đồng bằng sông Cửu Long thường chuộng các giống như OM5451, Đài Thơm 8...</p>",
          },
        ],
      },
      {
        title: "Kỹ thuật gieo sạ và cấy",
        lessons: [
          {
            id: "rice-c1l0",
            title: "Ngâm ủ và xử lý hạt giống",
            content:
              "<h3>Mục đích:</h3><p>Giúp hạt giống nảy mầm đều và khỏe, loại bỏ mầm bệnh tồn tại trên vỏ hạt.</p><h3>Các bước thực hiện:</h3><ul><li>Phơi lại hạt giống dưới nắng nhẹ 2-3 giờ.</li><li>Ngâm hạt trong nước sạch 24-36 giờ.</li><li>Vớt ra, rửa sạch và ủ trong bao tải hoặc thúng có lót rơm, giữ ẩm. Sau 24-36 giờ ủ, rễ và mầm sẽ nhú ra đều.</li></ul>",
          },
          {
            id: "rice-c1l1",
            title: "Kỹ thuật gieo sạ tiên tiến",
            content: "Nội dung đang được cập nhật...",
          },
        ],
      },
    ],
  },
  // === KHÓA HỌC GÀ ===
  "chicken-course-v1": {
    title: "Chăn nuôi gà an toàn sinh học",
    meta: {
      expert: "PGS.TS. Nguyễn Thị Minh",
      field: "Chăn nuôi",
      duration: "6 giờ",
    },
    image:
      "https://images.unsplash.com/photo-1587303213013-106c4a86a644?q=80&w=1974&auto=format&fit=crop",
    imageAlt: "Đàn gà khỏe mạnh trong trang trại",
    sapo: "Trang bị kiến thức và kỹ năng thực hành chăn nuôi gà theo hướng an toàn sinh học, giúp phòng chống dịch bệnh hiệu quả, nâng cao chất lượng sản phẩm và tối đa hóa lợi nhuận.",
    quizUrl: null, // Chưa có bài kiểm tra cho khóa này
    chapters: [
      {
        title: "Thiết kế và xây dựng chuồng trại",
        lessons: [
          {
            id: "chicken-c0l0",
            title: "Lựa chọn địa điểm và hướng chuồng",
            content:
              "<h3>Địa điểm lý tưởng:</h3><p>Cần chọn nơi cao ráo, thoát nước tốt, xa khu dân cư và nguồn ô nhiễm. Lý tưởng nhất là có cây xanh che mát xung quanh.</p><h3>Hướng chuồng:</h3><p>Nên chọn hướng Nam hoặc Đông Nam để đón gió mát vào mùa hè và tránh gió lạnh vào mùa đông, đồng thời nhận được ánh sáng mặt trời vừa đủ.</p>",
          },
          {
            id: "chicken-c0l1",
            title: "Vật liệu và kết cấu chuồng trại",
            content: "Nội dung đang được cập nhật...",
          },
        ],
      },
      {
        title: "Chọn giống và kỹ thuật úm gà con",
        lessons: [
          {
            id: "chicken-c1l0",
            title: "Đặc điểm các giống gà phổ biến",
            content: "Nội dung đang được cập nhật...",
          },
        ],
      },
    ],
  },
  // === THÊM KHÓA HỌC MỚI TẠI ĐÂY ===
  // 'new-course-id': { ... }
};
