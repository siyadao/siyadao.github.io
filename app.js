// 展示内容直接写在 HTML 中，JavaScript 增强主题、渐进浏览与原生控件。
(() => {
  const themeToggle = document.querySelector(".theme-toggle");
  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    const next = theme === "dark" ? "浅色" : "深色";
    themeToggle.setAttribute("aria-label", `切换到${next}主题`);
    themeToggle.title = `切换到${next}主题`;
    document.querySelector('meta[name="color-scheme"]').content = theme;
    for (const image of document.querySelectorAll("img[data-dark-src]")) {
      image.src = theme === "dark" ? image.dataset.darkSrc : image.dataset.lightSrc;
    }
    for (const link of document.querySelectorAll("a[data-dark-href]")) {
      link.href = theme === "dark" ? link.dataset.darkHref : link.dataset.lightHref;
    }
  }
  applyTheme(document.documentElement.dataset.theme);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let themePending = false;
  async function prepareImages(urls) {
    // 只准备即将展示的截图；慢网最多等待 250ms，不阻塞其他入口。
    const images = [...new Set(urls)].map((url) => {
      const image = new Image();
      image.src = url;
      return image;
    });
    let timeout;
    await Promise.race([
      Promise.allSettled(images.map((image) => image.decode())),
      new Promise((resolve) => { timeout = setTimeout(resolve, 250); }),
    ]);
    clearTimeout(timeout);
  }
  let themeFade;
  themeToggle.addEventListener("click", () => {
    if (themePending) return;
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    const update = () => {
      applyTheme(theme);
      try {
        localStorage.setItem("siyadao.website.theme", theme);
      } catch {
        // 无存储权限时只保留本页选择。
      }
    };
    if (reducedMotion.matches) {
      update();
      return;
    }
    themePending = true;
    themeToggle.disabled = true;
    const urls = [...document.querySelectorAll("img[data-dark-src]")].filter((image) => {
      const bounds = image.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
    }).map((image) => theme === "dark" ? image.dataset.darkSrc : image.dataset.lightSrc);
    void prepareImages(urls).then(() => {
      themePending = false;
      themeToggle.disabled = false;
      themeFade?.cancel();
      document.documentElement.classList.add("theme-fading");
      update();
      if (reducedMotion.matches) {
        document.documentElement.classList.remove("theme-fading");
        return;
      }
      themeFade = document.body.animate([{ opacity: 0.72 }, { opacity: 1 }], {
        duration: 300,
        easing: "ease-out",
      });
      const fade = themeFade;
      const finish = () => {
        if (themeFade !== fade) return;
        document.documentElement.classList.remove("theme-fading");
        themeFade = undefined;
      };
      fade.finished.then(finish, finish);
    });
  });

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("reveal-ready");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -32px 0px", threshold: 0.05 });
    for (const element of document.querySelectorAll("[data-reveal]")) {
      element.classList.add("reveal-pending");
      observer.observe(element);
    }
  }

  let sceneAnimations = [];
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  const sceneStage = document.createElement("div");
  sceneStage.className = "scene-stage";
  panels[0].before(sceneStage);
  sceneStage.append(...panels);
  let sceneIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
  let displayedScene = panels[sceneIndex];
  let leavingScene;
  let sceneRequest = 0;
  const previousScene = document.getElementById("scene-previous");
  const nextScene = document.getElementById("scene-next");
  const sceneCount = document.getElementById("scene-count");
  previousScene.addEventListener("click", () => selectAdjacentScene(-1));
  nextScene.addEventListener("click", () => selectAdjacentScene(1));
  updateSceneNavigation();
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      const visible = tabs.filter((item) => !item.hidden);
      const position = visible.indexOf(tab);
      const next = {
        ArrowRight: (position + 1) % visible.length,
        ArrowLeft: (position + visible.length - 1) % visible.length,
        Home: 0,
        End: visible.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs.indexOf(visible[next]));
      visible[next].focus({ preventScroll: true });
      visible[next].scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
  const groups = [...document.querySelectorAll("[data-scene-group]")];
  for (const group of groups) {
    group.addEventListener("click", () => {
      selectTab(tabs.findIndex((tab) => tab.dataset.group === group.dataset.sceneGroup));
    });
  }

  const sceneArea = document.getElementById("workspace");
  let swipeStart;
  let suppressSceneClick = false;
  sceneArea.addEventListener("dragstart", (event) => {
    if (event.target.closest(".product-stack")) event.preventDefault();
  });
  sceneArea.addEventListener("pointerdown", (event) => {
    swipeStart = undefined;
    suppressSceneClick = false;
    if (event.button !== 0 || !event.isPrimary || !event.target.closest(".product-stack")) return;
    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  sceneArea.addEventListener("pointermove", (event) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const x = Math.abs(event.clientX - swipeStart.x);
    const y = Math.abs(event.clientY - swipeStart.y);
    if (x > 16 && x > y * 1.2) sceneArea.setPointerCapture(event.pointerId);
  });
  sceneArea.addEventListener("pointerup", (event) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const x = event.clientX - swipeStart.x;
    const y = event.clientY - swipeStart.y;
    swipeStart = undefined;
    if (Math.abs(x) < 48 || Math.abs(x) < Math.abs(y) * 1.2) return;
    suppressSceneClick = true;
    selectAdjacentScene(x < 0 ? 1 : -1);
  });
  sceneArea.addEventListener("pointercancel", () => { swipeStart = undefined; });
  sceneArea.addEventListener("click", (event) => {
    if (!suppressSceneClick) return;
    suppressSceneClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  const dialogOpeners = new WeakMap();
  const screenshotDialog = document.getElementById("screenshot-dialog");
  const zoomImage = document.getElementById("zoom-image");
  for (const link of document.querySelectorAll("[data-zoom]")) {
    link.addEventListener("click", (event) => {
      // 保留 Command/Ctrl 点击和不支持 dialog 的浏览器的原图打开行为。
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !screenshotDialog.showModal
      )
        return;
      event.preventDefault();
      const image = link.querySelector("img");
      document.getElementById("zoom-title").textContent = link.dataset.title;
      document.getElementById("zoom-description").textContent = link.dataset.description;
      zoomImage.src = link.href;
      zoomImage.alt = image.alt;
      zoomImage.width = Number(image.getAttribute("width"));
      zoomImage.height = Number(image.getAttribute("height"));
      document.getElementById("zoom-original").href = link.href;
      dialogOpeners.set(screenshotDialog, link);
      screenshotDialog.showModal();
    });
  }
  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("close", () =>
      dialogOpeners.get(dialog)?.focus({ preventScroll: true }),
    );
    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom)
      )
        dialog.close();
    });
  }

  const menus = [...document.querySelectorAll(".download-menu")];
  for (const menu of menus) {
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      for (const other of menus) if (other !== menu) other.open = false;
      placeMenu(menu);
      void refreshDownloads();
    });
    menu.querySelector(".download-retry").addEventListener("click", () => void refreshDownloads());
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        event.preventDefault();
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }
  document.addEventListener("click", (event) => {
    for (const menu of menus) if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("focusin", (event) => {
    for (const menu of menus) if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  window.addEventListener("resize", placeOpenMenus);
  window.addEventListener("scroll", placeOpenMenus, { passive: true });

  const feedbackUrl = window.SiyadaoDownloads.getFeedbackUrl();
  for (const trigger of document.querySelectorAll("[data-feedback]")) {
    if (feedbackUrl) {
      const link = document.createElement("a");
      link.className = trigger.className;
      link.href = feedbackUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.append(...trigger.childNodes);
      trigger.replaceWith(link);
    } else {
      trigger.addEventListener("click", () => {
        const dialog = document.getElementById("feedback-dialog");
        dialogOpeners.set(dialog, trigger);
        dialog.showModal();
      });
    }
  }

  function selectTab(index) {
    if (sceneIndex === index) return;
    const direction = index > sceneIndex ? "forward" : "backward";
    sceneIndex = index;
    const request = ++sceneRequest;
    const group = tabs[index].dataset.group;
    for (const button of groups) button.setAttribute("aria-pressed", String(button.dataset.sceneGroup === group));
    for (const [position, tab] of tabs.entries()) {
      const selected = position === index;
      tab.hidden = tab.dataset.group !== group;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    updateSceneNavigation();
    if (reducedMotion.matches) {
      presentScene(index, direction);
      return;
    }
    sceneArea.setAttribute("aria-busy", "true");
    void prepareImages([...panels[index].querySelectorAll("img[data-dark-src]")].map((image) => image.src)).then(() => {
      if (request !== sceneRequest) return;
      presentScene(index, direction);
    });
  }

  function stopSceneAnimations() {
    for (const animation of sceneAnimations) animation.cancel();
    sceneAnimations = [];
    if (leavingScene) {
      leavingScene.hidden = true;
      leavingScene.inert = false;
      leavingScene.removeAttribute("aria-hidden");
      leavingScene.classList.remove("scene-leaving");
      leavingScene = undefined;
    }
    delete sceneStage.dataset.animating;
  }

  function presentScene(index, direction) {
    const outgoing = displayedScene;
    const panel = panels[index];
    // 读取当前帧后再取消，连续点击时旧画面从当前的位置退出。
    const exiting = [...outgoing.querySelectorAll(".product-stack, .scene-metadata, .scene-description")].map((element) => {
      const style = getComputedStyle(element);
      return { element, opacity: style.opacity, transform: style.transform };
    });
    stopSceneAnimations();
    sceneArea.setAttribute("aria-busy", "false");
    for (const item of panels) item.hidden = item !== panel;
    displayedScene = panel;
    if (outgoing === panel || reducedMotion.matches) return;
    const x = direction === "forward" ? 48 : -48;
    outgoing.hidden = false;
    outgoing.inert = true;
    outgoing.setAttribute("aria-hidden", "true");
    outgoing.classList.add("scene-leaving");
    leavingScene = outgoing;
    sceneStage.dataset.animating = direction;
    for (const { element, opacity, transform } of exiting) {
      const picture = element.classList.contains("product-stack");
      sceneAnimations.push(element.animate([
        { opacity, transform },
        { opacity: 0, transform: picture ? `translateX(${-x * 0.6}px) scale(0.975)` : "translateY(-10px)" },
      ], { duration: picture ? 240 : 120, fill: "forwards", easing: "ease-out" }));
    }
    sceneAnimations.push(panel.querySelector(".product-stack").animate([
      { opacity: 0, transform: `translateX(${x}px) scale(0.975)` },
      { opacity: 1, transform: "translateX(0) scale(1)" },
    ], { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }));
    for (const copy of panel.querySelectorAll(".scene-metadata, .scene-description")) {
      sceneAnimations.push(copy.animate([
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 420, delay: 140, fill: "backwards", easing: "cubic-bezier(0.16, 1, 0.3, 1)" }));
    }
    const animations = sceneAnimations;
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (sceneAnimations === animations) stopSceneAnimations();
    });
  }

  function selectAdjacentScene(direction) {
    const index = sceneIndex + direction;
    if (index < 0 || index >= tabs.length) return;
    selectTab(index);
  }

  function updateSceneNavigation() {
    if ((sceneIndex === 0 && document.activeElement === previousScene) ||
        (sceneIndex === tabs.length - 1 && document.activeElement === nextScene)) {
      tabs[sceneIndex].focus({ preventScroll: true });
    }
    previousScene.disabled = sceneIndex === 0;
    nextScene.disabled = sceneIndex === tabs.length - 1;
    sceneCount.textContent = `${String(sceneIndex + 1).padStart(2, "0")} / ${String(tabs.length).padStart(2, "0")}`;
  }

  let refreshing = false;
  async function refreshDownloads() {
    if (refreshing) return;
    refreshing = true;
    for (const menu of menus) renderRelease(menu, { assets: {} }, true);
    const release = await window.SiyadaoDownloads.getRelease();
    for (const menu of menus) renderRelease(menu, release, false);
    refreshing = false;
    placeOpenMenus();
  }

  function renderRelease(menu, release, loading) {
    const popup = menu.querySelector(".download-popup");
    popup.setAttribute("aria-busy", String(loading));
    const version = menu.querySelector(".release-version");
    version.textContent = loading ? "◌" : release.version ? `v${release.version}` : "SIYADAO";
    version.classList.toggle("download-spinner", loading);
    for (const platform of window.SiyadaoDownloads.platforms) {
      const asset = release.assets[platform.id];
      const current = menu.querySelector(`[data-platform="${platform.id}"]`);
      const row = document.createElement("div");
      row.className = "platform-download";
      const option = document.createElement(asset ? "a" : "button");
      option.className = "platform-option";
      option.dataset.platform = platform.id;
      option.append(current.querySelector("svg").cloneNode(true));
      const label = document.createElement("span");
      label.textContent = platform.label;
      const size = document.createElement("small");
      size.textContent = asset
        ? `${Math.max(1, Math.round(asset.size / 1024 / 1024))} MB${asset.version !== release.version ? ` · v${asset.version}` : ''}`
        : loading
          ? "查询中"
          : release.status === "unavailable"
            ? "暂不可用"
            : "暂无安装包";
      option.append(label, size);
      if (asset) {
        option.href = asset.sources.official;
        option.download = asset.name;
        option.setAttribute("aria-label", `官网下载 ${platform.label} v${asset.version}`);
        option.title = `${platform.label} · v${asset.version} · 官网下载`;
      } else {
        option.type = "button";
        option.disabled = true;
      }
      row.append(option);
      if (asset?.sources.github) {
        const alternate = document.createElement("a");
        alternate.className = "platform-alternate";
        alternate.href = asset.sources.github;
        alternate.download = asset.name;
        alternate.rel = "noreferrer";
        alternate.textContent = "GitHub";
        alternate.title = "GitHub 备用下载";
        alternate.setAttribute("aria-label", `GitHub 备用下载 ${platform.label} v${asset.version}`);
        row.append(alternate);
      }
      if (current.parentElement.classList.contains("platform-download"))
        current.parentElement.replaceWith(row);
      else current.replaceWith(row);
    }
    const messages = {
      empty: "暂未获取到公开版本。",
      unavailable: "暂时无法获取版本，请稍后重试。",
      ready: "官方发布 · 稳定版",
    };
    menu.querySelector(".download-status").textContent = loading
      ? "正在获取最新版本…"
      : release.stale
        ? "暂时无法刷新，当前显示上次获取的版本。"
      : release.status === "ready"
        ? Object.values(release.assets).some((asset) => asset.version !== release.version)
          ? "各平台版本以下载项为准。"
          : release.prerelease ? "官方发布 · 测试版" : messages.ready
        : messages[release.status];
    menu.querySelector(".download-retry").hidden = loading || (release.status !== "unavailable" && !release.stale);
    const history = menu.querySelector(".release-history");
    history.hidden = !release.releaseUrl;
    if (release.releaseUrl) history.href = release.releaseUrl;
    else history.removeAttribute("href");
  }

  function placeOpenMenus() {
    for (const menu of menus) if (menu.open) placeMenu(menu);
  }

  function placeMenu(menu) {
    const popup = menu.querySelector(".download-popup");
    const trigger = menu.querySelector("summary").getBoundingClientRect();
    popup.style.position = "fixed";
    popup.style.right = "auto";
    // 测量使用屏幕坐标；CSS 定位尺寸需要扣除页面或文字缩放。
    const scale = popup.getBoundingClientRect().width / popup.offsetWidth;
    const margin = 12 * scale;
    popup.style.maxWidth = `${window.innerWidth / scale - 24}px`;
    const width = popup.getBoundingClientRect().width;
    const left = menu.classList.contains("download-menu-compact")
      ? trigger.right - width
      : trigger.left;
    popup.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - width - margin)) / scale}px`;
    const below = window.innerHeight - trigger.bottom - margin;
    const above = trigger.top - margin;
    const openBelow = below >= Math.min(popup.scrollHeight, 580) * scale || below >= above;
    popup.style.maxHeight = `${Math.min(580, Math.max(120, (openBelow ? below : above) / scale - 10))}px`;
    popup.style.top = `${Math.max(margin, openBelow ? trigger.bottom + 10 * scale : trigger.top - popup.getBoundingClientRect().height - 10 * scale) / scale}px`;
  }
})();
