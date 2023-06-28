document.getElementById('find').addEventListener('click', async function () {
    console.log('find_btnがクリックされました')
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log(tab)
    if (tab) {
        // content scriptを実行
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    }

    // ISBNをcontent scriptから取得
    chrome.tabs.sendMessage(tab.id, { method: "getISBN" }, function (response) {
        console.log('in sendMessage()')
        if (response.method == "getISBN") {
            const isbn = response.isbn;
            // ISBNとともにcontent scriptのgetLibraryDataを呼び出し
            chrome.tabs.sendMessage(tab.id, { method: "getLibraryData", isbn: isbn }, function (response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                } else {
                    if (response.method == "getLibraryData") {
                        console.log(response.data);
                    }
                }
            });
            return true;
        }
    });
});
