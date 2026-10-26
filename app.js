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
  // 滚动换场进行中时，后续跨幕不再重播入场，避免退出层叠在新画面上。
  let scrollHandoffUntil = 0;
  let scrollHandoffToken = 0;
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
  let detectedPlatform = null;
  let detectingPlatform = null;
  let primaryDownloadBusy = false;
  let downloadStatusOverride = null;

  async function resolveDetectedPlatform() {
    if (detectedPlatform) return detectedPlatform;
    if (!detectingPlatform) {
      detectingPlatform = window.SiyadaoDownloads.detectClientPlatform()
        .then((platform) => {
          detectedPlatform = platform;
          return platform;
        })
        .finally(() => {
          detectingPlatform = null;
        });
    }
    return detectingPlatform;
  }

  function startAssetDownload(targets, asset) {
    const link = document.createElement("a");
    link.href = targets.href;
    link.download = asset.name;
    link.rel = "noreferrer";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function handlePrimaryDownload(menu) {
    if (primaryDownloadBusy) return;
    primaryDownloadBusy = true;
    const summary = menu.querySelector("summary");
    const label = summary.querySelector("span");
    const previous = label.textContent;
    label.textContent = "正在准备…";
    try {
      const [release, platform] = await Promise.all([
        window.SiyadaoDownloads.getRelease(),
        resolveDetectedPlatform(),
      ]);
      for (const item of menus) renderRelease(item, release, false);
      const action = window.SiyadaoDownloads.primaryDownloadAction(release, platform);
      if (action.kind === "download") {
        downloadStatusOverride = null;
        label.textContent = previous;
        summary.title = `下载 ${action.platform.label} · v${action.asset.version}`;
        summary.setAttribute("aria-label", `下载 ${action.platform.label}`);
        startAssetDownload(action.targets, action.asset);
        return;
      }
      label.textContent = previous;
      downloadStatusOverride = action.kind === "unavailable"
        ? `当前系统是 ${action.platform.label}，暂无对应安装包。请从下方选择其他平台，或稍后再试。`
        : null;
      menu.open = true;
      placeMenu(menu);
    } catch {
      label.textContent = previous;
      menu.open = true;
      placeMenu(menu);
      void refreshDownloads();
    } finally {
      primaryDownloadBusy = false;
    }
  }

  for (const menu of menus) {
    const summary = menu.querySelector("summary");
    summary.addEventListener("pointerenter", () => {
      void resolveDetectedPlatform();
      void window.SiyadaoDownloads.getRelease();
    });
    summary.addEventListener("click", (event) => {
      // 点箭头仍打开六平台菜单；点主文案则尝试一键下载当前芯片包。
      if (event.target.closest("svg.lucide-chevron-down")) return;
      event.preventDefault();
      void handlePrimaryDownload(menu);
    });
    menu.addEventListener("toggle", () => {
      if (!menu.open) {
        downloadStatusOverride = null;
        return;
      }
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

  const scenePin = document.createElement("div");
  scenePin.className = "scene-pin";
  const sceneFrame = document.createElement("div");
  sceneFrame.className = "scene-pin-frame";
  sceneFrame.append(...sceneArea.childNodes);
  scenePin.append(sceneFrame);
  sceneArea.append(scenePin);
  let ignoreSceneScroll = 0;
  function runwayActive() {
    return sceneArea.classList.contains("scene-runway");
  }
  function layoutSceneRunway() {
    sceneArea.classList.add("scene-runway");
    // 每一幕占满一屏滚动，十二幕走完，粘性区才松开。
    const step = Math.max(window.innerHeight, 640);
    const pinHeight = scenePin.offsetHeight || window.innerHeight;
    sceneArea.style.height = `${Math.round(pinHeight + step * tabs.length)}px`;
  }
  function runwayTravel() {
    return Math.max(0, sceneArea.offsetHeight - (scenePin.offsetHeight || window.innerHeight));
  }
  function sceneProgress() {
    const travel = runwayTravel();
    if (travel <= 0) return 0;
    return Math.min(1, Math.max(0, -sceneArea.getBoundingClientRect().top / travel));
  }
  function alignRunway(index) {
    if (!runwayActive()) return;
    const travel = runwayTravel();
    const progress = tabs.length <= 1 ? 0 : (index + 0.5) / tabs.length;
    const top = window.scrollY + sceneArea.getBoundingClientRect().top + progress * travel;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    ignoreSceneScroll += 1;
    window.scrollTo(0, top);
    root.style.scrollBehavior = previous;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ignoreSceneScroll = Math.max(0, ignoreSceneScroll - 1);
    }));
  }
  function sceneIndexFromScroll() {
    if (tabs.length <= 1) return 0;
    const progress = sceneProgress();
    if (progress >= 1) return tabs.length - 1;
    return Math.min(tabs.length - 1, Math.floor(progress * tabs.length));
  }
  let sceneScrollFrame = 0;
  function syncSceneToScroll() {
    if (!runwayActive() || ignoreSceneScroll) return;
    const index = sceneIndexFromScroll();
    if (index !== sceneIndex) selectTab(index, "scroll");
  }
  window.addEventListener("scroll", () => {
    if (sceneScrollFrame) return;
    sceneScrollFrame = requestAnimationFrame(() => {
      sceneScrollFrame = 0;
      syncSceneToScroll();
    });
  }, { passive: true });
  window.addEventListener("resize", () => {
    const top = sceneArea.getBoundingClientRect().top;
    const inside = runwayActive() && top <= 2 && top > -runwayTravel();
    const index = inside ? sceneIndexFromScroll() : sceneIndex;
    layoutSceneRunway();
    if (inside) alignRunway(index);
  });
  reducedMotion.addEventListener("change", () => {
    layoutSceneRunway();
    alignRunway(sceneIndex);
  });
  layoutSceneRunway();
  syncSceneToScroll();
  warmNearbyScenes(sceneIndex);

  function selectTab(index, source = "control") {
    if (sceneIndex === index) {
      if (source !== "scroll") alignRunway(index);
      return;
    }
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
    warmNearbyScenes(index);
    if (source !== "scroll") alignRunway(index);
    if (reducedMotion.matches) {
      presentScene(index, direction, "instant");
      return;
    }
    // 滚动用短交叉淡入；连续快滑直接跟上当前幕。点选仍用完整滑入。
    if (source === "scroll") {
      presentScene(index, direction, "scroll");
      return;
    }
    sceneArea.setAttribute("aria-busy", "true");
    void prepareImages([...panels[index].querySelectorAll("img[data-dark-src]")].map((image) => image.src)).then(() => {
      if (request !== sceneRequest) return;
      presentScene(index, direction, "full");
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

  function warmNearbyScenes(index) {
    const urls = [];
    for (let cursor = index - 1; cursor <= index + 2; cursor += 1) {
      const item = panels[cursor];
      if (!item) continue;
      for (const image of item.querySelectorAll("img[src]")) urls.push(image.currentSrc || image.src);
    }
    if (urls.length) void prepareImages(urls);
  }

  function revealScene(panel) {
    sceneArea.setAttribute("aria-busy", "false");
    for (const item of panels) item.hidden = item !== panel;
    displayedScene = panel;
  }

  function settleSceneAnimations(animations, token) {
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (token !== 0 && scrollHandoffToken === token) scrollHandoffUntil = 0;
      if (sceneAnimations === animations) stopSceneAnimations();
    });
  }

  function presentScene(index, direction, mode = "full") {
    const outgoing = displayedScene;
    const panel = panels[index];
    const now = performance.now();
    // 上一幕滚动淡入还没结束就又跨界：丢掉退出层，新画面直接就位，不再从零滑入。
    if (mode === "scroll" && now < scrollHandoffUntil) {
      scrollHandoffToken += 1;
      scrollHandoffUntil = now + 200;
      stopSceneAnimations();
      revealScene(panel);
      return;
    }
    if (mode !== "scroll") {
      scrollHandoffToken += 1;
      scrollHandoffUntil = 0;
    }
    const animated = mode !== "instant";
    // 读取当前帧后再取消，点选打断时旧画面从当前位置退出。
    const exiting = animated && mode !== "scroll" ? [...outgoing.querySelectorAll(".product-stack, .scene-metadata, .scene-description")].map((element) => {
      const style = getComputedStyle(element);
      return { element, opacity: style.opacity, transform: style.transform };
    }) : [];
    stopSceneAnimations();
    revealScene(panel);
    if (!animated || outgoing === panel) return;
    const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
    outgoing.hidden = false;
    outgoing.inert = true;
    outgoing.setAttribute("aria-hidden", "true");
    outgoing.classList.add("scene-leaving");
    leavingScene = outgoing;
    sceneStage.dataset.animating = direction;
    if (mode === "scroll") {
      const token = ++scrollHandoffToken;
      const x = direction === "forward" ? 14 : -14;
      const fade = 200;
      scrollHandoffUntil = now + fade;
      // 新截图盖在旧画面上淡入。旧截图保持不透明，避免两层一起变淡时透出底色。
      sceneAnimations.push(panel.querySelector(".product-stack").animate([
        { opacity: 0, transform: `translate3d(${x}px, 0, 0)` },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ], { duration: fade, easing: "cubic-bezier(0.25, 0.8, 0.3, 1)", fill: "both" }));
      // 文案立刻换成当前幕，不跟在截图后面，也不让两行标题叠在一起。
      for (const copy of outgoing.querySelectorAll(".scene-metadata, .scene-description")) {
        sceneAnimations.push(copy.animate([{ opacity: 0 }], { duration: 1, fill: "forwards" }));
      }
      settleSceneAnimations(sceneAnimations, token);
      return;
    }
    const x = direction === "forward" ? 40 : -40;
    for (const { element, opacity, transform } of exiting) {
      const picture = element.classList.contains("product-stack");
      sceneAnimations.push(element.animate([
        { opacity, transform },
        { opacity: 0, transform: picture ? `translate3d(${-x * 0.4}px, 0, 0) scale(0.985)` : "translate3d(0, -6px, 0)" },
      ], { duration: picture ? 200 : 120, fill: "forwards", easing: "ease-out" }));
    }
    sceneAnimations.push(panel.querySelector(".product-stack").animate([
      { opacity: 0, transform: `translate3d(${x}px, 0, 0) scale(0.985)` },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ], { duration: 360, easing: ease, fill: "both" }));
    for (const copy of panel.querySelectorAll(".scene-metadata, .scene-description")) {
      sceneAnimations.push(copy.animate([
        { opacity: 0, transform: "translate3d(0, 10px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ], { duration: 280, delay: 30, fill: "both", easing: ease }));
    }
    settleSceneAnimations(sceneAnimations, 0);
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
    const [release] = await Promise.all([
      window.SiyadaoDownloads.getRelease(),
      resolveDetectedPlatform(),
    ]);
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
      if (detectedPlatform?.id === platform.id) row.dataset.detected = "true";
      const targets = asset ? window.SiyadaoDownloads.downloadTargets(asset) : null;
      const option = document.createElement(targets ? "a" : "button");
      option.className = "platform-option";
      option.dataset.platform = platform.id;
      if (detectedPlatform?.id === platform.id) option.dataset.detected = "true";
      option.append(current.querySelector("svg").cloneNode(true));
      const label = document.createElement("span");
      label.textContent = platform.label;
      const size = document.createElement("small");
      size.textContent = targets
        ? `${Math.max(1, Math.round(asset.size / 1024 / 1024))} MB${asset.version !== release.version ? ` · v${asset.version}` : ''}`
        : loading
          ? "查询中"
          : release.status === "unavailable"
            ? "暂不可用"
            : "暂无安装包";
      option.append(label, size);
      if (targets) {
        const viaGithub = targets.href === asset.sources.github;
        const sourceLabel = viaGithub ? "GitHub 下载" : "官网下载";
        option.href = targets.href;
        option.download = asset.name;
        option.setAttribute("aria-label", `${sourceLabel} ${platform.label} v${asset.version}`);
        option.title = `${platform.label} · v${asset.version} · ${sourceLabel}`;
      } else {
        option.type = "button";
        option.disabled = true;
      }
      row.append(option);
      if (targets?.alternateHref) {
        const alternate = document.createElement("a");
        alternate.className = "platform-alternate";
        alternate.href = targets.alternateHref;
        alternate.download = asset.name;
        alternate.rel = "noreferrer";
        alternate.textContent = targets.alternateLabel;
        alternate.title = "官网备用下载";
        alternate.setAttribute("aria-label", `官网备用下载 ${platform.label} v${asset.version}`);
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
      : downloadStatusOverride
        || (release.stale
          ? "暂时无法刷新，当前显示上次获取的版本。"
        : release.status === "ready"
          ? Object.values(release.assets).some((asset) => asset.version !== release.version)
            ? "各平台版本以下载项为准。"
            : release.prerelease ? "官方发布 · 测试版" : messages.ready
          : messages[release.status]);
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
