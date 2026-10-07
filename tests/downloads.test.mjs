import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../downloads.js', import.meta.url), 'utf8');

function createContext(fetch, hostname = 'studio.siyadao.cn') {
  const window = { location: { hostname } };
  const clock = { now: 1000 };
  vm.runInNewContext(source, {
    window, fetch, URL, AbortSignal, TextDecoder,
    Date: { now: () => clock.now, parse: Date.parse },
    console: { info() {}, warn() {} },
  });
  return { api: window.SiyadaoDownloads, window, clock };
}

function asset(suffix, version = '0.1.1', github = true) {
  const name = `siyadao-v${version}-${suffix}`;
  return {
    name, size: 1024, sha256: 'ab'.repeat(32),
    sources: {
      official: `https://download.siyadao.cn/v${version}/${name}`,
      github: github ? `https://github.com/siyadao/studio/releases/download/v${version}/${name}` : null,
    },
  };
}

function release(assets = [], version = '0.1.1', published_at = '2026-10-07T00:00:00Z') {
  return { version, prerelease: version.includes('-'), published_at, notes: '更新说明', assets };
}

function response(releases = [], headers = {}) {
  return new Response(JSON.stringify(releases), { headers: { 'Content-Type': 'application/json', ...headers } });
}

test('初始化不请求，官网同源入口与本地官方 API 按需读取且不探测 GitHub', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return response([release([asset('macos-arm64.dmg')])]);
  };
  const production = createContext(fetch);
  assert.equal(calls.length, 0);
  await production.api.getRelease();
  const local = createContext(fetch, 'localhost');
  await local.api.getRelease();
  assert.deepEqual(calls.map((call) => call.url), [
    '/api/app/releases', 'https://studioapi.siyadao.cn/v1/app/releases',
  ]);
  for (const { options } of calls) {
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Accept, 'application/json');
  }
});

test('多个入口合并首次请求，成功结果缓存一分钟', async () => {
  let calls = 0;
  let finish;
  const { api, clock } = createContext(() => {
    calls++;
    return new Promise((resolve) => { finish = resolve; });
  });
  const first = api.getRelease();
  const second = api.getRelease();
  assert.equal(calls, 1);
  finish(response([release([asset('macos-arm64.dmg')])]));
  assert.equal((await first).status, 'ready');
  await second;
  await api.getRelease();
  assert.equal(calls, 1);
  clock.now += 60001;
  const expired = api.getRelease();
  assert.equal(calls, 2);
  finish(response([release()]));
  await expired;
});

test('空列表是无公开版本并缓存，404 是接口失败而不是空版本', async () => {
  let calls = 0;
  const { api, clock } = createContext(async () => {
    return ++calls === 1 ? response() : new Response('', { status: 404 });
  });
  assert.equal((await api.getRelease()).status, 'empty');
  assert.equal((await api.getRelease()).status, 'empty');
  assert.equal(calls, 1);
  clock.now += 60001;
  const failed = await api.getRelease();
  assert.equal(failed.status, 'empty');
  assert.equal(failed.stale, true);
  const missing = createContext(async () => new Response('', { status: 404 }));
  assert.equal((await missing.api.getRelease()).status, 'unavailable');
});

test('失败不缓存且可以立即重试', async () => {
  let calls = 0;
  const { api } = createContext(async () => {
    if (++calls === 1) throw new Error('offline');
    return response([release()]);
  });
  assert.equal((await api.getRelease()).status, 'unavailable');
  assert.equal((await api.getRelease()).status, 'ready');
  assert.equal(calls, 2);
});

test('六平台主下载源为官网，保留可选 GitHub 备用与 SHA-256', async () => {
  const assets = [
    asset('macos-arm64.dmg'), asset('macos-x64.dmg'),
    asset('windows-x64-setup.exe'), asset('windows-arm64.msi'),
    asset('linux-x64.AppImage'), asset('linux-arm64.deb', '0.1.1', false),
  ];
  const { api } = createContext(async () => response([release(assets)]));
  const result = await api.getRelease();
  assert.equal(Object.keys(result.assets).length, 6);
  for (const platform of api.platforms) {
    const selected = result.assets[platform.id];
    assert.equal(selected.sources.official, `https://download.siyadao.cn/v0.1.1/${selected.name}`);
    assert.equal(selected.sha256, 'ab'.repeat(32));
  }
  assert.equal(result.assets['linux-arm64'].sources.github, null);
  assert.equal(result.assets['macos-arm64'].sources.github,
    `https://github.com/siyadao/studio/releases/download/v0.1.1/${assets[0].name}`);
});

