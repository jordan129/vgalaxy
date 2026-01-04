(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    food: { idx: 0, pages: [] },
    drinks: { idx: 0, pages: [] },
  };

  const fs = {
    open: false,
    target: null,
    scale: 1, // 缩放倍数
  };

  const lightbox = $("#sm-lightbox");
  const fsImg = $("#sm-lightbox-img");
  const fsPrev = $("#sm-fs-prev");
  const fsNext = $("#sm-fs-next");
  const fsIndicator = $("#sm-fs-indicator");

  function parsePages(imgEl) {
    try {
      return JSON.parse(imgEl.getAttribute("data-pages") || "[]");
    } catch (e) { return []; }
  }

  // 重置缩放状态
  function resetZoom() {
    fs.scale = 1;
    if (fsImg) fsImg.style.transform = `scale(1)`;
  }

  function setViewer(target, idx) {
    const imgEl = $(`.sm-viewer-img[data-target="${target}"]`);
    if (!imgEl) return;

    const pages = state[target].pages;
    if (!pages.length) return;

    const clamped = (idx + pages.length) % pages.length;
    state[target].idx = clamped;

    // 切换图片主视图
    imgEl.src = pages[clamped];
    
    // 同步缩略图
    const wrap = $(`.sm-thumbs[data-target="${target}"]`);
    if (wrap) {
      $$(".sm-thumb", wrap).forEach((b) => b.classList.remove("is-active"));
      const btn = $(`.sm-thumb[data-index="${clamped}"]`, wrap);
      if (btn) btn.classList.add("is-active");
    }

    // 如果全屏模式开启，同步全屏图片并重置缩放
    if (fs.open && fs.target === target) {
      fsImg.src = pages[clamped];
      setFsIndicator(target);
      resetZoom(); // 切换页面时重置缩放
    }
  }

  function setFsIndicator(target) {
    const pages = state[target].pages;
    const idx = state[target].idx;
    if (fsIndicator) {
      fsIndicator.textContent = pages.length ? `page ${idx + 1} / ${pages.length}` : "";
    }
  }

  function openFullscreen(target) {
    if (!lightbox || !fsImg) return;
    fs.open = true;
    fs.target = target;
    resetZoom(); // 打开时确保缩放是1

    document.body.classList.add("sm-fs-open");
    lightbox.classList.add("is-open");

    const pages = state[target].pages;
    fsImg.src = pages[state[target].idx] || "";
    setFsIndicator(target);
  }

  function closeFullscreen() {
    fs.open = false;
    fs.target = null;
    document.body.classList.remove("sm-fs-open");
    lightbox.classList.remove("is-open");
    resetZoom();
  }

  function step(target, delta) {
    setViewer(target, state[target].idx + delta);
  }

  function bindTarget(target) {
    const imgEl = $(`.sm-viewer-img[data-target="${target}"]`);
    if (!imgEl) return;

    state[target].pages = parsePages(imgEl);
    
    $$(`.sm-arrow[data-target="${target}"]`).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        step(target, btn.classList.contains("sm-menu-arrow-left") ? -1 : 1);
      });
    });

    const thumbs = $(`.sm-thumbs[data-target="${target}"]`);
    if (thumbs) {
      $$(".sm-thumb", thumbs).forEach((b) => {
        b.addEventListener("click", () => {
          setViewer(target, Number(b.getAttribute("data-index") || "0"));
        });
      });
    }

    imgEl.addEventListener("click", () => openFullscreen(target));
  }

  bindTarget("food");
  bindTarget("drinks");

  // 全屏翻页按钮
  if (fsPrev) fsPrev.addEventListener("click", (e) => { e.stopPropagation(); if (fs.target) step(fs.target, -1); });
  if (fsNext) fsNext.addEventListener("click", (e) => { e.stopPropagation(); if (fs.target) step(fs.target, 1); });

  // 滚轮缩放逻辑
  if (lightbox) {
    lightbox.addEventListener("wheel", (e) => {
      if (!fs.open) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.15 : 0.15; // 缩放增量
      let newScale = fs.scale + delta;

      // 限制缩放范围：最小 0.8 倍，最大 4 倍
      newScale = Math.min(Math.max(0.8, newScale), 4);
      
      fs.scale = newScale;
      fsImg.style.transform = `scale(${fs.scale})`;
    }, { passive: false });

    // 点击背景关闭灯箱（点击图片本身不关闭，方便用户点击图片缩放）
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeFullscreen();
    });
  }

  // 键盘支持
  window.addEventListener("keydown", (e) => {
    if (!fs.open) return;
    if (e.key === "Escape") closeFullscreen();
    if (e.key === "ArrowLeft") step(fs.target, -1);
    if (e.key === "ArrowRight") step(fs.target, 1);
  });
})();