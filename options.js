const APP_KEY = '***REMOVED***';

let selectedSystemid = null;

async function loadSavedLibrary() {
  const { systemid } = await chrome.storage.sync.get('systemid');
  selectedSystemid = systemid || null;
}

document.getElementById('searchBtn').addEventListener('click', async () => {
  const pref = document.getElementById('pref').value.trim();
  const city = document.getElementById('city').value.trim();
  const errorEl = document.getElementById('error');
  const listEl = document.getElementById('libraryList');

  errorEl.textContent = '';
  listEl.innerHTML = '<div style="padding:8px;color:#666;">検索中...</div>';

  try {
    const url = `https://api.calil.jp/library?pref=${encodeURIComponent(pref)}&city=${encodeURIComponent(city)}&format=json&callback=`;
    const res = await fetch(url);
    const libraries = await res.json();

    if (!libraries || libraries.length === 0) {
      listEl.innerHTML = '<div style="padding:8px;color:#666;">図書館が見つかりませんでした</div>';
      return;
    }

    listEl.innerHTML = '';
    for (const lib of libraries) {
      const item = document.createElement('div');
      item.className = 'library-item';
      if (lib.systemid === selectedSystemid) item.classList.add('selected');
      item.textContent = lib.formal || lib.short || lib.systemid;
      item.dataset.systemid = lib.systemid;
      item.dataset.libname = lib.formal || lib.short || lib.systemid;
      item.dataset.libkey = lib.libkey || lib.systemid;
      item.addEventListener('click', () => selectLibrary(item, lib));
      listEl.appendChild(item);
    }
  } catch (e) {
    listEl.innerHTML = '';
    errorEl.textContent = `エラー: ${e.message}`;
  }
});

async function selectLibrary(item, lib) {
  // 全アイテムのselectedを解除
  document.querySelectorAll('.library-item').forEach(el => el.classList.remove('selected'));
  item.classList.add('selected');
  selectedSystemid = lib.systemid;

  await chrome.storage.sync.set({
    systemid: lib.systemid,
    libraryName: lib.formal || lib.short || lib.systemid,
    libkey: lib.libkey || lib.systemid,
  });

  document.getElementById('status').textContent = `「${lib.formal || lib.short}」を保存しました`;
}

loadSavedLibrary();
