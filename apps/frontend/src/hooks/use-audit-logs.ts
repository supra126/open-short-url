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

// Re-export types for convenience
export type { AuditAction, AuditLogDto, AuditLogListResponseDto, AuditLogQueryParams };

// Query Keys
export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogQueryParams) => [...auditLogKeys.all, 'list', params] as const,
};

// API Function
async function getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogListResponseDto> {
  const query = buildQueryParams(params);
  return apiClient.get<AuditLogListResponseDto>(`/api/audit-logs?${query}`);
}

// Hook
export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogs(params),
    ...QUERY_CONFIG.LIVE,
    refetchOnWindowFocus: true,
  });
}
