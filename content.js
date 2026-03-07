(async () => {
  const { systemid, libraryName, libkey } = await chrome.storage.sync.get(['systemid', 'libraryName', 'libkey']);

  if (!systemid) {
    const notice = document.createElement('div');
    notice.className = 'hle-notice';
    notice.textContent = '図書館を設定してください（拡張機能のオプションページ）';
    document.body.prepend(notice);
    return;
  }

  const items = document.querySelectorAll('.stContents');
  console.log('[honto-lib] .stContents 要素数:', items.length);

  for (const item of items) {
    // 詳細ページへのリンクURLを取得
    const anchor = item.querySelector('a[href*="/netstore/"]') || item.querySelector('a[href*="honto.jp"]');
    const url = anchor ? anchor.href : null;
    console.log('[honto-lib] 詳細URL:', url);
    if (!url) continue;

    const badge = document.createElement('div');
    badge.className = 'hle-badge hle-loading';
    badge.textContent = '図書館を確認中...';
    item.appendChild(badge);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'checkLibraryByUrl',
        url,
        systemid,
      });

      if (!response.success) {
        console.log('[honto-lib] APIエラー:', response.error);
        badge.className = 'hle-badge hle-error';
        badge.textContent = response.error || '確認エラー';
        continue;
      }

      const isbn = response.isbn;
      console.log('[honto-lib] 抽出ISBN:', isbn);
      console.log('[honto-lib] APIレスポンス (isbn=' + isbn + '):', JSON.stringify(response.data));
      const bookData = response.data.books?.[isbn]?.[systemid];
      if (!bookData || bookData.status === 'Error') {
        badge.className = 'hle-badge hle-none';
        badge.textContent = `${libraryName || '図書館'} に蔵書なし`;
        continue;
      }

      // libkey: { "図書館名": "貸出可" | "貸出中" | "蔵書なし" | ... }
      const libkeys = bookData.libkey || {};
      const libkeyEntries = Object.entries(libkeys);

      if (libkeyEntries.length === 0) {
        badge.className = 'hle-badge hle-none';
        badge.textContent = `${libraryName || '図書館'} に蔵書なし`;
        continue;
      }

      // 貸出可の館を優先、なければ最初の館を使ってリンク先を決定
      const availableEntry = libkeyEntries.find(([, v]) => v === '貸出可' || v === '蔵書あり');
      const firstKey = availableEntry ? availableEntry[0] : libkeyEntries[0][0];
      const firstStatus = availableEntry ? availableEntry[1] : libkeyEntries[0][1];
      const calilUrl = `https://calil.jp/book/${isbn}/library/${firstKey}`;
      const reserveurl = bookData.reserveurl;

      if (availableEntry) {
        badge.className = 'hle-badge hle-ok';
        const link = document.createElement('a');
        link.href = calilUrl;
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
    } catch (e) {
      console.log('[honto-lib] 例外:', e);
      badge.className = 'hle-badge hle-error';
      badge.textContent = '確認エラー';
    }
  }
})();
