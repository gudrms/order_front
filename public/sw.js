if (!self.define) {
  let e,
    s = {};
  const i = (i, n) => (
    (i = new URL(i + '.js', n).href),
    s[i] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (n, c) => {
    const t =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[t]) return;
    let a = {};
    const d = (e) => i(e, t),
      f = { module: { uri: t }, exports: a, require: d };
    s[t] = Promise.all(n.map((e) => f[e] || d(e))).then((e) => (c(...e), a));
  };
}
define(['./workbox-c18c662b'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/static/chunks/176-eb35f000be02ad11.js',
          revision: 'eb35f000be02ad11',
        },
        {
          url: '/_next/static/chunks/186-d8287f1ee4b86bcb.js',
          revision: 'd8287f1ee4b86bcb',
        },
        {
          url: '/_next/static/chunks/409-3a286ec9422c21dc.js',
          revision: '3a286ec9422c21dc',
        },
        {
          url: '/_next/static/chunks/495-553b757dea2c38c8.js',
          revision: '553b757dea2c38c8',
        },
        {
          url: '/_next/static/chunks/4bd1b696-67e30520d621c4dd.js',
          revision: '67e30520d621c4dd',
        },
        {
          url: '/_next/static/chunks/899.1813981119fa1f8a.js',
          revision: '1813981119fa1f8a',
        },
        {
          url: '/_next/static/chunks/928-9092f8175d6408b6.js',
          revision: '9092f8175d6408b6',
        },
        {
          url: '/_next/static/chunks/966.1775eb621d8d3e09.js',
          revision: '1775eb621d8d3e09',
        },
        {
          url: '/_next/static/chunks/app/_global-error/page-a3d4f8e832675edd.js',
          revision: 'a3d4f8e832675edd',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-baebf4515cd2028f.js',
          revision: 'baebf4515cd2028f',
        },
        {
          url: '/_next/static/chunks/app/customer/cart/page-8fb5e7fc8e6e3f31.js',
          revision: '8fb5e7fc8e6e3f31',
        },
        {
          url: '/_next/static/chunks/app/customer/menu/page-22127e5d8de96093.js',
          revision: '22127e5d8de96093',
        },
        {
          url: '/_next/static/chunks/app/layout-c689e29c9bd10b7d.js',
          revision: 'c689e29c9bd10b7d',
        },
        {
          url: '/_next/static/chunks/app/page-15da2148a26c443d.js',
          revision: '15da2148a26c443d',
        },
        {
          url: '/_next/static/chunks/framework-d7de93249215fb06.js',
          revision: 'd7de93249215fb06',
        },
        {
          url: '/_next/static/chunks/main-76435924e79614c3.js',
          revision: '76435924e79614c3',
        },
        {
          url: '/_next/static/chunks/main-app-15507fdf2868fa08.js',
          revision: '15507fdf2868fa08',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/app-error-a3d4f8e832675edd.js',
          revision: 'a3d4f8e832675edd',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/forbidden-a3d4f8e832675edd.js',
          revision: 'a3d4f8e832675edd',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/global-error-1ca428fc7111db1b.js',
          revision: '1ca428fc7111db1b',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/not-found-a3d4f8e832675edd.js',
          revision: 'a3d4f8e832675edd',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/unauthorized-a3d4f8e832675edd.js',
          revision: 'a3d4f8e832675edd',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-ebf09869152f0f5b.js',
          revision: 'ebf09869152f0f5b',
        },
        {
          url: '/_next/static/css/f3ac1dc45adb3a38.css',
          revision: 'f3ac1dc45adb3a38',
        },
        {
          url: '/_next/static/media/4cf2300e9c8272f7-s.p.woff2',
          revision: '18bae71b1e1b2bb25321090a3b563103',
        },
        {
          url: '/_next/static/media/747892c23ea88013-s.woff2',
          revision: 'a0761690ccf4441ace5cec893b82d4ab',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/93f479601ee12b01-s.p.woff2',
          revision: 'da83d5f06d825c5ae65b7cca706cb312',
        },
        {
          url: '/_next/static/media/9610d9e46709d722-s.woff2',
          revision: '7b7c0ef93df188a852344fc272fc096b',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        {
          url: '/_next/static/naVerBZxX_dZoJGhViSNS/_buildManifest.js',
          revision: 'ff3ad5295b712f52c5d8fc053cff1414',
        },
        {
          url: '/_next/static/naVerBZxX_dZoJGhViSNS/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        {
          url: '/icons/apple-touch-icon.png',
          revision: '2c60f0ef98dc2e96f0ced615399515fd',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: '7af2c09359a9079e7d852032aa9197df',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: '36da5d9990c57e41f53ac0fae27bb421',
        },
        { url: '/manifest.json', revision: '3a0ff9d0c226430559bd6831b21f3cf3' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/swe-worker-5c72df51bb1f6ee0.js',
          revision: '76fdd3369f623a3edcf74ce2200bfdd0',
        },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 300 }),
        ],
      }),
      'GET'
    ),
    (self.__WB_DISABLE_DEV_LOGS = !0));
});
