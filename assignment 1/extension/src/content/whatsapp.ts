// WhatsApp Web Content Script for E-Cell Companion (Layer 5 Live Capture)

console.log('[E-Cell] WhatsApp Web helper initialized');

function injectCaptureButton() {
  if (document.getElementById('ecell-wa-capture-btn')) return;

  const btn = document.createElement('div');
  btn.id = 'ecell-wa-capture-btn';
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    background: #0F766E;
    color: #FAF8F5;
    padding: 8px 14px;
    border-radius: 9999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  `;

  btn.innerHTML = `
    <span style="font-size: 14px;">📝</span>
    <span>Capture Chat to E-Cell</span>
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.background = '#115E59';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.background = '#0F766E';
  });

  btn.addEventListener('click', () => {
    captureVisibleChat();
  });

  document.body.appendChild(btn);
}

function captureVisibleChat() {
  // Check if user has selected text on page
  const selection = window.getSelection()?.toString().trim();
  if (selection) {
    sendToSidePanel(selection, 'whatsapp_capture');
    showToast('Selected WhatsApp text captured to E-Cell!');
    return;
  }

  // Attempt DOM traversal of visible messages
  const messageNodes = document.querySelectorAll('div[data-pre-plain-text], .message-in, .message-out');
  const extractedLines: string[] = [];

  if (messageNodes.length > 0) {
    messageNodes.forEach((node) => {
      const plainHeader = node.getAttribute('data-pre-plain-text') || '';
      const textElem = node.querySelector('.selectable-text');
      const text = textElem?.textContent?.trim() || node.textContent?.trim() || '';
      if (text) {
        if (plainHeader) {
          extractedLines.push(`${plainHeader}${text}`);
        } else {
          extractedLines.push(text);
        }
      }
    });
  }

  if (extractedLines.length === 0) {
    // Fallback prompt
    showToast('Open a chat or highlight text to capture messages.');
    return;
  }

  const fullText = extractedLines.join('\n');
  sendToSidePanel(fullText, 'whatsapp_capture');
  showToast(`Captured ${extractedLines.length} chat messages to E-Cell!`);
}

function sendToSidePanel(text: string, source: string) {
  try {
    chrome.runtime.sendMessage({
      type: 'APPEND_TRANSCRIPT',
      text,
      source,
    });
  } catch (err) {
    console.warn('[E-Cell] Error sending message:', err);
  }
}

function showToast(msg: string) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 24px;
    z-index: 100000;
    background: #191613;
    color: #FAF8F5;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: none;
    transition: opacity 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Check and inject periodically when DOM is ready
setInterval(injectCaptureButton, 2000);
