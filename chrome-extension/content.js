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
const requestIds = {};
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

  socket = new WebSocket('ws://localhost:3030');

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
    updateConnectionStatus('Connected');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Check if the received data has 'type' and 'message' properties
    if (data.type === 'new-message' && data.message && data.message === 'stop'){
      stopGenerating();
    }else if (data.type === 'new-message' && data.message) {
      lastMessageID = data.requestId;
      requestIds[data.requestId] = { onlyText: data.onlyText }
      const inputElement = document.querySelector('textarea');

      if (inputElement) {
        inputElement.value = data.message;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));

        const formElement = inputElement.closest('form');
        formElement.dispatchEvent(new Event('submit', { bubbles: true }));
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
  let stopButton = getStopBuddon();

  const markdownElements = element.querySelectorAll('.markdown');
  const errorElements = document.querySelectorAll('.border-red-500')
  const lastMarkdownElement = markdownElements[markdownElements.length - 1];

  // Tips: lastMarkdownElement.innerText.length === 1 => ChatGPT is thinking
  if (!stopButton && lastMarkdownElement && lastMarkdownElement.innerText.length > 1) {
    let updatedContent = ""
    if (errorElements.length > 0) {
      updatedContent = errorElements[0].innerText
    }else if (lastMarkdownElement) {
      console.log(requestIds[requestId])
      if (requestIds[requestId]['onlyText'] === true) {
        updatedContent = lastMarkdownElement.innerText;
      }else{
        updatedContent = lastMarkdownElement.innerHTML;
      }
    }

    content = updatedContent
    console.log('Sending updated content:', updatedContent);
    console.log(lastMessageID, requestId)
    // Send the updated content to the local server
    if (socket && socket.readyState === WebSocket.OPEN && lastMessageID === requestId ) {
      previousElementCount = matchLength;
      socket.send(JSON.stringify({
        type: 'response',
        requestId: requestId,
        content: updatedContent,
        currentUrl: window.location.href
      }));
    }
  } else {
    setTimeout(() => checkRegenerateResponseAndUpdate(element, matchLength, requestId), 100);
  }
}

let checkElementsChanger;
const observer = new MutationObserver((mutations) => {
  const regex = /dark:bg-/;

  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const allElements = Array.from(mutation.target.querySelectorAll('main div.group'));
      const matchingElements = findMatchingElements();

      if (matchingElements.length !== previousElementCount) {
        const targetElement = matchingElements.reverse().find((element) => true);
        if (targetElement) {
          if (targetElement.innerText != '') {
            clearTimeout(checkElementsChanger)
            checkElementsChanger = setTimeout(() => {
              checkRegenerateResponseAndUpdate(targetElement, matchingElements.length);
            }, 300);
          }
        }
      }
    }
  });
});

function getStopBuddon() {
  const allButtons = document.querySelectorAll('button');

  let stopButton = Array.from(allButtons).reverse().find((button) => {
    const buttonText = button.innerText;
    return buttonText === 'Stop generating';
  });

  if(!stopButton) {
    stopButton = Array.from(document.querySelectorAll('form button')).reverse().find((button) => {
      const svgRect = button.querySelector('svg rect');
      return svgRect;
    });
  }

  return stopButton;
}

async function stopGenerating() {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });

  let stopButton = getStopBuddon();

  if (stopButton) {
    console.log(stopButton)
    stopButton.dispatchEvent(new Event('click', { bubbles: true }));
  }
}

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
