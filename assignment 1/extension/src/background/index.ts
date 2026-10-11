import { getConfig, getReminders, DEFAULT_API_URL } from '../lib/api';

const ALARM_NAME = 'ecell_deadline_checker';
const ALARM_INTERVAL_MINUTES = 30;

// Setup alarms on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[E-Cell Extension] Installed. Setting up alarms...');
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: ALARM_INTERVAL_MINUTES,
    delayInMinutes: 1,
  });

  // Enable side panel on action click if configured
  if (chrome.sidePanel && (chrome.sidePanel as any).setPanelBehavior) {
    (chrome.sidePanel as any).setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }

  // Initial check
  checkDeadlinesAndNotify();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[E-Cell Extension] Browser started. Checking reminders...');
  checkDeadlinesAndNotify();
});

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkDeadlinesAndNotify();
  }
});

// Notification click listener
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
  getConfig().then((config) => {
    const baseUrl = config.apiUrl || DEFAULT_API_URL;
    chrome.tabs.create({ url: `${baseUrl}/my-work` });
  });
});

async function checkDeadlinesAndNotify() {
  try {
    const config = await getConfig();
    if (!config.apiToken) {
      // Clear badge if no token
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const res = await getReminders();
    if (!res || !res.summary) return;

    const { overdueCount, todayCount } = res.summary;
    const totalAlerts = overdueCount + todayCount;

    // Update extension badge
    if (overdueCount > 0) {
      chrome.action.setBadgeText({ text: `${overdueCount}` });
      chrome.action.setBadgeBackgroundColor({ color: '#DC2626' }); // Danger Red
    } else if (todayCount > 0) {
      chrome.action.setBadgeText({ text: `${todayCount}` });
      chrome.action.setBadgeBackgroundColor({ color: '#D97706' }); // Amber
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    // Check previously notified IDs to de-duplicate
    const storage = await chrome.storage.local.get(['notifiedItemIds', 'lastNotifiedDate']);
    const todayStr = new Date().toISOString().split('T')[0];
    let notifiedIds: Record<string, string> = storage.notifiedItemIds || {};

    // Reset notification cache on new day
    if (storage.lastNotifiedDate !== todayStr) {
      notifiedIds = {};
    }

    const itemsToNotify: any[] = [];

    // Check overdue items
    if (res.overdueItems && res.overdueItems.length > 0) {
      for (const item of res.overdueItems) {
        if (!notifiedIds[item.id]) {
          itemsToNotify.push({ ...item, alertType: 'overdue' });
          notifiedIds[item.id] = todayStr;
        }
      }
    }

    // Check due today items
    if (res.todayItems && res.todayItems.length > 0) {
      for (const item of res.todayItems) {
        if (!notifiedIds[item.id]) {
          itemsToNotify.push({ ...item, alertType: 'today' });
          notifiedIds[item.id] = todayStr;
        }
      }
    }

    // Save updated notification cache
    await chrome.storage.local.set({
      notifiedItemIds: notifiedIds,
      lastNotifiedDate: todayStr,
    });

    // Fire notifications if any new items are ready
    if (itemsToNotify.length === 1) {
      const item = itemsToNotify[0];
      const isOverdue = item.alertType === 'overdue';
      chrome.notifications.create(`ecell_${item.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: isOverdue ? `⚠️ Overdue: ${item.title}` : `📅 Due Today: ${item.title}`,
        message: `Assigned to: ${item.assigneeName} (${item.meetingTitle}). Click to review in E-Cell hub.`,
        priority: 2,
      });
    } else if (itemsToNotify.length > 1) {
      chrome.notifications.create(`ecell_batch_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `🚨 ${itemsToNotify.length} E-Cell Action Items Pending`,
        message: `You have ${overdueCount} overdue and ${todayCount} items due today. Click to open action board.`,
        priority: 2,
      });
    }
  } catch (err) {
    console.warn('[E-Cell Background] Failed to check reminders:', err);
  }
}
