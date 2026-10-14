import { apiRequest } from '@/src/lib/api.client';

export interface SiteImageUploadResponse {
  url: string;
}

export const siteService = {
  /**
   * Upload an image (avatar or launcher icon) for a site
   */
  async uploadImage(siteId: string, file: File | Blob): Promise<SiteImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<SiteImageUploadResponse>(`/sites/${siteId}/image`, {
      method: 'POST',
      body: formData,
    });
  },
};
