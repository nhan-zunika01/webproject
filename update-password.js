// File: logic/update-password.js
// Gửi mật khẩu mới tới API update-password trên Cloudflare Functions

document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('new-password').value.trim();
  const messageEl = document.getElementById('update-message');

  if (!newPassword) {
    messageEl.innerText = 'Vui lòng nhập mật khẩu mới.';
    messageEl.style.color = 'red';
    return;
  }

  try {
    const res = await fetch('/api/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Đổi mật khẩu thất bại');

    messageEl.innerText = 'Đổi mật khẩu thành công!';
    messageEl.style.color = 'green';
  } catch (error) {
    messageEl.innerText = `Lỗi: ${error.message}`;
    messageEl.style.color = 'red';
  }
});
