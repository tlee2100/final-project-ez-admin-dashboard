import { getSession } from 'next-auth/react';
import { API_BASE_URL } from '@/src/lib/api.client';

export const chatUploadService = {
  /**
   * Upload an image attachment for a specific conversation
   * @returns markdown image syntax: `![image](url)`
   */
  async uploadConversationImage(conversationId: string, file: File): Promise<string> {
    const session = await getSession();
    const token = session?.accessToken;
    const baseUrl = API_BASE_URL || '';

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${baseUrl}/chat/conversations/${conversationId}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const data = await res.json();
    return `![image](${data.url})`;
  },

  /**
   * Upload multiple image attachments in parallel
   */
  async uploadMultipleImages(conversationId: string, files: File[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadConversationImage(conversationId, file)));
  },
};
