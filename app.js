// 展示内容直接写在 HTML 中，JavaScript 只增强页签、原生弹窗与下载菜单。
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      const next = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next);
      tabs[next].focus({ preventScroll: true });
      tabs[next].scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

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
    for (const [position, tab] of tabs.entries()) {
      const selected = position === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    }
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
    version.textContent = loading ? "◌" : release.version || "SIYADAO";
    version.classList.toggle("download-spinner", loading);
    for (const platform of window.SiyadaoDownloads.platforms) {
      const asset = release.assets[platform.id];
      const current = menu.querySelector(`[data-platform="${platform.id}"]`);
      const option = document.createElement(asset ? "a" : "button");
      option.className = "platform-option";
      option.dataset.platform = platform.id;
      option.append(current.querySelector("svg").cloneNode(true));
      const label = document.createElement("span");
      label.textContent = platform.label;
      const size = document.createElement("small");
      size.textContent = asset
        ? `${Math.max(1, Math.round(asset.size / 1024 / 1024))} MB`
        : loading
          ? "查询中"
          : release.status === "unavailable"
            ? "暂不可用"
            : "未发布";
      option.append(label, size);
      if (asset) {
        option.href = asset.url;
        option.download = asset.name;
        option.setAttribute("aria-label", `下载 ${platform.label}`);
      } else {
        option.type = "button";
        option.disabled = true;
      }
      current.replaceWith(option);
    }
    const messages = {
      setup: "安装包发布准备中，敬请期待。",
      empty: "暂未获取到公开版本。",
      unavailable: "暂时无法获取版本，请稍后重试。",
      ready: "安装包由 GitHub Releases 提供。",
    };
    menu.querySelector(".download-status").textContent = loading
      ? "正在获取最新版本…"
      : release.status === "ready" && release.prerelease
        ? "测试版 · 未签名/未公证；点击平台即可下载。"
        : messages[release.status];
    menu.querySelector(".download-retry").hidden = loading || release.status !== "unavailable";
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
    const left = menu.classList.contains("download-menu-compact")
      ? trigger.right - popup.offsetWidth
      : trigger.left;
    popup.style.left = `${Math.max(12, Math.min(left, window.innerWidth - popup.offsetWidth - 12))}px`;
    const below = window.innerHeight - trigger.bottom - 12;
    const above = trigger.top - 12;
    const openBelow = below >= Math.min(popup.scrollHeight, 580) || below >= above;
    popup.style.maxHeight = `${Math.min(580, Math.max(120, (openBelow ? below : above) - 10))}px`;
    popup.style.top = `${Math.max(12, openBelow ? trigger.bottom + 10 : trigger.top - popup.offsetHeight - 10)}px`;
  }
})();
