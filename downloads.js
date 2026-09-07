/** 公开安装包仓库，填入 owner/name；留空时不发起任何外部请求。 */
window.SIYADAO_REPOSITORY = 'siyadao/studio';

/** 六种平台共用按需请求与短期缓存；官网复用 Nginx 缓存，不需要 GitHub 凭据。 */
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

  /** 打开菜单时读取最近公开版本（含 preview），一分钟内复用结果；不在启动时请求或轮询。 */
  async function getRelease() {
    const repository = window.SIYADAO_REPOSITORY;
    const key = repository;
    if (!repository) return { status: 'setup', assets: {} };
    if (cached?.key === key && !cached.value.stale && Date.now() - cached.at < 60000)
      return cached.value;
    if (inflight?.key === key) return inflight.promise;
    const promise = requestRelease(repository).then((value) => {
      if (value.status === 'unavailable' && cached?.key === key)
        return { ...cached.value, stale: true };
      if (value.status !== 'unavailable') cached = { key, at: Date.now(), value };
      return value;
    });
    inflight = { key, promise };
    try {
      return await promise;
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

  async function requestRelease(repository) {
    try {
      if (
        typeof repository !== 'string' ||
        !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository)
      ) {
        throw new Error('发布仓库应为 owner/name');
      }
      console.info('[downloads] 开始读取公开版本');
      // 正式站点共用匿名缓存，避免每位访客都受 GitHub 网络与限流影响；本地预览仍独立可用。
      const endpoint = window.location?.hostname === 'studio.siyadao.cn' && repository === 'siyadao/studio'
        ? '/api/releases'
        : `https://api.github.com/repos/${repository}/releases?per_page=20`;
      const response = await fetch(
        endpoint,
        {
          headers: { Accept: 'application/vnd.github+json' },
          credentials: 'omit',
          signal: AbortSignal.timeout(8000),
        },
      );
      const releaseUrl = `https://github.com/${repository}/releases`;
      if (response.status === 404)
        return { status: 'empty', assets: {}, releaseUrl };
      if (!response.ok) throw new Error(`公开版本服务暂不可用（HTTP ${response.status}）`);
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('公开版本数据格式错误');
      }
      // 最近 20 个公开版本构成一次有界请求，各平台独立选包；草稿绝不进入下载项。
      const releases = data.filter((release) => release && release.draft === false &&
        typeof release.tag_name === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(release.tag_name) &&
        typeof release.prerelease === 'boolean' && Array.isArray(release.assets))
        .sort((a, b) => (Date.parse(b.published_at || b.created_at) || 0) - (Date.parse(a.published_at || a.created_at) || 0));
      if (!releases.length) return { status: 'empty', assets: {}, releaseUrl };
      const latest = releases[0];
      const available = releases.flatMap((release, rank) => release.assets.flatMap((item) => {
        if (
          !item ||
          typeof item.name !== 'string' ||
          typeof item.browser_download_url !== 'string' ||
          !Number.isFinite(item.size) ||
          item.size < 0
        )
          return [];
        const version = release.tag_name;
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
          !url.pathname.startsWith(`/${repository}/releases/download/${encodeURIComponent(version)}/`)
        )
          return [];
        return [{ name: item.name, url: url.href, size: item.size, version, rank }];
      }));
      const assets = {};
      for (const platform of platforms) {
        const candidates = available.filter((asset) =>
          matchesPlatform(asset.name, platform),
        );
        candidates.sort(
          (a, b) =>
            a.rank - b.rank ||
            installPriority(a.name) - installPriority(b.name) ||
            a.name.localeCompare(b.name),
        );
        if (candidates[0]) assets[platform.id] = candidates[0];
      }
      console.info('[downloads] 公开版本读取成功');
      return {
        status: 'ready',
        version: latest.tag_name,
        prerelease: latest.prerelease,
        stale: ['STALE', 'UPDATING'].includes(response.headers?.get('X-Release-Cache')),
        releaseUrl: `${releaseUrl}/tag/${encodeURIComponent(latest.tag_name)}`,
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
