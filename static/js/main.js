const form = document.getElementById('subscribe-form');
const statusEl = document.getElementById('status');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function setStatus(msg, ok) {
  statusEl.textContent = msg || '';
  statusEl.classList.remove('success', 'error');
  statusEl.classList.add(ok ? 'success' : 'error');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailEl = document.getElementById('email');
  const btn = form.querySelector('button');
  const email = emailEl.value.trim();
  setStatus('', true);
  btn.disabled = true;
  try {
    const res = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || '오류가 발생했습니다.');
    setStatus(data.message || '등록되었습니다.', true);
    form.reset();
  } catch (err) {
    setStatus(err.message || '유효한 이메일을 입력해주세요.', false);
  } finally {
    btn.disabled = false;
  }
});

