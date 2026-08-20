import type dayjs from 'dayjs';

// Raw booking entity as returned by the backend API (nestjs-paginate)
export interface BookingRecord {
  id: string;
  code: string;
  siteId: string;
  resourceId: string | null;
  serviceId: string | null;
  startAt: string; // ISO timestamp string
  endAt: string; // ISO timestamp string
  timezone: string;
  status: string;
  customerName: string;
  phone: string;
  customerEmail: string | null;
  notes: string | null;
  resource: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export type SlotStatus = 'AVAILABLE' | 'HOLDING' | 'BOOKED';
export interface AvailableSlot {
  startAt: string;
  endAt: string;
  status: SlotStatus;
  resourceId?: string;
  availableResources?: { resourceId: string; resourceName: string }[];
}

export interface BookingConfig {
  bookingEnabled: boolean;
  industryTemplate?: string;
  slotDuration: number;
  timezone: string;
  startTime: string;
  endTime: string;
  availableDays?: number[];
  resourceDetails?: { id: string; name: string }[];
  serviceDetails?: { id: string; name: string }[];
  [key: string]: unknown;
}

export interface BlockoutRecord {
  id: string;
  siteId: string;
  resourceId?: string | null;
  resource?: { id: string; name: string } | null;
  startAt: string;
  endAt: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface SelectedCalendarSlot {
  staffId: string;
  staffName: string;
  time: string;
  date: dayjs.Dayjs;
}

export interface ManualBookingFormData {
  date?: dayjs.Dayjs;
  timeSlot?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId?: string;
  serviceIds?: string[];
  staffId?: string;
  notes?: string;
  slots?: Array<{
    resourceId: string;
    date: string;
    timeSlot: string;
    serviceId?: string;
  }>;
}

export interface CreateBlockoutFormData {
  resourceId?: string | null;
  startAt: string;
  endAt: string;
  reason?: string | null;
}
