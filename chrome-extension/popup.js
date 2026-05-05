const API_URL = 'https://focusflow-pro-api.onrender.com/api';

document.addEventListener('DOMContentLoaded', async () => {
  const token = await getToken();
  if (token) {
    showStatusSection(token);
  }

  document.getElementById('login-btn')
    .addEventListener('click', handleLogin);

  document.getElementById('logout-btn')
    .addEventListener('click', handleLogout);

  document.getElementById('open-app')
    .addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000' });
    });
});

async function getToken() {
  const result = await chrome.storage.local.get(['token']);
  return result.token || null;
}

async function handleLogin() {
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const msgEl    = document.getElementById('login-msg');

  if (!email || !password) {
    msgEl.textContent = 'Please enter email and password';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message || 'Login failed';
      return;
    }

    await chrome.storage.local.set({ token: data.token });

    chrome.runtime.sendMessage({
      type: 'LOGIN',
      token: data.token
    });

    showStatusSection(data.token);

  } catch (err) {
    document.getElementById('login-msg').textContent =
      'Connection failed. Is the server running?';
  }
}

async function handleLogout() {
  await chrome.storage.local.clear();
  chrome.runtime.sendMessage({ type: 'LOGOUT' });
  document.getElementById('status-section').style.display = 'none';
  document.getElementById('login-section').style.display  = 'block';
}

async function showStatusSection(token) {
  document.getElementById('login-section').style.display  = 'none';
  document.getElementById('status-section').style.display = 'block';

  try {
    const [sessionRes, sitesRes] = await Promise.all([
      fetch(`${API_URL}/session/active`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_URL}/block/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const session = await sessionRes.json();
    const sites   = await sitesRes.json();

    if (session && session._id) {
      document.getElementById('session-active').style.display   = 'flex';
      document.getElementById('session-inactive').style.display = 'none';
    } else {
      document.getElementById('session-active').style.display   = 'none';
      document.getElementById('session-inactive').style.display = 'flex';
    }

    const sitesList = document.getElementById('sites-list');
    if (sites.sites?.length > 0) {
      sitesList.innerHTML = sites.sites.map(s => `
        <div class="site-chip">
          🚫 ${s.siteURL}
        </div>
      `).join('');
    } else {
      sitesList.innerHTML = `
        <p style="font-size:0.78rem; color:#475569;">
          No sites blocked yet
        </p>
      `;
    }

  } catch (err) {
    console.log('Failed to fetch status:', err);
  }
}