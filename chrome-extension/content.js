let socket;

// Create the floating control block
const floatingControl = document.createElement('div');
floatingControl.id = 'floating-control';
floatingControl.style.position = 'fixed';
floatingControl.style.top = '10px';
floatingControl.style.right = '10px';
floatingControl.style.zIndex = '10000';
floatingControl.style.backgroundColor = '#000000';
floatingControl.style.border = '1px solid #000';
floatingControl.style.padding = '10px';
floatingControl.style.borderRadius = '5px';

// Create the toggle button
const toggleButton = document.createElement('button');
toggleButton.innerText = 'Change Status';
toggleButton.style.backgroundColor = '#ffffff'
toggleButton.style.color = 'black'
toggleButton.style.border = '2px solid #000';
toggleButton.style.padding = '10px 10px';
toggleButton.addEventListener('click', toggleExtension);

floatingControl.appendChild(toggleButton);

const statusDisplay = document.createElement('div');
statusDisplay.id = 'status-display';

floatingControl.appendChild(statusDisplay);

const connectionStatus = document.createElement('div');
connectionStatus.id = 'connection-status';
floatingControl.appendChild(connectionStatus);

document.body.appendChild(floatingControl);

function updateConnectionStatus(status) {
  connectionStatus.innerText = status;
}

function toggleExtension() {
  chrome.storage.sync.get(['enabled'], (result) => {
    const newState = !result.enabled;
    chrome.storage.sync.set({ enabled: newState }, () => {
      console.log('Extension toggled:', newState);
      statusDisplay.innerText = newState ? 'Enabled' : 'Disabled';

      if (newState) {
        initializeSocket();
      } else {
        if (socket) {
          socket.close();
          socket = null;
          updateConnectionStatus('Disconnected');
        }
      }
    });
  });
}

let lastMessageID = '';

function findMatchingElements() {
  const regex = /dark:bg-/;
  const allElements = Array.from(document.querySelectorAll('main div.group'));
  const matchingElements = allElements
    .filter((element) =>
      Array.from(element.classList).some((className) => regex.test(className))
    )
    .filter((element) => !element.classList.contains('older')); // Ignore elements with the 'older' class
  return matchingElements;
}

function initializeSocket() {
  let requestId;

  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
    updateConnectionStatus('Connected');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Check if the received data has 'type' and 'message' properties
    if (data.type === 'new-message' && data.message) {
      const requestId = data.requestId;
      lastMessageID = data.requestId;
      const inputElement = document.querySelector('textarea');
      inputElement.value = data.message;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // You can submit the form by triggering a 'submit' event, or by clicking the submit button.
      const formElement = inputElement.closest('form');
      formElement.dispatchEvent(new Event('submit', { bubbles: true }));

      const matchingElements = findMatchingElements();
      const targetElement = matchingElements.reverse().find((element) => true);

      if (targetElement) {
        checkRegenerateResponseAndUpdate(targetElement, matchingElements.length, requestId);
      }
    }
  };

  socket.onclose = () => {
    console.log('Disconnected from WebSocket server');
    updateConnectionStatus('Disconnected');
  };

  socket.onerror = () => {
    console.log('Error occurred in WebSocket connection');
    updateConnectionStatus('Error');
  };
}

let previousElementCount = 0;
let content = "";

function checkRegenerateResponseAndUpdate(element, matchLength, requestId = lastMessageID) {
  const regenerateButtons = Array.from(document.body.querySelectorAll('main button'));
  const matchingButton = regenerateButtons.find((button) => {
    return (
      button.innerText === 'Regenerate response' ||
      Array.from(button.classList).includes('disabled:opacity-40')
    );
  });
  if (matchingButton) {
    const updatedContent = element.innerText;

    if (content == updatedContent) {
      return false;
    }
    content = element.innerText

    console.log('Sending updated content:', updatedContent);

    // Send the updated content to the local server
    if (socket && socket.readyState === WebSocket.OPEN) {
      previousElementCount = matchLength;
      socket.send(JSON.stringify({ type: 'response', requestId: requestId, content: updatedContent }));
    }
  } else {
    setTimeout(() => checkRegenerateResponseAndUpdate(element, matchLength, requestId), 100);
  }
}

const observer = new MutationObserver((mutations) => {
  const regex = /dark:bg-/;

  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const allElements = Array.from(mutation.target.querySelectorAll('main div.group'));
      const matchingElements = findMatchingElements();

      if (matchingElements.length !== previousElementCount) {
        const targetElement = matchingElements.reverse().find((element) => true);

        if (targetElement) {
          setTimeout(() => {
            checkRegenerateResponseAndUpdate(targetElement, matchingElements.length);
          }, 100);
        }
      }
    }
  });
});

function startObserver() {
  const mainElement = document.querySelector('main');
  if (mainElement) {
    // Add the 'older' class to existing 'main div.group' elements
    const existingElements = mainElement.querySelectorAll('main div.group');
    existingElements.forEach((element) => element.classList.add('older'));

    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    setTimeout(startObserver, 1000);
  }
}

chrome.storage.sync.get(['enabled'], (result) => {
  statusDisplay.innerText = result.enabled ? 'Enabled' : 'Disabled';

  if (result.enabled) {
    initializeSocket();
  }
});

startObserver();
