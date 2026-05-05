(function() {
  chrome.storage.local.get(
    ['isSessionActive', 'blockedSites'],
    function(result) {
      const isActive   = result.isSessionActive;
      const blocked    = result.blockedSites || [];
      const hostname   = window.location.hostname.replace('www.', '');
      const isBlocked  = blocked.some(
        site => hostname === site || hostname.endsWith('.' + site)
      );

      if (isActive && isBlocked) {
        document.documentElement.innerHTML = `
          <html>
          <head>
            <style>
              * { margin:0; padding:0; box-sizing:border-box; }
              body {
                font-family: 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #0f0f13, #1a1033);
                color: white;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 1.5rem;
                text-align: center;
                padding: 2rem;
              }
              .icon { font-size: 5rem; }
              h1 {
                font-size: 2.5rem;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              p { color: #94a3b8; font-size: 1.1rem; max-width: 400px; }
              .site {
                background: rgba(99,102,241,0.15);
                border: 1px solid #6366f1;
                padding: 8px 20px;
                border-radius: 20px;
                font-family: monospace;
                color: #6366f1;
                font-size: 1rem;
              }
              .btn {
                padding: 12px 32px;
                border-radius: 12px;
                border: none;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                color: white;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 1rem;
              }
              .attempts {
                background: rgba(239,68,68,0.1);
                border: 1px solid #ef4444;
                padding: 8px 16px;
                border-radius: 8px;
                color: #ef4444;
                font-size: 0.875rem;
              }
            </style>
          </head>
          <body>
            <div class="icon">📵</div>
            <h1>Site Blocked!</h1>
            <p>This site is blocked during your FocusFlow study session.</p>
            <div class="site">${hostname}</div>
            <div class="attempts">
              Stay focused! You can do this 💪
            </div>
            <button class="btn" onclick="history.back()">
              Go Back & Focus
            </button>
          </body>
          </html>
        `;
      }
    }
  );
})();