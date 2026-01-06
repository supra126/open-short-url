/**
 * Common Type Definitions
 * Centralized type definitions for the backend application
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '@prisma/client';

/**
 * Extended Fastify Request with user information
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user?: User;
}

/**
 * Request with custom metadata for logging
 */
export interface ExtendedRequest extends FastifyRequest {
  requestId?: string;
  _startTime?: number;
  _userId?: string | null;
  _ip?: string;
  user?: User;
}

/**
 * Fastify instance type for hook registration
 */
export interface FastifyInstanceWithHooks {
  addHook: (
    hook: 'onRequest' | 'onResponse' | 'preHandler' | 'onError',
    handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  ) => void;
}

/**
 * Click data type for analytics
 */
export interface ClickData {
  id: string;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  isBot: boolean;
  botName?: string | null;
  createdAt: Date;
}

/**
 * Prisma query event for slow query logging
 */
export interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

/**
 * Export Fastify types for convenience
 */
export type { FastifyRequest, FastifyReply } from 'fastify';
export type { User } from '@prisma/client';
