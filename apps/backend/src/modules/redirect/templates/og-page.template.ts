/**
 * OG Meta HTML Template
 * Returned to social media crawlers for custom link previews
 */

export interface OgPageOptions {
  ogTitle: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCardType?: string;
  originalUrl: string;
  shortUrl: string;
}

export function generateOgPage(options: OgPageOptions): string {
  const {
    ogTitle,
    ogDescription,
    ogImageUrl,
    twitterCardType = 'summary_large_image',
    originalUrl,
    shortUrl,
  } = options;

  const escapedTitle = escapeHtml(ogTitle);
  const escapedDescription = ogDescription ? escapeHtml(ogDescription) : '';
  const escapedOriginalUrl = escapeHtml(originalUrl);
  const escapedShortUrl = escapeHtml(shortUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapedTitle}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${escapedTitle}">
  ${escapedDescription ? `<meta property="og:description" content="${escapedDescription}">` : ''}
  ${ogImageUrl ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}">` : ''}
  <meta property="og:url" content="${escapedShortUrl}">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${escapeHtml(twitterCardType)}">
  <meta name="twitter:title" content="${escapedTitle}">
  ${escapedDescription ? `<meta name="twitter:description" content="${escapedDescription}">` : ''}
  ${ogImageUrl ? `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">` : ''}

  <!-- Fallback redirect -->
  <meta http-equiv="refresh" content="0;url=${escapedOriginalUrl}">
</head>
<body>
  <p>Redirecting to <a href="${escapedOriginalUrl}">${escapedOriginalUrl}</a></p>
  <script>window.location.href=${JSON.stringify(originalUrl)};</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