test('同版本优先选择安装包而不是 ZIP，未发布架构不可下载', async () => {
  const assets = [
    asset('macos-arm64.zip'), asset('macos-arm64.pkg'), asset('macos-arm64.dmg'),
    asset('windows-x64.zip'), asset('windows-x64.msi'), asset('windows-x64-setup.exe'),
    asset('linux-x64.tar.gz'), asset('linux-x64.rpm'), asset('linux-x64.deb'), asset('linux-x64.AppImage'),
  ];
  const { api } = createContext(async () => response([release(assets)]));
  const result = await api.getRelease();
  assert.match(result.assets['macos-arm64'].name, /\.dmg$/);
  assert.match(result.assets['windows-x64'].name, /-setup\.exe$/);
  assert.match(result.assets['linux-x64'].name, /\.AppImage$/);
  assert.equal(result.assets['windows-arm64'], undefined);
});

test('按发布时间含时区排序，各平台保留自己的最新可用版本', async () => {
  const releases = [
    release([asset('macos-arm64.dmg'), asset('windows-x64.zip')], '0.1.1', '2026-10-07T00:00:00Z'),
    release([asset('macos-arm64.dmg', '0.1.2-preview.1')], '0.1.2-preview.1', '2026-10-07T09:00:00+08:00'),
  ];
  const { api } = createContext(async () => response(releases));
  const result = await api.getRelease();
  assert.equal(result.version, '0.1.2-preview.1');
  assert.equal(result.prerelease, true);
  assert.equal(result.assets['macos-arm64'].version, '0.1.2-preview.1');
  assert.equal(result.assets['windows-x64'].version, '0.1.1');
  assert.equal(result.releaseUrl, 'https://github.com/siyadao/studio/releases/tag/v0.1.2-preview.1');
});

test('服务端过期缓存显式标记且允许立即刷新', async () => {
  let calls = 0;
  const { api } = createContext(async () => response([release()], {
    'X-Release-Cache': ++calls === 1 ? 'STALE' : 'HIT',
  }));
  assert.equal((await api.getRelease()).stale, true);
  assert.equal((await api.getRelease()).stale, false);
  assert.equal(calls, 2);
});

test('刷新断网保留上次有效版本并标记缓存，恢复后取新版本', async () => {
  let calls = 0;
  const { api, clock } = createContext(async () => {
    calls++;
    if (calls === 2) throw new Error('offline');
    return response([release([asset('macos-arm64.dmg')])]);
  });
  const first = await api.getRelease();
  clock.now += 60001;
  const cached = await api.getRelease();
  assert.equal(cached.stale, true);
  assert.equal(cached.assets['macos-arm64'].sources.official, first.assets['macos-arm64'].sources.official);
  assert.equal((await api.getRelease()).stale, false);
  assert.equal(calls, 3);
});

const invalidSources = {
  '外部域名': 'https://untrusted.example/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
  'HTTP': 'http://download.siyadao.cn/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
  '认证信息': 'https://user:pass@download.siyadao.cn/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
  '其他端口': 'https://download.siyadao.cn:8443/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
  '其他版本': 'https://download.siyadao.cn/v0.1.2/siyadao-v0.1.1-macos-arm64.dmg',
  '其他文件': 'https://download.siyadao.cn/v0.1.1/other.dmg',
  '查询参数': 'https://download.siyadao.cn/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg?download=1',
  '片段': 'https://download.siyadao.cn/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg#download',
  '路径穿越': 'https://download.siyadao.cn/v0.1.1/../v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
};
for (const [name, url] of Object.entries(invalidSources)) {
  test(`拒绝官方源${name}，不静默改用 GitHub`, async () => {
    const item = asset('macos-arm64.dmg');
    item.sources.official = url;
    const { api } = createContext(async () => response([release([item])]));
    assert.equal((await api.getRelease()).status, 'unavailable');
  });
}

test('拒绝 GitHub 错误仓库、版本、文件、缺失字段，null 是明确无备用源', async () => {
  for (const github of [
    'https://github.com/siyadao/ai-studio/releases/download/v0.1.1/siyadao-v0.1.1-macos-arm64.dmg',
    'https://github.com/siyadao/studio/releases/download/v0.1.2/siyadao-v0.1.1-macos-arm64.dmg',
    'https://github.com/siyadao/studio/releases/download/v0.1.1/other.dmg',
    undefined, '',
  ]) {
    const item = asset('macos-arm64.dmg');
    item.sources.github = github;
    const { api } = createContext(async () => response([release([item])]));
    assert.equal((await api.getRelease()).status, 'unavailable');
  }
});

