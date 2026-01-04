document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("sm-slider");
  if (!slider) return;

  const slidesWrap = slider.querySelector(".sm-slides");
  const slides = Array.from(slidesWrap.children);
  const dotsWrap = slider.querySelector(".sm-dots");
  const prevBtn = slider.querySelector(".sm-slider-arrow-left");
  const nextBtn = slider.querySelector(".sm-slider-arrow-right");

  const interval = parseInt(slider.dataset.interval || "4000", 10);
  let index = 0;
  let timer = null;

  /* ----- dots ----- */
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "sm-dot";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  function update() {
    slidesWrap.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
    restart();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function start() {
    // Only start the interval if it's not already running
    if (timer === null) {
      timer = setInterval(next, interval);
    }
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    start();
  }

  /* ----- arrow buttons ----- */
  nextBtn && nextBtn.addEventListener("click", next);
  prevBtn && prevBtn.addEventListener("click", prev);

  /* ----- hover pause (desktop) ----- */
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  /* ----- swipe (mobile) ----- */
  let x0 = null;
  let y0 = null;
  let moved = false;

  // threshold: keep it fairly firm to avoid accidental swipes
  const SWIPE_MIN = 45;     // px
  const SWIPE_MAX_Y = 60;   // px (if user scrolls vertically, ignore)

  slider.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const t = e.touches[0];
    x0 = t.clientX;
    y0 = t.clientY;
    moved = false;
    stop(); // pause while touching
  }, { passive: true });

  slider.addEventListener("touchmove", (e) => {
    if (x0 == null || y0 == null) return;
    const t = e.touches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;

    // if the gesture is mainly horizontal and significant, mark moved
    if (Math.abs(dx) > 10 && Math.abs(dy) < SWIPE_MAX_Y) {
      moved = true;
    }
  }, { passive: true });

  slider.addEventListener("touchend", (e) => {
    if (x0 == null || y0 == null) {
      start();
      return;
    }

    const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (!t) {
      x0 = y0 = null;
      start();
      return;
    }

    const dx = t.clientX - x0;
    const dy = t.clientY - y0;

    // reset
    x0 = y0 = null;

    // ignore if it looks like vertical scroll
    if (Math.abs(dy) > SWIPE_MAX_Y) {
      start();
      return;
    }

    // require a real horizontal swipe
    if (Math.abs(dx) >= SWIPE_MIN && moved) {
      if (dx > 0) prev();
      else next();
      // prev()/next() already restarts timer via goTo()
      return;
    }

    start();
  }, { passive: true });

  /* init */
  update();
  start();
});
