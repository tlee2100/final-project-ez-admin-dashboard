import { apiRequest } from '@/src/lib/api.client';

export const siteApi = {
  /**
   * Assign an agent to a site
   */
  async assignAgent(siteId: string, agentId: string): Promise<void> {
    return apiRequest(`/sites/${siteId}/agents`, {
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
        apiRequest(`/sites/${siteId}/agents`, {
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
    return apiRequest(`/sites/${siteId}/agents/${agentId}`, {
      method: 'DELETE',
    });
  },
};
