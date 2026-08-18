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

export interface BookingConfig {
  bookingEnabled: boolean;
  slotDuration: number;
  timezone: string;
  startTime: string;
  endTime: string;
  availableDays?: number[];
  resourceDetails?: { id: string; name: string }[];
  serviceDetails?: { id: string; name: string }[];
  [key: string]: unknown;
}
