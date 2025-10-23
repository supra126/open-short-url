/**
 * Password Protected Page HTML Template
 */

export interface PasswordPageOptions {
  slug: string;
  brandName: string;
  brandLogoUrl?: string;
  error?: string;
  utmParams?: string;
  turnstileSiteKey?: string;
}

export function generatePasswordPage(options: PasswordPageOptions): string {
  const { slug, brandName, brandLogoUrl, error, utmParams, turnstileSiteKey } =
    options;
  const actionUrl = `/${slug}/verify${utmParams ? `?${utmParams}` : ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Password Protected - ${brandName}</title>
  ${turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ''}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary-color: #4F46E5;
      --error-color: #DC2626;
      --bg-gradient-start: #EEF2FF;
      --bg-gradient-end: #E0E7FF;
      --card-bg: #FFFFFF;
      --text-primary: #1F2937;
      --text-secondary: #6B7280;
      --border-color: #E5E7EB;
      --input-border: #D1D5DB;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-gradient-start: #1F2937;
        --bg-gradient-end: #111827;
        --card-bg: #374151;
        --text-primary: #F9FAFB;
        --text-secondary: #D1D5DB;
        --border-color: #4B5563;
        --input-border: #6B7280;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--text-primary);
    }

    .container {
      width: 100%;
      max-width: 420px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 40px 32px;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .logo {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo img {
      max-width: 180px;
      height: auto;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary-color);
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 12px;
      color: var(--text-primary);
    }

    .description {
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .error-message {
      background-color: rgba(220, 38, 38, 0.1);
      border: 1px solid var(--error-color);
      color: var(--error-color);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 24px;
      animation: shake 0.3s ease-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-wrapper {
      position: relative;
    }

    input[type="password"] {
      width: 100%;
      padding: 14px 16px;
      font-size: 16px;
      border: 2px solid var(--input-border);
      border-radius: 8px;
      background: var(--card-bg);
      color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="password"]:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    button {
      width: 100%;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background-color: var(--primary-color);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }

    button:hover {
      background-color: #4338CA;
    }

    button:active {
      transform: scale(0.98);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .footer a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer a:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .turnstile-wrapper {
      width: 100%;
      margin: 16px 0;
    }

    .cf-turnstile {
      width: 100% !important;
    }

    @media (max-width: 480px) {
      .card {
        padding: 32px 24px;
      }

      h1 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        ${brandLogoUrl ? `<img src="${brandLogoUrl}" alt="${brandName}">` : `<div class="logo-text">${brandName}</div>`}
      </div>

      <h1>🔒 This Short URL is Password Protected</h1>
      <p class="description">
        Please enter the password to continue
      </p>

      ${error ? `<div class="error-message">${error}</div>` : ''}

      <form method="POST" action="${actionUrl}" id="passwordForm">
        <div class="input-wrapper">
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            required
            autofocus
            autocomplete="off"
          >
        </div>
        ${
          turnstileSiteKey
            ? `
        <div class="turnstile-wrapper">
          <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-callback="onTurnstileSuccess" data-size="flexible" data-response-field="false"></div>
        </div>
        <input type="hidden" name="turnstileToken" id="turnstileToken">
        `
            : ''
        }
        <button type="submit" id="submitBtn" ${turnstileSiteKey ? 'disabled' : ''}>Continue</button>
      </form>

      <div class="footer">
        Powered by <a href="https://github.com/supra126/open-short-url" target="_blank" rel="noopener noreferrer">Open Short URL</a>
      </div>
    </div>
  </div>

  <script>
    ${
      turnstileSiteKey
        ? `
    // Turnstile callback
    window.onTurnstileSuccess = function(token) {
      document.getElementById('turnstileToken').value = token;
      document.getElementById('submitBtn').disabled = false;
    };
    `
        : ''
    }

    // Prevent duplicate form submission
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
      ${
        turnstileSiteKey
          ? `
      const turnstileToken = document.getElementById('turnstileToken').value;
      if (!turnstileToken) {
        e.preventDefault();
        alert('Please complete the verification');
        return;
      }
      `
          : ''
      }
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying...';
    });
  </script>
</body>
</html>`;
}
