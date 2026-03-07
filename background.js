const APP_KEY = '***REMOVED***';

async function checkWithPolling(isbn, systemid) {
  let url = `https://api.calil.jp/check?appkey=${APP_KEY}&isbn=${isbn}&systemid=${systemid}&format=json&callback=no`;
  while (true) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.continue === 0) return data;
    await new Promise(r => setTimeout(r, 2000));
    url = `https://api.calil.jp/check?appkey=${APP_KEY}&session=${data.session}&format=json&callback=no`;
  }
}

async function fetchIsbnFromHonto(url) {
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/97[89]\d{10}/);
  return match ? match[0] : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkLibrary') {
    const { isbn, systemid } = message;
    checkWithPolling(isbn, systemid)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'checkLibraryByUrl') {
    const { url, systemid } = message;
    fetchIsbnFromHonto(url)
      .then(isbn => {
        if (!isbn) return sendResponse({ success: false, error: 'ISBNが見つかりません' });
        return checkWithPolling(isbn, systemid).then(data => sendResponse({ success: true, isbn, data }));
      })
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
