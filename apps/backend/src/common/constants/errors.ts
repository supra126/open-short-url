/**
 * Error messages constants
 */
export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_USER_EXISTS: 'This email is already registered',
  AUTH_UNAUTHORIZED: 'Unauthorized',
  AUTH_FORBIDDEN: 'Access forbidden',
  AUTH_TOKEN_EXPIRED: 'Token has expired',
  AUTH_TOKEN_INVALID: 'Invalid token',

  // URL errors
  URL_NOT_FOUND: 'Short URL not found',
  URL_SLUG_EXISTS: 'This code is already in use',
  URL_INVALID_FORMAT: 'Invalid URL format',
  URL_INACTIVE: 'This short URL has been deactivated',
  URL_EXPIRED: 'This short URL has expired',
  URL_PASSWORD_REQUIRED: 'Password required to access',
  URL_PASSWORD_INCORRECT: 'Incorrect password',

  // Validation errors
  VALIDATION_FAILED: 'Data validation failed',
  VALIDATION_EMAIL_INVALID: 'Invalid email format',
  VALIDATION_PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  VALIDATION_URL_INVALID: 'Invalid URL format',

  // API Key errors
  API_KEY_NOT_FOUND: 'API key not found',
  API_KEY_INVALID: 'Invalid API key',
  API_KEY_EXPIRED: 'API key has expired',
  API_KEY_REQUIRED: 'API key is required',

  // Rate limit
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',

  // Routing errors
  ROUTING_RULE_NOT_FOUND: 'Routing rule not found',
  ROUTING_TEMPLATE_NOT_FOUND: 'Routing template not found',
  ROUTING_MAX_RULES_EXCEEDED: 'Maximum number of routing rules exceeded',
  ROUTING_EVALUATION_FAILED: 'Failed to evaluate routing rules',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error',
  CACHE_ERROR: 'Cache error',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
