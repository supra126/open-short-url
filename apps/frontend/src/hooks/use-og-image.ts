/**
 * OG Image Upload Hook
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { urlKeys } from '@/hooks/use-url';

interface OgImageUploadResult {
  statusCode: number;
  data: {
    key: string;
    proxyUrl: string;
  };
}

async function uploadOgImage(
  urlId: string,
  file: File
): Promise<OgImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post<OgImageUploadResult>(
    `/api/og-images/upload/${urlId}`,
    formData as any
  );
}

export function useUploadOgImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ urlId, file }: { urlId: string; file: File }) =>
      uploadOgImage(urlId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: urlKeys.detail(variables.urlId),
      });
      queryClient.invalidateQueries({
        queryKey: urlKeys.lists(),
      });
    },
  });
}
