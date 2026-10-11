// Google Meet Content Script for E-Cell Companion (Layer 5 Live Capture)

console.log('[E-Cell] Google Meet helper initialized');

function detectMeetInfo() {
  const meetingCodeMatch = window.location.pathname.match(/\/([a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3})/i);
  const meetingCode = meetingCodeMatch ? meetingCodeMatch[1] : '';

  // Look for meeting title in DOM
  const titleElem = document.querySelector('[data-meeting-title], [jsname="r4nke"], div[aria-label="Meeting details"]');
  let title = titleElem?.textContent?.trim() || '';

  if (!title && meetingCode) {
    title = `Google Meet (${meetingCode})`;
  } else if (!title) {
    title = 'Google Meet Discussion';
  }

  return { title, code: meetingCode };
}

function injectMeetHelper() {
  if (document.getElementById('ecell-meet-pill')) return;

  const pill = document.createElement('div');
  pill.id = 'ecell-meet-pill';
  pill.style.cssText = `
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: #FAF8F5;
    border: 1px solid #DCD2BF;
    color: #191613;
    padding: 6px 14px;
    border-radius: 9999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  `;

  pill.innerHTML = `
    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0F766E;"></span>
    <span>E-Cell: Use Meet Title in Notes</span>
  `;

  pill.addEventListener('mouseenter', () => {
    pill.style.borderColor = '#0F766E';
    pill.style.boxShadow = '0 6px 16px rgba(15,118,110,0.2)';
  });

  pill.addEventListener('mouseleave', () => {
    pill.style.borderColor = '#DCD2BF';
    pill.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  pill.addEventListener('click', () => {
    const { title } = detectMeetInfo();
    try {
      chrome.runtime.sendMessage({
        type: 'SET_MEETING_TITLE',
        title: title || 'E-Cell Meet Sync',
        source: 'meet',
      });

      pill.innerHTML = `
        <span style="color:#0F766E; font-size:12px;">✓</span>
        <span>Title Synced to Side Panel!</span>
      `;
      setTimeout(() => {
        pill.innerHTML = `
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0F766E;"></span>
          <span>E-Cell: Use Meet Title in Notes</span>
        `;
      }, 3000);
    } catch (err) {
      console.warn('[E-Cell Meet] Error:', err);
    }
  });

  document.body.appendChild(pill);
}

// Inject after a short delay once Meet UI renders
setTimeout(() => {
  injectMeetHelper();
  setInterval(injectMeetHelper, 4000);
}, 3000);
