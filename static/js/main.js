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
