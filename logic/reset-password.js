import { supabase } from './supabaseClient.js';

document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const messageEl = document.getElementById('message');

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    messageEl.innerText = 'Vui lòng kiểm tra email để đặt lại mật khẩu.';
    messageEl.style.color = 'green';
  } catch (error) {
    messageEl.innerText = `Lỗi: ${error.message}`;
    messageEl.style.color = 'red';
  }
});
