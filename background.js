chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method === "getISBN") {
        console.log(`Received ISBN: ${request.isbn}`);
    }
});
