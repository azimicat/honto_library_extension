document.getElementById('find').addEventListener('click', async function () {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        // content scriptを実行
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    }

    chrome.tabs.sendMessage(tab.id, { method: "getIsbnAndLibraryData" }, function (getIsbnAndLibraryResponse) {
        console.log('in sendMessage()')
        console.log(getIsbnAndLibraryResponse)
        return true;
    })
});
