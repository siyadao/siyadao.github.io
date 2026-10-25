/** 公开反馈仓库；安装包元数据由官方服务提供，主下载优先使用其中的 GitHub 地址。 */
window.SIYADAO_REPOSITORY = 'siyadao/studio';

/** 六种平台共用按需请求与短期缓存；不探测 GitHub，不需要账号或凭据。 */
window.SiyadaoDownloads = (() => {
  const officialApi = 'https://studioapi.siyadao.cn/v1/app/releases';
  const releaseHistory = 'https://github.com/siyadao/studio/releases';
  const maximumResponseBytes = 2 * 1024 * 1024;
  const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;
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
    const key = window.location?.hostname === 'studio.siyadao.cn'
      ? '/api/app/releases'
      : officialApi;
    if (cached?.key === key && !cached.value.stale && Date.now() - cached.at < 60000)
      return cached.value;
    if (inflight?.key === key) return inflight.promise;
    const promise = requestRelease(key).then((value) => {
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
    if (typeof repository !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9_.-]+$/.test(repository)) return null;
    const url = `https://github.com/${repository}/issues/new/choose`;
    return new URL(url).href === url ? url : null;
  }

  async function requestRelease(endpoint) {
    try {
      console.info('[downloads] 开始读取公开版本');
      const response = await fetch(
        endpoint,
        {
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) throw new Error(`公开版本服务暂不可用（HTTP ${response.status}）`);
      const releases = validateReleases(await readReleaseBody(response));
      const stale = ['STALE', 'UPDATING'].includes(response.headers.get('X-Release-Cache'));
      if (!releases.length) return { status: 'empty', assets: {}, stale, releaseUrl: releaseHistory };
      const latest = releases[0];
      const available = releases.flatMap((release, rank) => release.assets.map((item) => ({
        ...item, version: release.version, rank,
      })));
      const assets = {};
      for (const platform of platforms) {
        const candidates = available.filter((asset) =>
          installerPriority(asset.name, asset.version, platform) !== undefined,
        );
        candidates.sort(
          (a, b) =>
            a.rank - b.rank ||
            installerPriority(a.name, a.version, platform) - installerPriority(b.name, b.version, platform) ||
            a.name.localeCompare(b.name),
        );
        if (candidates[0]) assets[platform.id] = candidates[0];
      }
      console.info('[downloads] 公开版本读取成功');
      return {
        status: 'ready',
        version: latest.version,
        prerelease: latest.prerelease,
        stale,
        releaseUrl: `${releaseHistory}/tag/v${latest.version}`,
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

  async function readReleaseBody(response) {
    if (Number(response.headers.get('Content-Length')) > maximumResponseBytes) {
      await response.body.cancel();
      throw new Error('公开版本数据超过读取上限');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let text = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maximumResponseBytes) {
          await reader.cancel();
          throw new Error('公开版本数据超过读取上限');
        }
        text += decoder.decode(value, { stream: true });
      }
      return JSON.parse(text + decoder.decode());
    } finally {
      reader.releaseLock();
    }
  }

  function validateReleases(data) {
    if (!Array.isArray(data) || data.length > 20)
      throw new Error('公开版本列表格式错误');
    const versions = new Set();
    for (const release of data) {
      const match = typeof release?.version === 'string' && release.version.length <= 128
        ? versionPattern.exec(release.version)
        : null;
      if (!match || versions.has(release.version) || typeof release.prerelease !== 'boolean' ||
        release.prerelease !== Boolean(match[4]) || !validPublishedAt(release.published_at) ||
        typeof release.notes !== 'string' || !Array.isArray(release.assets) || release.assets.length > 64)
        throw new Error('公开版本信息格式错误');
      versions.add(release.version);
      const names = new Set();
      for (const asset of release.assets) {
        if (typeof asset?.name !== 'string' || asset.name.length > 255 || names.has(asset.name) ||
          !platforms.some((platform) => installerPriority(asset.name, release.version, platform) !== undefined) ||
          !Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 1024 * 1024 * 1024 ||
          typeof asset.sha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(asset.sha256) ||
          !asset.sources || typeof asset.sources !== 'object')
          throw new Error('安装包信息格式错误');
        names.add(asset.name);
        const path = `v${release.version}/${asset.name}`;
        validateSource(asset.sources.official, `https://download.siyadao.cn/${path}`);
        if (asset.sources.github !== null)
          validateSource(asset.sources.github, `${releaseHistory}/download/${path}`);
      }
    }
    return data.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  }

  function validateSource(value, expected) {
    if (typeof value !== 'string' || value !== expected || new URL(value).href !== expected)
      throw new Error('安装包下载地址与官方发布信息不一致');
  }

  function validPublishedAt(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))) return false;
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
      31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] &&
      Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60;
  }

  /** 主下载优先 GitHub 完整地址；「备用」只在两边都有时指向官网。不探测可达性。 */
  function downloadTargets(asset) {
    const sources = asset?.sources;
    const github = typeof sources?.github === 'string' && sources.github ? sources.github : null;
    const official = typeof sources?.official === 'string' && sources.official ? sources.official : null;
    if (github && official) {
      return { href: github, alternateHref: official, alternateLabel: '备用' };
    }
    if (github || official) {
      return { href: github || official, alternateHref: null, alternateLabel: null };
    }
    return null;
  }

  function installerPriority(name, version, platform) {
    const prefix = `siyadao-v${version}-${platform.system}-${platform.architecture}`;
    if (!name.startsWith(prefix)) return undefined;
    const suffixes = {
      macos: ['.dmg', '.pkg', '.zip'],
      windows: ['-setup.exe', '.msi', '.zip'],
      linux: ['.appimage', '.deb', '.rpm', '.tar.gz'],
    };
    const priority = suffixes[platform.system].indexOf(name.slice(prefix.length).toLowerCase());
    return priority === -1 ? undefined : priority;
  }

  return { platforms, getRelease, getFeedbackUrl, downloadTargets };
})();
