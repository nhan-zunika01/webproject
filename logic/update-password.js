// File: update-password.js

// Hàm lấy tham số từ URL Hash (do Supabase trả về token trong hash #)
function getHashParams() {
    return window.location.hash.substring(1).split('&').reduce(function(result, item) {
        if (item) {
            var parts = item.split('=');
            result[parts[0]] = decodeURIComponent(parts[1]);
        }
        return result;
    }, {});
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('update-password-form');
    
    // Kiểm tra xem có token trong URL không
    const hashParams = getHashParams();
    let accessToken = hashParams.access_token;
    
    // Nếu không có trong hash, thử lấy từ localStorage (trường hợp người dùng đang đăng nhập và muốn đổi pass)
    if (!accessToken) {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const userObj = JSON.parse(currentUser);
                accessToken = userObj.access_token;
            } catch (e) {
                console.error("Lỗi parse user:", e);
            }
        }
    }

    if (!accessToken) {
        const errorEl = document.getElementById('error-update');
        if (errorEl) errorEl.innerText = 'Không tìm thấy mã xác thực. Vui lòng yêu cầu lại liên kết đổi mật khẩu.';
        // Ẩn nút submit nếu không có token
        const btn = document.getElementById('update-btn');
        if (btn) btn.disabled = true;
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('new-password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();
            const messageEl = document.getElementById('success-update');
            const errorEl = document.getElementById('error-update');
            const submitBtn = document.getElementById('update-btn');

            // Reset thông báo
            messageEl.innerText = '';
            errorEl.innerText = '';

            // 1. Validate cơ bản
            if (!newPassword || newPassword.length < 8) {
                errorEl.innerText = 'Mật khẩu phải có ít nhất 8 ký tự.';
                return;
            }

            if (newPassword !== confirmPassword) {
                errorEl.innerText = 'Mật khẩu xác nhận không khớp.';
                return;
            }

            // 2. Lấy token Turnstile
            const formData = new FormData(form);
            const turnstileToken = formData.get('cf-turnstile-response');

            if (!turnstileToken) {
                errorEl.innerText = 'Vui lòng hoàn thành xác thực bảo mật (CAPTCHA).';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Đang xử lý...';

            try {
                // 3. Gửi yêu cầu lên API
                const res = await fetch('/api/update-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        access_token: accessToken, // Gửi token xác thực người dùng
                        password: newPassword,
                        turnstileToken: turnstileToken // Gửi token captcha
                    })
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message || 'Đổi mật khẩu thất bại');
                }

                // 4. Thành công & Chuyển hướng
                messageEl.innerText = 'Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...';
                
                // Xóa thông tin đăng nhập cũ nếu có để người dùng đăng nhập lại
                localStorage.removeItem('currentUser');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000); // Chuyển hướng sau 3 giây

            } catch (error) {
                console.error("Update password error:", error);
                errorEl.innerText = error.message;
                if (typeof turnstile !== 'undefined') turnstile.reset(); // Reset captcha nếu lỗi
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Cập nhật mật khẩu';
            }
        });
    }
});