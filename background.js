const APP_KEY = '1516cf2b8ea62e23051f757b90fcdedf';

async function fetchIsbnFromHonto(url) {
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/97[89]\d{10}/);
  return match ? match[0] : null;
}

async function checkWithPollingBatch(isbns, systemid) {
  let url = `https://api.calil.jp/check?appkey=${APP_KEY}&isbn=${isbns.join(',')}&systemid=${systemid}&format=json`;
  while (true) {
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      const start = text.indexOf('(');
      const end = text.lastIndexOf(')');
      const json = (start !== -1 && end !== -1) ? text.slice(start + 1, end) : text;
      data = JSON.parse(json);
    } catch {
      throw new Error(`CALIL APIが不正なレスポンスを返しました: ${text.slice(0, 80)}`);
    }
    if (data.continue === 0) return data;
    await new Promise(r => setTimeout(r, 2000));
    url = `https://api.calil.jp/check?appkey=${APP_KEY}&session=${data.session}&format=json`;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkLibraryByUrls') {
    const { urls, systemid } = message;

    // 全URLから並列でISBNを取得
    Promise.all(urls.map(async url => {
      try {
        const isbn = await fetchIsbnFromHonto(url);
        return { url, isbn };
      } catch (e) {
        return { url, isbn: null, error: e.message };
      }
    }))
    .then(async pairs => {
      const results = {};

      // ISBNが取得できなかったURLの結果を先にセット
      for (const { url, isbn, error } of pairs) {
        if (!isbn) results[url] = { isbn: null, error: error || 'ISBNが見つかりません' };
      }

      const validPairs = pairs.filter(p => p.isbn);
      if (validPairs.length === 0) {
        sendResponse({ success: true, results });
        return;
      }

      // ISBNをまとめて1回のCALIL APIリクエスト（最大100件）
      const isbns = validPairs.map(p => p.isbn);
      const data = await checkWithPollingBatch(isbns, systemid);

      for (const { url, isbn } of validPairs) {
        results[url] = { isbn, bookData: data.books?.[isbn]?.[systemid] };
      }

      sendResponse({ success: true, results });
    })
    .catch(err => sendResponse({ success: false, error: err.message }));

    return true;
  }
});
