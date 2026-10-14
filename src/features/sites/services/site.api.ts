import { apiRequest } from '@/src/lib/api.client';

export interface TestConnectionPayload {
  apiKey?: string;
  customBaseUrl?: string;
  llmModel?: string;
}

export interface TestConnectionResponse {
  valid: boolean;
  latencyMs: number;
  customKeyStatus: 'valid' | 'invalid' | 'unknown';
  endpointTested: string;
  warning?: string;
  error?: string;
}

export interface SaveApiKeyPayload {
  apiKey?: string;
  customBaseUrl?: string;
  llmModel?: string;
}

export interface SaveApiKeyResponse {
  useCustomOpenAiKey: boolean;
  customKeyStatus: 'unknown' | 'valid' | 'invalid';
  customBaseUrl?: string | null;
  keyMask?: string | null;
  llmModel?: string;
  warning?: string;
}

export interface RemoveApiKeyResponse {
  useCustomOpenAiKey: boolean;
  customKeyStatus: 'unknown';
  llmModel?: string;
}

export interface KBSourcesResponse {
  data: {
    id: string;
    filename: string;
    fileSizeBytes: number;
    fileType: string;
  }[];
}

export const siteApi = {
  // ── BYOK / Security Settings ──────────────────────────────────────────────
  testSecurityConnection(
    siteId: string,
    payload: TestConnectionPayload,
  ): Promise<TestConnectionResponse> {
    return apiRequest<TestConnectionResponse>(`/sites/${siteId}/api-key/test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  saveSecurityApiKey(siteId: string, payload: SaveApiKeyPayload): Promise<SaveApiKeyResponse> {
    return apiRequest<SaveApiKeyResponse>(`/sites/${siteId}/api-key`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  removeSecurityApiKey(siteId: string): Promise<RemoveApiKeyResponse> {
    return apiRequest<RemoveApiKeyResponse>(`/sites/${siteId}/api-key`, {
      method: 'DELETE',
    });
  },

  // ── Appearance Assets ────────────────────────────────────────────────────
  uploadImage(siteId: string, file: Blob): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ url: string }>(`/sites/${siteId}/image`, {
      method: 'POST',
      body: formData,
    });
  },

  // ── Agent Assignment ─────────────────────────────────────────────────────
  /**
   * Assign an agent to a site
   */
  async assignAgent(siteId: string, agentId: string): Promise<void> {
    return apiRequest<void>(`/sites/${siteId}/agents`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  },

  /**
   * Assign multiple agents to a site concurrently
   */
  async assignAgents(siteId: string, agentIds: string[]): Promise<void> {
    await Promise.all(
      agentIds.map((agentId) =>
        apiRequest<void>(`/sites/${siteId}/agents`, {
          method: 'POST',
          body: JSON.stringify({ agentId }),
        }),
      ),
    );
  },

  /**
   * Remove an agent from a site
   */
  async removeAgent(siteId: string, agentId: string): Promise<void> {
    return apiRequest<void>(`/sites/${siteId}/agents/${agentId}`, {
      method: 'DELETE',
    });
  },

  // ── Knowledge Base Sources ───────────────────────────────────────────────
  getKBSources(siteId: string): Promise<KBSourcesResponse> {
    return apiRequest<KBSourcesResponse>(`/sites/${siteId}/kb/sources`);
  },
};

// Convenient alias for security-specific contexts
export const siteSecurityApi = {
  testConnection: siteApi.testSecurityConnection,
  saveApiKey: siteApi.saveSecurityApiKey,
  removeApiKey: siteApi.removeSecurityApiKey,
};
