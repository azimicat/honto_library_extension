(async () => {
  const { systemid, libraryName } = await chrome.storage.sync.get(['systemid', 'libraryName']);

  if (!systemid) {
    const notice = document.createElement('div');
    notice.className = 'hle-notice';
    notice.textContent = '図書館を設定してください（拡張機能のオプションページ）';
    document.body.prepend(notice);
    return;
  }

  const items = document.querySelectorAll('.stContents');
  console.log('[honto-lib] .stContents 要素数:', items.length);

  // バッジを先に生成しつつURLを収集
  const tasks = [];
  for (const item of items) {
    const anchor = item.querySelector('a[href*="/netstore/"]') || item.querySelector('a[href*="honto.jp"]');
    const url = anchor ? anchor.href : null;
    if (!url) continue;

    const badge = document.createElement('div');
    badge.className = 'hle-badge hle-loading';
    badge.textContent = '図書館を確認中...';
    item.appendChild(badge);

    tasks.push({ url, badge });
  }

  if (tasks.length === 0) return;

  console.log('[honto-lib] 一括リクエスト件数:', tasks.length);

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: 'checkLibraryByUrls',
      urls: tasks.map(t => t.url),
      systemid,
    });
  } catch (e) {
    console.log('[honto-lib] 例外:', e);
    for (const { badge } of tasks) {
      badge.className = 'hle-badge hle-error';
      badge.textContent = '確認エラー';
    }
    return;
  }

  if (!response.success) {
    console.log('[honto-lib] エラー:', response.error);
    for (const { badge } of tasks) {
      badge.className = 'hle-badge hle-error';
      badge.textContent = response.error || '確認エラー';
    }
    return;
  }

  for (const { url, badge } of tasks) {
    const result = response.results[url];

    if (!result || result.error) {
      badge.className = 'hle-badge hle-error';
      badge.textContent = result?.error || 'ISBNが見つかりません';
      continue;
    }

    const { isbn, bookData } = result;
    console.log('[honto-lib] 抽出ISBN:', isbn);
    console.log('[honto-lib] APIレスポンス (isbn=' + isbn + '):', JSON.stringify(bookData));

    if (!bookData || bookData.status === 'Error') {
      badge.className = 'hle-badge hle-none';
      badge.textContent = `${libraryName || '図書館'} に蔵書なし`;
      continue;
    }

    const libkeys = bookData.libkey || {};
    const libkeyEntries = Object.entries(libkeys);

    if (libkeyEntries.length === 0) {
      badge.className = 'hle-badge hle-none';
      badge.textContent = `${libraryName || '図書館'} に蔵書なし`;
      continue;
    }

    const availableEntry = libkeyEntries.find(([, v]) => v === '貸出可' || v === '蔵書あり');
    const firstKey = availableEntry ? availableEntry[0] : libkeyEntries[0][0];
    const firstStatus = availableEntry ? availableEntry[1] : libkeyEntries[0][1];
    const calilUrl = `https://calil.jp/book/${isbn}/library/${firstKey}`;
    const reserveurl = bookData.reserveurl;

    if (availableEntry) {
      badge.className = 'hle-badge hle-ok';
      const link = document.createElement('a');
      link.href = reserveurl || calilUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${libraryName || '図書館'} に蔵書あり（${firstStatus}）`;
      badge.textContent = '';
      badge.appendChild(link);
    } else if (reserveurl) {
      badge.className = 'hle-badge hle-reservation';
      const link = document.createElement('a');
      link.href = reserveurl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${libraryName || '図書館'} に蔵書あり（${firstStatus}）→予約`;
      badge.textContent = '';
      badge.appendChild(link);
    } else {
      badge.className = 'hle-badge hle-reservation';
      const link = document.createElement('a');
      link.href = calilUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${libraryName || '図書館'} に蔵書あり（${firstStatus}）`;
      badge.textContent = '';
      badge.appendChild(link);
    }
  }
})();
