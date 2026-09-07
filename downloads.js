/** 公开安装包仓库，填入 owner/name；留空时不发起任何外部请求。 */
window.SIYADAO_REPOSITORY = 'siyadao/studio';
/** 发布完成后部署同源清单，避免浏览器依赖 GitHub API 额度；文件链接仍直达安装包。 */
window.SIYADAO_RELEASE_MANIFEST = 'public/releases/v0.1.0-preview.1.json';

/** 六种平台共用一个按需请求与短期缓存，不需要后端或 GitHub 凭据。 */
window.SiyadaoDownloads = (() => {
  const platforms = [
    {
      id: 'macos-arm64',
      label: 'macOS（M 芯片）',
      system: 'macos',
      architecture: 'arm64',
    },
    {
      id: 'macos-x64',
      label: 'macOS（Intel）',
      system: 'macos',
      architecture: 'x64',
    },
    {
      id: 'windows-x64',
      label: 'Windows（x86_64）',
      system: 'windows',
      architecture: 'x64',
    },
    {
      id: 'windows-arm64',
      label: 'Windows（ARM64）',
      system: 'windows',
      architecture: 'arm64',
    },
    {
      id: 'linux-x64',
      label: 'Linux（x86_64）',
      system: 'linux',
      architecture: 'x64',
    },
    {
      id: 'linux-arm64',
      label: 'Linux（ARM64）',
      system: 'linux',
      architecture: 'arm64',
    },
  ];
  let cached;
  let inflight;

  /** 首次打开菜单才读取发布清单；未指定清单时读取最新稳定版。 */
  async function getRelease() {
    const repository = window.SIYADAO_REPOSITORY;
    const manifest = window.SIYADAO_RELEASE_MANIFEST;
    const key = JSON.stringify([repository, manifest]);
    if (!repository) return { status: 'setup', assets: {} };
    if (cached?.key === key && Date.now() - cached.at < 300000)
      return cached.value;
    if (inflight?.key === key) return inflight.promise;
    const promise = requestRelease(repository, manifest);
    inflight = { key, promise };
    try {
      const value = await promise;
      if (value.status !== 'unavailable')
        cached = { key, at: Date.now(), value };
      return value;
    } finally {
      if (inflight?.promise === promise) inflight = undefined;
    }
  }

  /** 只返回公开仓库的 Issues 链接，不处理账号或凭据。 */
  function getFeedbackUrl() {
    const repository = window.SIYADAO_REPOSITORY;
    return typeof repository === 'string' &&
      /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository)
      ? `https://github.com/${repository}/issues/new/choose`
      : null;
  }

  async function requestRelease(repository, manifest) {
    try {
      if (
        typeof repository !== 'string' ||
        !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository)
      ) {
        throw new Error('发布仓库应为 owner/name');
      }
      if (manifest && (typeof manifest !== 'string' || !/^public\/releases\/[a-zA-Z0-9_.-]+\.json$/.test(manifest)))
        throw new Error('发布清单必须为本站相对路径');
      console.info('[downloads] 开始读取公开版本');
      const response = await fetch(
        manifest || `https://api.github.com/repos/${repository}/releases/latest`,
        {
          headers: { Accept: 'application/vnd.github+json' },
          credentials: 'omit',
          signal: AbortSignal.timeout(8000),
        },
      );
      const releaseUrl = `https://github.com/${repository}/releases`;
      if (response.status === 404)
        return { status: 'empty', assets: {}, releaseUrl };
      if (!response.ok) throw new Error('公开版本服务暂不可用');
      const data = await response.json();
      // GitHub 是外部数据边界：版本字段与下载链接在此校验一次。
      if (
        !data ||
        typeof data.tag_name !== 'string' ||
        data.draft !== false ||
        typeof data.prerelease !== 'boolean' ||
        !Array.isArray(data.assets)
      ) {
        throw new Error('公开版本数据格式错误');
      }
      const available = data.assets.flatMap((item) => {
        if (
          !item ||
          typeof item.name !== 'string' ||
          typeof item.browser_download_url !== 'string' ||
          !Number.isFinite(item.size) ||
          item.size < 0
        )
          return [];
        let url;
        try {
          url = new URL(item.browser_download_url);
        } catch {
          return [];
        }
        if (
          url.origin !== 'https://github.com' ||
          url.username ||
          url.password ||
          !url.pathname.startsWith(`/${repository}/releases/download/${encodeURIComponent(data.tag_name)}/`)
        )
          return [];
        return [{ name: item.name, url: url.href, size: item.size }];
      });
      const assets = {};
      for (const platform of platforms) {
        const candidates = available.filter((asset) =>
          matchesPlatform(asset.name, platform),
        );
        candidates.sort(
          (a, b) =>
            installPriority(a.name) - installPriority(b.name) ||
            a.name.localeCompare(b.name),
        );
        if (candidates[0]) assets[platform.id] = candidates[0];
      }
      console.info('[downloads] 公开版本读取成功');
      return {
        status: 'ready',
        version: data.tag_name,
        prerelease: data.prerelease,
        releaseUrl: `${releaseUrl}/tag/${encodeURIComponent(data.tag_name)}`,
        assets,
      };
    } catch (error) {
      console.warn(
        '[downloads] 公开版本读取失败',
        error instanceof Error ? error.message : '响应不可用',
      );
      return { status: 'unavailable', assets: {} };
    }
  }

  function matchesPlatform(filename, platform) {
    const name = filename.toLowerCase();
    const systemMatches =
      platform.system === 'macos'
        ? /(?:macos|darwin|mac)[-_.]|\.(?:dmg|pkg)$/.test(name) &&
          /\.(?:dmg|pkg|zip)$/.test(name)
        : platform.system === 'windows'
          ? /\.(?:exe|msi)$/.test(name) ||
            /(?:windows|win)[-_.].*\.zip$/.test(name)
          : /(?:linux[-_.]|\.appimage$|\.deb$|\.rpm$)/.test(name) &&
            /\.(?:appimage|deb|rpm|tar\.gz)$/.test(name);
    const architectureMatches =
      platform.architecture === 'arm64'
        ? /(?:arm64|aarch64)/.test(name) ||
          (platform.system === 'macos' && /universal/.test(name))
        : /(?:x86_64|x64|amd64|intel)/.test(name) ||
          (platform.system === 'macos' && /universal/.test(name));
    return (
      systemMatches &&
      architectureMatches &&
      !/(?:symbols|debug|checksum|signature)/.test(name)
    );
  }

  function installPriority(name) {
    return /\.(dmg|exe|appimage)$/i.test(name) ? 0 : 1;
  }

  return { platforms, getRelease, getFeedbackUrl };
})();
