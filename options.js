// options.js
const prefInput = document.getElementById('pref-input');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const librariesList = document.getElementById('libraries-list');

searchButton.addEventListener('click', async () => {
    const pref = prefInput.value;
    const city = cityInput.value;

    try {
        const response = await fetch(`https://api.calil.jp/library?pref=${pref}&city=${city}&format=json&callback=`);
        const libraries = await response.json();

        librariesList.innerHTML = ''; // 一覧をクリア

        libraries.forEach(library => {
            const li = document.createElement('li');
            li.textContent = library.formal;
            li.addEventListener('click', () => {
                console.log(`選択した図書館: ${library.formal}`);
                // 選択した図書館のsystemIdを保存
                chrome.storage.sync.set({ systemid: library.systemid }, () => {
                    console.log(`選択した図書館: ${library.formal}, systemid: ${library.systemid}`);
                });
            });

            librariesList.appendChild(li);
        });
    } catch (error) {
        console.error(error);
    }
});
