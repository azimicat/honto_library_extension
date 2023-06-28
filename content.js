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
async function getLibraryData(isbn) {
  console.log('content.js L39 -- getLibraryData()')
  const systemid = await getSystemId();
  const APP_KEY = '***REMOVED***'

  return new Promise((resolve, reject) => {
    if (systemid !== null && isbn > 0) {
      console.log('content.js L45')
      const url = `https://api.calil.jp/check?appkey=${APP_KEY}&isbn=${isbn}&systemid=${systemid}&format=json&callback=`;
      console.log(url)
      fetch(url)
        .then(response => {
          console.log(response)
          response.json()
        })
        .then(data => {
          console.log('content.js L54')
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

async function getIsbnAndLibraryData() {
  const isbn = await findISBN();
  await getLibraryData(isbn)
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(request)
  if (request.method === "getIsbnAndLibraryData") {
    await getIsbnAndLibraryData();
    console.log(`Retrieved getIsbnAndLibraryData`);
    sendResponse({ method: "getIsbnAndLibraryData" });
  }
  return true; // 応答を非同期に保持する
});
