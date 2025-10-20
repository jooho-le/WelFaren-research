const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Config
const COUNT_OFFSET = 532; // display starts from 532

// Supabase setup (optional: used on static deploy)
let sb = null;
try {
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
} catch (_) { /* ignore */ }

// Attach subscribe behavior to one or more forms
const subscribeForms = Array.from(document.querySelectorAll('form[data-subscribe-form], #subscribe-form'));

function setStatus(el, msg, ok) {
  if (!el) return;
  el.textContent = msg || '';
  el.classList.remove('success', 'error');
  el.classList.add(ok ? 'success' : 'error');
}

for (const form of subscribeForms) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = form.querySelector('input[name="email"]') || document.getElementById('email');
    const statusEl = form.closest('.card')?.querySelector('[data-status]') || document.getElementById('status');
    const btn = form.querySelector('button');
    const email = (emailEl?.value || '').trim();
    setStatus(statusEl, '', true);
    if (!email) {
      setStatus(statusEl, '유효한 이메일을 입력해주세요.', false);
      return;
    }
    btn && (btn.disabled = true);
    try {
      if (sb) {
        // Insert directly to Supabase
        const { error } = await sb.from('subscribers').insert({
          email,
          user_agent: navigator.userAgent || '',
        });
        if (error) throw error;
        setStatus(statusEl, '등록이 완료되었습니다. 감사합니다!', true);
        form.reset();
        await updateCount();
      } else {
        // Fallback to Flask backend
        const res = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || '오류가 발생했습니다.');
        setStatus(statusEl, data.message || '등록되었습니다.', true);
        form.reset();
      }
    } catch (err) {
      setStatus(statusEl, (err && err.message) || '유효한 이메일을 입력해주세요.', false);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// Count updater using Supabase if available
async function updateCount() {
  if (!sb) return; // backend-rendered value will be shown instead
  try {
    const { count, error } = await sb.from('subscribers').select('*', { count: 'exact', head: true });
    if (error) throw error;
    const display = (count || 0) + COUNT_OFFSET;
    document.querySelectorAll('[data-subscriber-count]').forEach((el) => {
      el.textContent = String(display);
    });
  } catch (_) { /* ignore */ }
}

// Run once on load
updateCount();

const sliderEl = document.querySelector('.slider');
if (sliderEl) {
  const slides = Array.from(sliderEl.querySelectorAll('.slide'));
  const dotsHost = sliderEl.querySelector('.slider-dots');
  if (slides.length > 0 && dotsHost) {
    let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (activeIndex < 0) activeIndex = 0;
    const dots = slides.map((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${idx + 1}번 슬라이드 보기`);
      dot.addEventListener('click', () => goToSlide(idx));
      dotsHost.appendChild(dot);
      return dot;
    });

    let timerId = null;
    const autoplayDelay = Number(sliderEl.dataset.autoplay) || 6000;

    function setActive(index) {
      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === index);
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
      sliderEl.setAttribute('data-active-index', index);
    }

    function goToSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      setActive(activeIndex);
      restartAutoplay();
    }

    function nextSlide() {
      goToSlide(activeIndex + 1);
    }

    function restartAutoplay() {
      if (!autoplayDelay) return;
      clearInterval(timerId);
      timerId = setInterval(nextSlide, autoplayDelay);
    }

    sliderEl.addEventListener('pointerenter', () => clearInterval(timerId));
    sliderEl.addEventListener('pointerleave', restartAutoplay);
    sliderEl.addEventListener('focusin', () => clearInterval(timerId));
    sliderEl.addEventListener('focusout', restartAutoplay);

    setActive(activeIndex);
    restartAutoplay();
  }
}
