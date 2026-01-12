/**
 * Domain Constants
 * Defines the domain names for the various parts of the application.
 */

export const DOMAINS = {
  // Service Domains
  ADMIN: 'https://admin.tacomole.kr',
  WEBSITE: 'https://tacomole.kr',
  TABLE_ORDER: 'https://order.tacomole.kr',
  DELIVERY: 'https://delivery.tacomole.kr',

  // API
  // Environment variable takes precedence, otherwise defaults to production API
  API: process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1',
} as const;
