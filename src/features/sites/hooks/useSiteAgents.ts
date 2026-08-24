'use client';

import { useState, useMemo, useCallback } from 'react';
import { useList, useOne, useInvalidate } from '@refinedev/core';
import { message } from 'antd';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import { siteApi } from '../services/site.api';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useSiteAgents(siteId: string | null) {
  const invalidate = useInvalidate();
  const { isSuperAdmin, isAdmin } = useCurrentRole();
  const canManage = isSuperAdmin || isAdmin;

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  // 1. Fetch all users from backend
  const { query: usersQuery } = useList({
    resource: 'users',
    pagination: { mode: 'server', currentPage: 1, pageSize: 1000 },
    queryOptions: {
      enabled: !!siteId && canManage,
    },
  });

  const rawUsers = usersQuery.data?.data;
  const allAgents = useMemo(() => {
    const allUsers = (rawUsers as unknown as UserRecord[]) || [];
    return allUsers.filter((u) => String(u.role).toLowerCase() === 'agent');
  }, [rawUsers]);

  // 2. Fetch current site details to get assigned agents
  const { query: siteQuery } = useOne({
    resource: 'sites',
    id: siteId || '',
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const isSiteLoading = siteQuery.isLoading;
  const isUsersLoading = usersQuery.isLoading;
  const rawAgents = siteQuery.data?.data?.agents;

  const assignedAgents = useMemo(() => (rawAgents as unknown as UserRecord[]) || [], [rawAgents]);

  // Filter out agents that are already assigned to this site
  const availableAgents = useMemo(
    () => allAgents.filter((agent) => !assignedAgents.some((assigned) => assigned.id === agent.id)),
    [allAgents, assignedAgents],
  );

  const filteredAgents = useMemo(
    () =>
      availableAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [availableAgents, searchTerm],
  );

  // 3. Handle assign agents
  const assignAgents = useCallback(async () => {
    if (!siteId || selectedAgentIds.length === 0) return false;
    setIsMutating(true);
    try {
      await siteApi.assignAgents(siteId, selectedAgentIds);
      setSelectedAgentIds([]);
      setSearchTerm('');
      message.success('Agent assigned successfully!');
      invalidate({
        resource: 'sites',
        invalidates: ['detail', 'list'],
        id: siteId,
      });
      return true;
    } catch (error) {
      console.error(error);
      message.error('An error occurred while assigning the agent.');
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [siteId, selectedAgentIds, invalidate]);

  // 4. Handle remove agent
  const removeAgent = useCallback(
    async (agentId: string) => {
      if (!siteId) return false;
      setIsMutating(true);
      try {
        await siteApi.removeAgent(siteId, agentId);
        message.success('Agent removed successfully!');
        invalidate({
          resource: 'sites',
          invalidates: ['detail', 'list'],
          id: siteId,
        });
        return true;
      } catch (error) {
        console.error(error);
        message.error('An error occurred while removing the agent.');
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [siteId, invalidate],
  );

  return {
    canManage,
    assignedAgents,
    availableAgents,
    filteredAgents,
    selectedAgentIds,
    setSelectedAgentIds,
    searchTerm,
    setSearchTerm,
    isSiteLoading,
    isUsersLoading,
    isMutating,
    assignAgents,
    removeAgent,
  };
}
