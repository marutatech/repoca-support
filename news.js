/**
 * news.html — notices.json を唯一の情報源として一覧描画する。
 * title/body は textContent のみ（innerHTML 禁止）。
 */
(function () {
  'use strict';

  var NOTICES_URL = 'notices.json';
  var FETCH_TIMEOUT_MS = 8000;

  function isSafeHttpUrl(value) {
    var url = String(value || '').trim();
    if (!url) return false;
    try {
      var parsed = new URL(url, window.location.href);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function normalizeExternalLink(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var url = String(raw.url || '').trim();
    if (!isSafeHttpUrl(url)) return null;
    var label = String(raw.label || '').trim() || '詳しく見る';
    return { label: label, url: url };
  }

  function normalizeNotice(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var id = String(raw.id || '').trim();
    var date = String(raw.date || '').trim();
    var title = String(raw.title || '').trim();
    if (!id || !date || !title) return null;
    var notice = {
      id: id,
      date: date,
      title: title,
      body: raw.body != null ? String(raw.body) : '',
      type: raw.type != null ? String(raw.type).trim().toLowerCase() : '',
      platform: 'all',
      externalLink: normalizeExternalLink(raw.externalLink),
      storeLinks: { ios: '', android: '' },
    };
    var platform = String(raw.platform || 'all').trim().toLowerCase();
    if (platform === 'ios' || platform === 'android' || platform === 'all') {
      notice.platform = platform;
    }
    if (raw.storeLinks && typeof raw.storeLinks === 'object') {
      var ios = String(raw.storeLinks.ios || '').trim();
      var android = String(raw.storeLinks.android || '').trim();
      if (isSafeHttpUrl(ios)) notice.storeLinks.ios = ios;
      if (isSafeHttpUrl(android)) notice.storeLinks.android = android;
    }
    return notice;
  }

  function parsePayload(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (!Array.isArray(raw.notices)) return null;
    var items = [];
    var seen = {};
    for (var i = 0; i < raw.notices.length; i++) {
      var n = normalizeNotice(raw.notices[i]);
      if (!n || seen[n.id]) continue;
      seen[n.id] = true;
      items.push(n);
      if (items.length >= 100) break;
    }
    items.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      if (a.id !== b.id) return a.id < b.id ? 1 : -1;
      return 0;
    });
    return items;
  }

  function typeLabel(type) {
    if (type === 'partner') return 'メーカーからのお知らせ';
    if (type === 'update') return 'アップデート';
    if (type === 'maintenance') return 'メンテナンス';
    if (type === 'campaign') return 'キャンペーン';
    return '';
  }

  function appendText(el, text) {
    el.textContent = text == null ? '' : String(text);
  }

  function createLink(label, url) {
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    appendText(a, label);
    return a;
  }

  function renderNotice(notice) {
    var article = document.createElement('article');
    article.className = 'news-article notice-item';

    var label = typeLabel(notice.type);
    if (label) {
      var badge = document.createElement('p');
      badge.className = 'notice-type';
      appendText(badge, label);
      article.appendChild(badge);
    }

    var time = document.createElement('time');
    time.setAttribute('datetime', notice.date);
    appendText(time, notice.date);
    article.appendChild(time);

    var h2 = document.createElement('h2');
    appendText(h2, notice.title);
    article.appendChild(h2);

    if (notice.body) {
      var body = document.createElement('p');
      body.className = 'notice-body';
      appendText(body, notice.body);
      article.appendChild(body);
    }

    if (notice.platform === 'ios' || notice.platform === 'android') {
      var plat = document.createElement('p');
      plat.className = 'notice-platform';
      appendText(plat, notice.platform === 'ios' ? '対象: iOS' : '対象: Android');
      article.appendChild(plat);
    }

    var actions = document.createElement('div');
    actions.className = 'notice-actions';
    var hasAction = false;

    if (notice.externalLink) {
      actions.appendChild(
        createLink(notice.externalLink.label, notice.externalLink.url)
      );
      hasAction = true;
    }
    if (notice.storeLinks.ios) {
      actions.appendChild(createLink('App Store', notice.storeLinks.ios));
      hasAction = true;
    }
    if (notice.storeLinks.android) {
      actions.appendChild(createLink('Google Play', notice.storeLinks.android));
      hasAction = true;
    }
    if (hasAction) article.appendChild(actions);

    return article;
  }

  function showMessage(root, message) {
    root.textContent = '';
    var p = document.createElement('p');
    p.className = 'notices-status notices-status-error';
    appendText(p, message);
    root.appendChild(p);
  }

  function renderList(root, notices) {
    root.textContent = '';
    if (!notices.length) {
      showMessage(root, '現在表示できるお知らせはありません。');
      return;
    }
    for (var i = 0; i < notices.length; i++) {
      root.appendChild(renderNotice(notices[i]));
    }
  }

  function fetchNotices() {
    var controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        try {
          controller.abort();
        } catch (e) {}
      }, FETCH_TIMEOUT_MS);
    }

    return fetch(NOTICES_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined,
      cache: 'no-cache',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var items = parsePayload(json);
        if (!items) throw new Error('invalid payload');
        return items;
      })
      .finally(function () {
        if (timer != null) clearTimeout(timer);
      });
  }

  function main() {
    var root = document.getElementById('notices-root');
    if (!root) return;
    fetchNotices()
      .then(function (items) {
        renderList(root, items);
      })
      .catch(function () {
        showMessage(root, '現在お知らせを取得できません。時間をおいて再度お試しください。');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
