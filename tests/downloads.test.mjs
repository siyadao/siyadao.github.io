// 按项目约定仅提供聚焦用例；需要时手动执行 node --test tests/downloads.test.mjs。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(
  new URL('../downloads.js', import.meta.url),
  'utf8',
);

test('初始化与未配置仓库不会触发请求', async () => {
  let calls = 0;
  const { api } = createContext(() => {
    calls++;
  });
  assert.equal(calls, 0);
  assert.equal((await api.getRelease()).status, 'setup');
  assert.equal(calls, 0);
});

test('多个入口合并首次请求，成功结果缓存一分钟', async () => {
  let calls = 0;
  let finish;
  const { api, window, clock } = createContext(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  window.SIYADAO_REPOSITORY = 'demo/product';
  const first = api.getRelease();
  const second = api.getRelease();
  assert.equal(calls, 1);
  finish(response([]));
  assert.equal((await first).status, 'ready');
  await second;
  await api.getRelease();
  assert.equal(calls, 1);
  clock.now += 60001;
  const expired = api.getRelease();
  assert.equal(calls, 2);
  finish(response([]));
  await expired;
});

test('失败后可重试，404 独立显示无公开版本', async () => {
  let calls = 0;
  const { api, window } = createContext(async () => {
    if (++calls === 1) throw new Error('offline');
    return { status: 404, ok: false };
  });
  window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal((await api.getRelease()).status, 'unavailable');
  assert.equal((await api.getRelease()).status, 'empty');
  assert.equal(calls, 2);
});

test('按系统与架构匹配六种安装包，排除签名及外部链接', async () => {
  const names = [
    'macos-arm64.dmg',
    'macos-x64.dmg',
    'windows-x64.exe',
    'windows-arm64.exe',
    'linux-x64.AppImage',
    'linux-arm64.AppImage',
  ];
  const assets = names.map((name) => asset(name));
  assets.push(asset('macos-arm64-debug.dmg'), {
    ...asset('linux-arm64.deb'),
    browser_download_url: 'https://untrusted.example/file.deb',
  });
  const { api, window } = createContext(async () => response(assets));
  window.SIYADAO_REPOSITORY = 'demo/product';
  const release = await api.getRelease();
  assert.equal(Object.keys(release.assets).length, 6);
  for (const platform of api.platforms) {
    assert.match(
      release.assets[platform.id].url,
      /^https:\/\/github\.com\/demo\/product\/releases\/download\//,
    );
    assert.ok(!release.assets[platform.id].name.includes('debug'));
  }
});

test('无效配置不请求外网，畸形响应不可用于下载', async () => {
  let calls = 0;
  const { api, window } = createContext(async () => {
    calls++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ tag_name: 'v1', assets: 'invalid' }),
    };
  });
  window.SIYADAO_REPOSITORY = '../private/secret';
  assert.equal((await api.getRelease()).status, 'unavailable');
  assert.equal(calls, 0);
  window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal((await api.getRelease()).status, 'unavailable');
  assert.equal(calls, 1);
});

function createContext(fetch) {
  const window = {};
  const clock = { now: 1000 };
  vm.runInNewContext(source, {
    window,
    fetch,
    URL,
    AbortSignal,
    Date: { now: () => clock.now, parse: Date.parse },
    console: { info() {}, warn() {} },
  });
  window.SIYADAO_REPOSITORY = null;
  return { api: window.SiyadaoDownloads, window, clock };
}

test('按发布时间识别 preview，各平台取最近可用包并标注自己的版本', async () => {
  const mac = { ...asset('macos-arm64.dmg'), browser_download_url: 'https://github.com/demo/product/releases/download/v2/siyadao-macos-arm64.dmg' };
  const windows = asset('windows-x64.zip');
  const invalid = asset('linux-x64.AppImage');
  const { api, window } = createContext(async () => ({
    ...response([]), json: async () => [
      { tag_name: 'v1', published_at: '2026-09-06T00:00:00Z', draft: false, prerelease: false, assets: [windows, asset('macos-arm64.dmg')] },
      { tag_name: 'v2', published_at: '2026-09-07T00:00:00Z', draft: false, prerelease: true, assets: [mac, invalid] },
    ],
  }));
  window.SIYADAO_REPOSITORY = 'demo/product';
  const release = await api.getRelease();
  assert.equal(release.version, 'v2');
  assert.equal(release.assets['macos-arm64'].version, 'v2');
  assert.equal(release.assets['windows-x64'].version, 'v1');
  assert.match(release.assets['windows-x64'].url, /\/download\/v1\//);
  assert.equal(release.assets['linux-x64'], undefined);
});

function asset(name) {
  return {
    name: `siyadao-${name}`,
    size: 1024,
    browser_download_url: `https://github.com/demo/product/releases/download/v1/siyadao-${name}`,
  };
}

function response(assets) {
  return {
    ok: true,
    status: 200,
    json: async () => ([{ tag_name: 'v1', assets, draft: false, prerelease: false }]),
  };
}

test('官网自动读取公开版本列表而非仅支持稳定版的 latest 接口', async () => {
  const urls = [];
  const { api, window } = createContext(async (url) => {
    urls.push(url);
    return {
      ...response([]),
      json: async () => ([{ tag_name: 'v1', draft: false, prerelease: true, assets: [asset('macos-arm64.dmg'), asset('windows-x64.zip')] }]),
    };
  });
  window.SIYADAO_REPOSITORY = 'demo/product';
  const release = await api.getRelease();
  assert.deepEqual(urls, ['https://api.github.com/repos/demo/product/releases?per_page=20']);
  assert.equal(release.prerelease, true);
  assert.equal(release.releaseUrl, 'https://github.com/demo/product/releases/tag/v1');
  assert.match(release.assets['windows-x64'].url, /\/releases\/download\/v1\/.*\.zip$/);
  assert.equal(release.assets['windows-arm64'], undefined);
  window.SIYADAO_REPOSITORY = 'demo/another';
  await api.getRelease();
  assert.equal(urls.length, 2);
});

test('草稿版本及与版本号不一致的附件不能用于下载', async () => {
  const { api, window } = createContext(async () => ({
    ...response([]),
    json: async () => ([{ tag_name: 'v2', draft: false, prerelease: true, assets: [asset('windows-x64.zip')] }]),
  }));
  window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal(Object.keys((await api.getRelease()).assets).length, 0);
  const draft = createContext(async () => ({
    ...response([]),
    json: async () => ([{ tag_name: 'v1', draft: true, prerelease: true, assets: [asset('macos-arm64.dmg')] }]),
  }));
  draft.window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal((await draft.api.getRelease()).status, 'empty');
});

test('临时断网保留上次有效版本并明确标记缓存状态', async () => {
  let calls = 0;
  const { api, window, clock } = createContext(async () => {
    if (++calls > 1) throw new Error('offline');
    return response([asset('macos-arm64.dmg')]);
  });
  window.SIYADAO_REPOSITORY = 'demo/product';
  const first = await api.getRelease();
  clock.now += 60001;
  const cached = await api.getRelease();
  assert.equal(calls, 2);
  assert.equal(cached.stale, true);
  assert.equal(cached.assets['macos-arm64'].url, first.assets['macos-arm64'].url);
});
