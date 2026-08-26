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
  services?: { id: string; name: string }[];
  templateFields?: {
    slots?: Array<{
      date?: string;
      timeSlot?: string;
      serviceId?: string;
      serviceName?: string;
      resourceId?: string;
      staffName?: string;
      notes?: string;
    }>;
    serviceNames?: string[];
    serviceIds?: string[];
    slotCount?: number;
    [key: string]: unknown;
  };
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
  services?: string[];
  resources?: string[];
  resourceDetails?: { id: string; name: string }[];
  serviceDetails?: { id: string; name: string }[];
  [key: string]: unknown;
}

/** DTO for updating site booking configuration */
export interface UpdateBookingConfigPayload {
  bookingEnabled: boolean;
  industryTemplate: string;
  timezone: string;
  slotDuration: number;
  startTime: string;
  endTime: string;
  availableDays: number[];
  services: string[];
  resources: string[];
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

/** Slot item inside a multi-slot admin booking request */
export interface AdminBookingSlotItem {
  resourceId: string;
  date: string;
  timeSlot: string;
  serviceId?: string;
  notes?: string;
}

/** DTO for creating a manual / admin booking */
export interface CreateAdminBookingPayload {
  startAt?: string;
  endAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId?: string;
  serviceIds?: string[];
  staffId?: string;
  slots?: AdminBookingSlotItem[];
  notes?: string;
  timezone: string;
  sessionId: string;
}

/** Form data submitted by ManualBookingModal */
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
  slots?: AdminBookingSlotItem[];
}

/** Form values collected by Ant Design Form in ManualBookingModal */
export interface ManualBookingFormValues {
  date?: dayjs.Dayjs | dayjs.Dayjs[] | string;
  timeSlot?: string | string[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId?: string;
  staffId?: string | string[];
  notes?: string;
  slotServices?: Record<number | string, string> | string[];
  slotNotes?: Record<number | string, string> | string[];
}

export interface CreateBlockoutFormData {
  resourceId?: string | null;
  startAt: string;
  endAt: string;
  reason?: string | null;
}

export interface HoldSlotItem {
  resourceId: string;
  startAt: string;
  endAt: string;
  serviceId?: string;
}

export interface HoldSlotsPayload {
  sessionId: string;
  slots: HoldSlotItem[];
}

export interface HoldSlotsResponse {
  success: boolean;
  sessionId?: string;
}

export interface ReleaseHoldsPayload {
  sessionId: string;
  slots?: Array<{
    resourceId: string;
    startAt: string;
    endAt: string;
  }>;
}

export interface ReleaseHoldsResponse {
  success: boolean;
}

export interface BulkCancelPayload {
  bookingIds: string[];
}

export interface BulkCancelResponse {
  success: boolean;
  cancelledCount: number;
}
