// File: logic/update-password.js
// Handles the password update form submission.

document.addEventListener('DOMContentLoaded', () => {
  const updatePasswordForm = document.getElementById('update-password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const successMessage = document.getElementById('success-update');
  const errorMessage = document.getElementById('error-update');
  const updateBtn = document.getElementById('update-btn');

  // Function to get URL parameters
  const getUrlParameter = (name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  const token = getUrlParameter('token');

  updatePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    successMessage.textContent = '';
    errorMessage.textContent = '';
    updateBtn.disabled = true;

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 6) {
      errorMessage.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
      updateBtn.disabled = false;
      return;
    }

    if (newPassword !== confirmPassword) {
      errorMessage.textContent = 'Mật khẩu xác nhận không khớp.';
      updateBtn.disabled = false;
      return;
    }

    try {
      const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }

      successMessage.textContent = 'Cập nhật mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.';
      updatePasswordForm.reset();

    } catch (error) {
      errorMessage.textContent = error.message;
    } finally {
      updateBtn.disabled = false;
    }
  });
});
