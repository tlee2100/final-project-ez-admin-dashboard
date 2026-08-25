import React from 'react';
import { Tag } from 'antd';
import type { ChatMessage } from '../types/chat.types';

export function getHandlingTag(h: string) {
  if (h === 'WAITING_FOR_AGENT') return <Tag color="orange">Waiting for Agent</Tag>;
  if (h === 'AGENT_HANDLING') return <Tag color="green">Active</Tag>;
  if (h === 'AI_HANDLING') return <Tag color="blue">AI Handling</Tag>;
  return <Tag>{h}</Tag>;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
}

export function senderKey(msg: ChatMessage) {
  return `${msg.senderType}:${msg.agentId ?? msg.senderName ?? ''}`;
}