test('SHA-256 必须为 64 位十六进制，大小为正整数且不超过 1 GiB', async () => {
  for (const patch of [
    { sha256: undefined }, { sha256: 'sha256:' + 'ab'.repeat(32) },
    { sha256: 'ab'.repeat(31) }, { sha256: 'z'.repeat(64) },
    { size: 0 }, { size: -1 }, { size: 1.5 }, { size: '1024' }, { size: 1024 ** 3 + 1 },
  ]) {
    const { api } = createContext(async () => response([release([{ ...asset('macos-arm64.dmg'), ...patch }])]));
    assert.equal((await api.getRelease()).status, 'unavailable');
  }
  const { api } = createContext(async () => response([release([
    { ...asset('macos-arm64.dmg'), sha256: 'AB'.repeat(32), size: 1024 ** 3 },
  ])]));
  assert.equal((await api.getRelease()).status, 'ready');
});

test('拒绝旧契约、错误版本渠道、无效日期、缺失更新说明和重复发布', async () => {
  for (const data of [
    { version: '0.1.1' }, [{ tag_name: 'v0.1.1', draft: false, assets: [] }],
    [release([], 'v0.1.1')], [release([], '01.1.1')], [release([], '0.1.1-preview.01')],
    [{ ...release([], '0.1.1-preview'), prerelease: false }],
    [{ ...release(), prerelease: true }], [{ ...release(), notes: undefined }],
    [release([], '0.1.1', '2026-02-30T00:00:00Z')],
    [release([], '0.1.1', '2026-10-07')],
    [release([], '0.1.1', '2026-10-07T24:00:00Z')],
    [release(), release()],
  ]) {
    const { api } = createContext(async () => response(data));
    assert.equal((await api.getRelease()).status, 'unavailable');
  }
});

test('拒绝错误文件名、版本不匹配、非安装包与重复附件', async () => {
  for (const assets of [
    [asset('macos-arm64.dmg', '0.1.2')], [asset('macos-arm64-debug.dmg')],
    [asset('macos-arm64.dmg.sha256')], [asset('windows-x64.exe')],
    [asset('macos-universal.dmg')], [asset('linux-amd64.deb')],
    [asset('macos-arm64.dmg'), asset('macos-arm64.dmg')],
  ]) {
    const { api } = createContext(async () => response([release(assets)]));
    assert.equal((await api.getRelease()).status, 'unavailable');
  }
});

test('版本与附件数量有界，超量响应拒绝', async () => {
  for (const data of [
    Array.from({ length: 21 }, (_, index) => release([], `0.1.${index}`)),
    [release(Array.from({ length: 65 }, () => asset('macos-arm64.dmg')))],
  ]) {
    const { api } = createContext(async () => response(data));
    assert.equal((await api.getRelease()).status, 'unavailable');
  }
});

test('响应头和实际流均限制 2 MiB，流越界会取消读取', async () => {
  const oversizedHeader = createContext(async () => response([], { 'Content-Length': String(2 * 1024 * 1024 + 1) }));
  assert.equal((await oversizedHeader.api.getRelease()).status, 'unavailable');
  let cancelled = false;
  const oversizedBody = createContext(async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)); },
    cancel() { cancelled = true; },
  })));
  assert.equal((await oversizedBody.api.getRelease()).status, 'unavailable');
  assert.equal(cancelled, true);
});

test('流式 UTF-8 分块支持中文说明，畸形 JSON 不可下载', async () => {
  const bytes = new TextEncoder().encode(JSON.stringify([release()]));
  const { api } = createContext(async () => new Response(new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  })));
  assert.equal((await api.getRelease()).status, 'ready');
  const invalid = createContext(async () => new Response('{invalid'));
  assert.equal((await invalid.api.getRelease()).status, 'unavailable');
});

test('反馈仓库设置只影响 Issues，不改变官方版本 API', async () => {
  const urls = [];
  const { api, window } = createContext(async (url) => { urls.push(url); return response(); });
  assert.equal(api.getFeedbackUrl(), 'https://github.com/siyadao/studio/issues/new/choose');
  window.SIYADAO_REPOSITORY = '../secret';
  assert.equal(api.getFeedbackUrl(), null);
  await api.getRelease();
  assert.deepEqual(urls, ['/api/app/releases']);
});
