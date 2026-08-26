import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ScissorOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

export interface BookingSlotDetail {
  resourceId?: string;
  resourceName?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
  date?: string;
  timeSlot?: string;
}

export interface BookingCommandPayload {
  customerName?: string;
  phone?: string;
  customerEmail?: string;
  date?: string;
  timeSlot?: string;
  endTimeSlot?: string;
  slotCount?: number;
  resourceId?: string;
  resourceName?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
  serviceIds?: string[];
  serviceNames?: string[];
  slots?: BookingSlotDetail[];
  locale?: string;
  action?: string;
  value?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ParsedBookingMessage {
  isCommand: boolean;
  type?:
    | 'confirm_booking'
    | 'update_draft_booking'
    | 'select_booking_slot'
    | 'select_booking_option'
    | 'cancel_booking'
    | 'confirm_cancel_booking'
    | 'keep_booking'
    | 'abandon_booking'
    | 'other';
  label?: string;
  payload?: BookingCommandPayload;
  cleanText: string;
}

/**
 * Parses raw slash commands sent by the visitor into human-readable details.
 */
export function parseBookingMessage(text: string): ParsedBookingMessage {
  if (!text || typeof text !== 'string') {
    return { isCommand: false, cleanText: '' };
  }

  // Suffix label extraction: e.g. `/confirm-booking {...} :: Xác nhận đặt lịch`
  const suffixMatch = text.match(
    /^\/(confirm-booking|update-draft-booking|select-booking-slot|select-booking-option|cancel-booking|confirm-cancel-booking|keep-booking|abandon-booking)(?:[\s\S]*?)(?:\s*::\s*([\s\S]+))?$/i,
  );

  if (!suffixMatch) {
    return { isCommand: false, cleanText: text };
  }

  const command = suffixMatch[1].toLowerCase();
  const label = suffixMatch[2]?.trim();

  // Extract JSON payload if present
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let payload: BookingCommandPayload | undefined;
  if (jsonMatch) {
    try {
      payload = JSON.parse(jsonMatch[0]) as BookingCommandPayload;
    } catch {
      // Not valid JSON
    }
  }

  switch (command) {
    case 'confirm-booking':
      return {
        isCommand: true,
        type: 'confirm_booking',
        label: label || 'Xác nhận đặt lịch',
        payload,
        cleanText: label || 'Xác nhận thông tin đặt lịch',
      };
    case 'update-draft-booking':
      return {
        isCommand: true,
        type: 'update_draft_booking',
        label: label || 'Lưu thay đổi',
        payload,
        cleanText: label || 'Cập nhật thông tin đặt lịch',
      };
    case 'select-booking-slot':
      return {
        isCommand: true,
        type: 'select_booking_slot',
        label: label || (payload?.timeSlot ? `Chọn giờ ${payload.timeSlot}` : 'Chọn khung giờ'),
        payload,
        cleanText: label || (payload?.timeSlot ? `Chọn giờ ${payload.timeSlot}` : 'Chọn khung giờ'),
      };
    case 'select-booking-option':
      return {
        isCommand: true,
        type: 'select_booking_option',
        label: label || payload?.label || payload?.value || 'Chọn dịch vụ / nhân viên',
        payload,
        cleanText: label || payload?.label || payload?.value || 'Chọn tùy chọn',
      };
    case 'cancel-booking':
    case 'confirm-cancel-booking':
      return {
        isCommand: true,
        type: 'cancel_booking',
        label: label || 'Xác nhận hủy đặt lịch',
        payload,
        cleanText: label || 'Xác nhận hủy đặt lịch',
      };
    case 'keep-booking':
      return {
        isCommand: true,
        type: 'keep_booking',
        label: label || 'Không hủy nữa',
        cleanText: label || 'Không hủy nữa',
      };
    case 'abandon-booking':
      return {
        isCommand: true,
        type: 'abandon_booking',
        label: label || 'Hủy thao tác',
        cleanText: label || 'Dừng quá trình đặt lịch',
      };
    default:
      return {
        isCommand: true,
        type: 'other',
        label: label || text,
        cleanText: label || text,
      };
  }
}

/**
 * Renders rich cards for visitor structured actions.
 */
export function renderBookingCommandCard(parsed: ParsedBookingMessage) {
  const { type, label, payload, cleanText } = parsed;

  if (type === 'confirm_booking' || type === 'update_draft_booking') {
    const customerName = payload?.customerName;
    const phone = payload?.phone;
    const date = payload?.date;
    const timeSlot = payload?.timeSlot;
    const endTimeSlot = payload?.endTimeSlot;
    const slotCount = payload?.slotCount || payload?.slots?.length || 1;
    const resourceName = payload?.resourceName || payload?.staffName;
    const serviceName = payload?.serviceName;
    const slots = payload?.slots;

    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e0e7ff',
          borderRadius: 12,
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          fontSize: 13,
          minWidth: 260,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            color: '#4f46e5',
            marginBottom: 8,
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: 6,
          }}
        >
          <CheckCircleOutlined style={{ color: '#10b981' }} />
          <span>{label || 'Xác nhận đặt lịch'}</span>
        </div>

