const API_URL = 'https://focusflow-pro-api.onrender.com/api';

let blockedSites  = [];
let isSessionActive = false;
let sessionData   = null;

async function fetchBlockedSites() {
  try {
    const token = await getToken();
    if (!token) return;

    const res = await fetch(`${API_URL}/block/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    blockedSites = data.sites?.map(s => s.siteURL) || [];
    await chrome.storage.local.set({ blockedSites });
  } catch (err) {
    console.log('Failed to fetch blocked sites:', err);
  }
}

async function checkActiveSession() {
  try {
    const token = await getToken();
    if (!token) return;

    const res = await fetch(`${API_URL}/session/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    isSessionActive = !!data;
    sessionData = data;
    await chrome.storage.local.set({ isSessionActive, sessionData });
  } catch (err) {
    console.log('Failed to check session:', err);
  }
}

async function getToken() {
  const result = await chrome.storage.local.get(['token']);
  return result.token || null;
}

async function trackDistraction(siteURL) {
  try {
    const token = await getToken();
    if (!token) return;

    await fetch(`${API_URL}/session/distraction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ siteURL })
    });
  } catch (err) {
    console.log('Failed to track distraction:', err);
  }
}

function isBlocked(url) {
  if (!isSessionActive) return false;
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return blockedSites.some(site =>
      hostname === site || hostname.endsWith('.' + site)
    );
  } catch {
    return false;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  await checkActiveSession();

  if (isBlocked(details.url)) {
    const hostname = new URL(details.url).hostname;
    await trackDistraction(hostname);

    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') +
           `?site=${encodeURIComponent(hostname)}`
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'FocusFlow - Site Blocked!',
      message: `${hostname} is blocked during your study session!`
    });
  }
});

chrome.alarms.create('sync', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync') {
    await fetchBlockedSites();
    await checkActiveSession();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN') {
    chrome.storage.local.set({ token: message.token });
    fetchBlockedSites();
    checkActiveSession();
    sendResponse({ success: true });
  }

  if (message.type === 'LOGOUT') {
    chrome.storage.local.clear();
    isSessionActive = false;
    blockedSites = [];
    sendResponse({ success: true });
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({ isSessionActive, blockedSites, sessionData });
  }

  if (message.type === 'SESSION_STARTED') {
    isSessionActive = true;
    fetchBlockedSites();
    sendResponse({ success: true });
  }

  if (message.type === 'SESSION_ENDED') {
    isSessionActive = false;
    sendResponse({ success: true });
  }

  return true;
});

fetchBlockedSites();
checkActiveSession();