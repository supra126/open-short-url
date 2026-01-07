/**
 * Audit Logs Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildQueryParams } from '@/lib/utils';
import { QUERY_CONFIG } from '@/lib/query-config';
import type {
  AuditAction,
  AuditLogDto,
  AuditLogListResponseDto,
  AuditLogQueryParams,
} from '@/lib/api/schemas';

// Re-export types for consumers of this hook
export type { AuditAction, AuditLogDto, AuditLogListResponseDto, AuditLogQueryParams };

// Query Keys (exported for external cache management)
export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (params: AuditLogQueryParams) => [...auditLogKeys.lists(), params] as const,
};

// ==================== API Functions ====================

async function getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogListResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<AuditLogListResponseDto>(`/api/audit-logs?${query}`);
}

// ==================== Hooks ====================
export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogs(params),
    ...QUERY_CONFIG.LIVE,
    refetchOnWindowFocus: true,
  });
}
