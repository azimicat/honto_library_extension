(async () => {
  const { libraryName } = await chrome.storage.sync.get('libraryName');
  const contentEl = document.getElementById('content');

  if (libraryName) {
    contentEl.innerHTML = `設定中の図書館: <span id="libraryName">${libraryName}</span>`;
  } else {
    contentEl.innerHTML = `図書館が未設定です。<br><a href="#" id="optionsLink">オプションページで設定する</a>`;
    document.getElementById('optionsLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
})();
