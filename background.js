chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    console.log('background.js L10')
    console.log(request)
    if (request.method === "getIsbnAndLibraryData") {
        console.log(`called getIsbnAndLibraryData()`);
    }
});
