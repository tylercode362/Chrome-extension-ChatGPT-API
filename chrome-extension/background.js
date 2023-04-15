document.getElementById('toggle').addEventListener('click', () => {
  chrome.storage.sync.get(['enabled'], (result) => {
    const isEnabled = !result.enabled;
    chrome.storage.sync.set({ enabled: isEnabled }, () => {
      document.getElementById('toggle').innerText = isEnabled ? 'Disable' : 'Enable';
    });
  });
});
