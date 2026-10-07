// 在样式加载前恢复主题，避免刷新时出现另一种主题。
(() => {
  let theme = "dark";
  try {
    const stored = localStorage.getItem("siyadao.website.theme");
    if (stored === "light" || stored === "dark") theme = stored;
  } catch {
    // 浏览器禁用存储时，当前页面仍可切换主题。
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
})();