        {customerName && (
          <div
            style={{
              color: '#1f2937',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UserOutlined style={{ color: '#6366f1' }} />
            <span>
              <strong>{customerName}</strong>
              {phone ? <span style={{ color: '#6b7280', marginLeft: 8 }}>• {phone}</span> : null}
            </span>
          </div>
        )}

        {(date || timeSlot) && (
          <div
            style={{
              color: '#1f2937',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CalendarOutlined style={{ color: '#6366f1' }} />
            <span>
              <strong>{date ? dayjs(date).format('DD/MM/YYYY') : ''}</strong>
              {timeSlot ? (
                <span style={{ marginLeft: 6 }}>
                  • {timeSlot}
                  {endTimeSlot ? ` - ${endTimeSlot}` : ''}
                </span>
              ) : null}
              {slotCount > 1 ? (
                <Tag color="purple" style={{ marginLeft: 6, fontSize: 11, borderRadius: 10 }}>
                  {slotCount} slots
                </Tag>
              ) : null}
            </span>
          </div>
        )}

        {resourceName && (
          <div
            style={{
              color: '#1f2937',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <EnvironmentOutlined style={{ color: '#6366f1' }} />
            <span>
              Staff / Resource: <strong>{resourceName}</strong>
            </span>
          </div>
        )}

        {serviceName && (
          <div
            style={{
              color: '#1f2937',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ScissorOutlined style={{ color: '#6366f1' }} />
            <span>
              Service: <strong>{serviceName}</strong>
            </span>
          </div>
        )}

        {Array.isArray(slots) && slots.length > 1 && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px dashed #e2e8f0',
              fontSize: 12,
              color: '#64748b',
            }}
          >
            {slots.map((s, idx) => (
              <div key={idx} style={{ lineHeight: 1.6 }}>
                • {s.timeSlot}{' '}
                {s.staffName || s.resourceName ? `- ${s.staffName || s.resourceName}` : ''}{' '}
                {s.serviceName ? `(${s.serviceName})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'select_booking_slot') {
    return (
      <Tag
        color="blue"
        style={{
          borderRadius: 12,
          padding: '4px 12px',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ClockCircleOutlined />
        <span>{cleanText}</span>
      </Tag>
    );
  }

  if (type === 'select_booking_option') {
    return (
      <Tag
        color="cyan"
        style={{
          borderRadius: 12,
          padding: '4px 12px',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <CheckCircleOutlined />
        <span>{cleanText}</span>
      </Tag>
    );
  }

  if (type === 'cancel_booking') {
    return (
      <Tag
        color="red"
        style={{
          borderRadius: 12,
          padding: '4px 12px',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <CloseCircleOutlined />
        <span>{cleanText}</span>
      </Tag>
    );
  }

  return (
    <Tag
      color="default"
      style={{
        borderRadius: 12,
        padding: '4px 12px',
        fontSize: 13,
      }}
    >
      {cleanText}
    </Tag>
  );
}
