// File: logic/reset-password.js

// Hàm hiển thị thông báo
function setMessage(fieldId, message, isError = true) {
    const element = document.getElementById(fieldId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block'; // Đảm bảo hiện lên nếu đang bị ẩn
        
        // Reset nội dung thông báo đối lập
        const otherId = isError ? 'success-forgot-password' : 'error-forgot-password';
        const otherElement = document.getElementById(otherId);
        if (otherElement) otherElement.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('forgot-email');
            const submitBtn = document.getElementById('forgot-btn');
            const email = emailInput.value.trim();

            // Lấy token Turnstile từ form data
            const formData = new FormData(form);
            const turnstileToken = formData.get('cf-turnstile-response');

            // Reset thông báo cũ
            setMessage('error-forgot-password', '', true);
            setMessage('success-forgot-password', '', false);

            if (!email) {
                setMessage('error-forgot-password', 'Vui lòng nhập địa chỉ email.');
                return;
            }

            if (!turnstileToken) {
                setMessage('error-forgot-password', 'Vui lòng hoàn thành xác thực bảo mật (CAPTCHA).');
                return;
            }

            // Bắt đầu gửi
            submitBtn.disabled = true;
            submitBtn.innerText = 'Đang gửi...';

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, turnstileToken }),
                });

                const result = await response.json();

                if (response.ok) {
                    setMessage(
                        'success-forgot-password', 
                        'Nếu email tồn tại, một liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư (cả mục Spam).', 
                        false
                    );
                    emailInput.value = ''; // Xóa ô nhập
                    // Reset widget Turnstile nếu có
                    if (typeof turnstile !== 'undefined') turnstile.reset();
                } else {
                    setMessage('error-forgot-password', result.message || 'Đã có lỗi xảy ra.');
                    if (typeof turnstile !== 'undefined') turnstile.reset();
                }
            } catch (error) {
                console.error('Password reset error:', error);
                setMessage('error-forgot-password', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Gửi liên kết';
            }
        });
    }
});