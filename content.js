/**
 * Find ISBN on the page
 * @returns string | null
 */
function findISBN() {
  const bodyTextElement = document.querySelector("ul.stItemData > li:nth-last-child(1)");
  if (!bodyTextElement) {
    console.error('ISBN情報を含むエレメントが見つかりません！');
    return null;
  }
  const bodyText = bodyTextElement.textContent;
  const isbn = bodyText.replace("ISBN：", "").replace(/-/g, "");
  return isbn;
}


/**
 * storage上のsystemidを取得する
 * @returns Promise<string | null>
 */
function getSystemId() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('systemid', function (data) {
      if (chrome.runtime.lastError) {
        console.error('systemidが指定されていません！')
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.systemid);
      }
    });
  });
}

/**
 * 蔵書データを取得する
 * @param {int} isbn
 */
async function getLibraryData() {
  const isbn = findISBN()
  const systemid = await getSystemId();
  const APP_KEY = '1516cf2b8ea62e23051f757b90fcdedf'

  return new Promise((resolve, reject) => {
    if (systemid !== null && isbn > 0) {
      fetch(`https://api.calil.jp/check?appkey=${APP_KEY}&isbn=${isbn}&systemid=${systemid}&format=json`)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          let libraryDataElement = document.createElement('div');
          libraryDataElement.innerHTML = `
          <h1>${data.title}</h1>
          <h2>${data.author}</h2>
          <p>${data.description}</p>
        `;
          // 表示
          document.body.appendChild(libraryDataElement);
          resolve(data);  // fetchからの応答を解決します。
        })
        .catch(error => {
          console.error(error);
          reject(error);  // fetchからのエラーを拒否します。
        });
    } else {
      const errorMessage = `systemid: ${systemid} または isbn: ${isbn} が不正です！`;
      console.error(errorMessage);
      reject(new Error(errorMessage));  // 独自のエラーメッセージを拒否します。
    }
  });
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.method === "getLibraryData") {
    const data = await getLibraryData(request.isbn);
    console.log(`Retrieved library data: ${data}`);
    sendResponse({ method: "getLibraryData", data: data });
  } else if (request.method === "getISBN") {
    // ISBNの取得
    const isbn = findISBN();
    console.log(isbn)
    if (isbn) {
      // ISBNをポップアップに返す
      sendResponse({ method: "getISBN", isbn: isbn });
    } else {
      // エラーが発生した場合
      sendResponse({ method: "getISBN", error: "ISBN could not be found." });
    }
  } else if (request.method === "getSystemId") {
    // systemIdの取得
    const systemId = await getSystemId();
    if (systemId) {
      // systemIdをポップアップに返す
      sendResponse({ method: "getSystemId", systemId: systemId });
    } else {
      // エラーが発生した場合
      sendResponse({ method: "getSystemId", error: "systemId could not be found." });
    }
  }
  return true;  // 応答を非同期に保持する
});
