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

test('多个入口合并首次请求，成功结果缓存五分钟', async () => {
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
  clock.now += 300001;
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
    Date: { now: () => clock.now },
    console: { info() {}, warn() {} },
  });
  window.SIYADAO_REPOSITORY = null;
  window.SIYADAO_RELEASE_MANIFEST = null;
  return { api: window.SiyadaoDownloads, window, clock };
}

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
    json: async () => ({ tag_name: 'v1', assets, draft: false, prerelease: false }),
  };
}

test('官网读取同源测试版清单，平台链接直接指向安装包', async () => {
  const urls = [];
  const { api, window } = createContext(async (url) => {
    urls.push(url);
    return {
      ...response([]),
      json: async () => ({ tag_name: 'v1', draft: false, prerelease: true, assets: [asset('macos-arm64.dmg'), asset('windows-x64.zip')] }),
    };
  });
  window.SIYADAO_REPOSITORY = 'demo/product';
  window.SIYADAO_RELEASE_MANIFEST = 'public/releases/v1.json';
  const release = await api.getRelease();
  assert.deepEqual(urls, ['public/releases/v1.json']);
  assert.equal(release.prerelease, true);
  assert.equal(release.releaseUrl, 'https://github.com/demo/product/releases/tag/v1');
  assert.match(release.assets['windows-x64'].url, /\/releases\/download\/v1\/.*\.zip$/);
  assert.equal(release.assets['windows-arm64'], undefined);
  window.SIYADAO_RELEASE_MANIFEST = 'public/releases/v2.json';
  await api.getRelease();
  assert.equal(urls.length, 2);
});

test('草稿版本及与版本号不一致的附件不能用于下载', async () => {
  const { api, window } = createContext(async () => ({
    ...response([]),
    json: async () => ({ tag_name: 'v2', draft: false, prerelease: true, assets: [asset('windows-x64.zip')] }),
  }));
  window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal(Object.keys((await api.getRelease()).assets).length, 0);
  const draft = createContext(async () => ({
    ...response([]),
    json: async () => ({ tag_name: 'v1', draft: true, prerelease: true, assets: [asset('macos-arm64.dmg')] }),
  }));
  draft.window.SIYADAO_REPOSITORY = 'demo/product';
  assert.equal((await draft.api.getRelease()).status, 'unavailable');
});
