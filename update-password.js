import { supabase } from './logic/supabaseClient.js';

document.getElementById('update-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('new-password').value;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    document.getElementById('error-update').innerText = error.message;
  } else {
    document.getElementById('success-update').innerText = 'Đổi mật khẩu thành công!';
  }
});
