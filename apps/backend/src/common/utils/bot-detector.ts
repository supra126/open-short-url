/**
 * Bot Detection Utility
 * Detects known bots and crawlers from User-Agent strings
 */

/**
 * Common bot patterns (case-insensitive)
 * Covers search engine crawlers, monitoring tools, and automated browsers
 */
const BOT_PATTERNS = [
  // Search Engine Bots
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,

  // Social Media Crawlers
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,

  // SEO & Monitoring Tools
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i, // Majestic
  /dotbot/i,
  /rogerbot/i, // Moz
  /screaming frog/i,
  /uptimerobot/i,
  /pingdom/i,
  /statusCake/i,

  // AI Crawlers
  /gptbot/i, // OpenAI
  /claude-web/i, // Anthropic
  /anthropic-ai/i,
  /cohere-ai/i,
  /meta-externalagent/i, // Meta AI
  /amazonbot/i, // Amazon
  /applebot/i, // Apple

  // Developer Tools & Testing
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /webdriver/i,
  /playwright/i,
  /puppeteer/i,
  /cypress/i,

  // Generic Crawler Indicators
  /crawler/i,
  /spider/i,
  /bot/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i, // When used server-side
  /go-http-client/i,
  /java/i, // Java HTTP clients
];

/**
 * Detect if a User-Agent string belongs to a bot
 * @param userAgent - The User-Agent string to check
 * @returns true if the User-Agent is identified as a bot
 */
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) {
    return false; // No User-Agent means likely a bot, but we'll be lenient
  }

  // Check against all bot patterns
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Get the bot type/name if detected
 * @param userAgent - The User-Agent string to check
 * @returns Bot name if detected, null otherwise
 */
export function getBotName(userAgent: string | undefined): string | null {
  if (!userAgent || !isBot(userAgent)) {
    return null;
  }

  // Extract bot name from common patterns
  const botNamePatterns = [
    { pattern: /googlebot/i, name: 'Googlebot' },
    { pattern: /bingbot/i, name: 'Bingbot' },
    { pattern: /slurp/i, name: 'Yahoo Slurp' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /baiduspider/i, name: 'Baiduspider' },
    { pattern: /yandexbot/i, name: 'YandexBot' },
    { pattern: /facebookexternalhit/i, name: 'Facebook' },
    { pattern: /twitterbot/i, name: 'TwitterBot' },
    { pattern: /linkedinbot/i, name: 'LinkedInBot' },
    { pattern: /whatsapp/i, name: 'WhatsApp' },
    { pattern: /ahrefsbot/i, name: 'AhrefsBot' },
    { pattern: /semrushbot/i, name: 'SemrushBot' },
    { pattern: /gptbot/i, name: 'GPTBot' },
    { pattern: /claude-web/i, name: 'ClaudeBot' },
    { pattern: /applebot/i, name: 'AppleBot' },
    { pattern: /uptimerobot/i, name: 'UptimeRobot' },
    { pattern: /pingdom/i, name: 'Pingdom' },
  ];

  for (const { pattern, name } of botNamePatterns) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }

  return 'Unknown Bot';
}
