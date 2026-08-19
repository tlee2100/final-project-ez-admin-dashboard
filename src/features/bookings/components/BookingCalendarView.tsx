import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { Tooltip } from 'antd';

import type { BookingRecord, BlockoutRecord } from '../types/booking.types';

interface BookingCalendarViewProps {
  data: BookingRecord[];
  staff: { id: string; name: string }[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  availableDays?: number[];
  onBookingClick: (booking: BookingRecord) => void;
  onEmptySlotClick?: (staffId: string, time: string) => void;
  selectedDate: dayjs.Dayjs;
  holdingSlots?: { resourceId?: string; startAt: string; endAt: string }[];
  bookingEnabled?: boolean;
  blockouts?: BlockoutRecord[];
  onDeleteBlockout?: (blockout: BlockoutRecord) => void;
}

export function BookingCalendarView({
  data,
  staff,
  startTime,
  endTime,
  slotDuration,
  availableDays,
  selectedDate,
  onBookingClick,
  onEmptySlotClick,
  holdingSlots = [],
  bookingEnabled = true,
  blockouts = [],
  onDeleteBlockout,
}: BookingCalendarViewProps) {
  const now = dayjs();
  const currentDayOfWeek = selectedDate.day() === 0 ? 7 : selectedDate.day();
  const isInactiveDay = availableDays ? !availableDays.includes(currentDayOfWeek) : false;
  const isPastDate = selectedDate.startOf('day').isBefore(now.startOf('day'));
  const isToday = selectedDate.startOf('day').isSame(now.startOf('day'));
  const nowMins = now.hour() * 60 + now.minute();

  const indicatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isToday && indicatorRef.current) {
      setTimeout(() => {
        indicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate, isToday]);

  // Generate intervals from startTime to endTime based on slotDuration
  const timeSlots: string[] = [];
  let current = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);

  while (current.isBefore(end)) {
    timeSlots.push(current.format('HH:mm'));
    current = current.add(slotDuration, 'minute');
  }

  // Returns all bookings for a staff member whose startAt falls within this time slot
  const getBookingsForSlot = (staffId: string, time: string) => {
    const slotStartMins = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const slotEndMins = slotStartMins + slotDuration;

    return data.filter((b) => {
      if (b.resourceId !== staffId) return false;
      const bookingStart = dayjs(b.startAt);
      const bookingStartMins = bookingStart.hour() * 60 + bookingStart.minute();
      return bookingStartMins >= slotStartMins && bookingStartMins < slotEndMins;
    });
  };

  const getStatusNormalized = (status: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : status;

  return (
    <div className="booking-calendar-container" ref={containerRef}>
      <div className="calendar-grid">
        {/* Header Row */}
        <div className="calendar-header-row">
          <div className="calendar-time-col">Time</div>
          {staff.map((s) => (
            <div key={s.id} className="calendar-staff-col">
              {s.name}
            </div>
          ))}
        </div>

        {/* Body Rows */}
        {timeSlots.map((time) => {
          const slotStartMins = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
          const slotEndMins = slotStartMins + slotDuration;
          const isCurrentSlot = isToday && nowMins >= slotStartMins && nowMins < slotEndMins;
          const currentTopPercent = isCurrentSlot
            ? ((nowMins - slotStartMins) / slotDuration) * 100
            : 0;

          return (
            <div key={time} className="calendar-body-row" style={{ position: 'relative' }}>
              {isCurrentSlot && (
                <div
                  ref={indicatorRef}
                  style={{
                    position: 'absolute',
                    top: `${currentTopPercent}%`,
                    left: '80px',
                    right: 0,
                    height: 2,
                    backgroundColor: '#ef4444',
                    zIndex: 20,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: -5,
                      top: -4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                    }}
                  />
                </div>
              )}
              <div className="calendar-time-col">{time}</div>

              {staff.map((s) => {
                const slotBookings = getBookingsForSlot(s.id, time);
                return (
                  <div key={`${s.id}-${time}`} className="calendar-cell">
                    {slotBookings.length > 0 ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {slotBookings.map((booking) => {
                          const bookingStart = dayjs(booking.startAt);
                          const bookingEnd = dayjs(booking.endAt);
                          const bookingStartMins = bookingStart.hour() * 60 + bookingStart.minute();
                          const bookingEndMins = bookingEnd.hour() * 60 + bookingEnd.minute();
                          const bookingDuration = bookingEndMins - bookingStartMins;

                          const slotStartMins =
                            parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
                          const topPercent =
                            ((bookingStartMins - slotStartMins) / slotDuration) * 100;
                          const heightPercent = (bookingDuration / slotDuration) * 100;

                          // Side-by-side columns for overlapping bookings
                          const overlapping = slotBookings.filter(
                            (b) =>
                              dayjs(b.startAt).hour() * 60 + dayjs(b.startAt).minute() ===
                              bookingStartMins,
                          );
                          const colCount = overlapping.length;
                          const colIdx = overlapping.indexOf(booking);
                          const colWidth = 100 / colCount;
                          const colLeft = colIdx * colWidth;

                          const isSmall = (bookingDuration / slotDuration) * 120 <= 40;
                          const normalizedStatus = getStatusNormalized(booking.status);
                          const timeLabel = `${bookingStart.format('HH:mm')} - ${bookingEnd.format('HH:mm')}`;

                          return (
                            <Tooltip
                              key={booking.id}
                              title={
                                <div>
                                  <div>
                                    <strong>{booking.customerName}</strong>
                                  </div>
                                  <div>{booking.service?.name}</div>
                                  <div>{timeLabel}</div>
                                </div>
                              }
                            >
                              <div
                                className={`booking-block ${normalizedStatus === 'Cancelled' ? 'booking-cancelled' : ''} ${normalizedStatus === 'Completed' ? 'booking-completed' : ''}`}
                                onClick={() => onBookingClick(booking)}
                                style={{
                                  position: 'absolute',
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                  left: `calc(${colLeft}% + 2px)`,
                                  width: `calc(${colWidth}% - 4px)`,
                                  display: 'flex',
                                  flexDirection: isSmall ? 'row' : 'column',
                                  gap: isSmall ? '4px' : '0',
                                  overflow: 'hidden',
                                  boxSizing: 'border-box',
                                  zIndex: 10,
                                  padding: isSmall ? '2px 8px' : '4px 8px',
                                  alignItems: isSmall ? 'center' : 'flex-start',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: isSmall ? 11 : undefined,
                                  }}
                                >
                                  {booking.customerName}
                                </div>
                                {!isSmall && (
                                  <div
                                    style={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {booking.service?.name}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: 11,
                                    opacity: 0.8,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {isSmall ? bookingStart.format('HH:mm') : timeLabel}
                                </div>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      (() => {
                        const [slotHour, slotMin] = time.split(':').map(Number);
                        const slotDateTime = selectedDate.clone().hour(slotHour).minute(slotMin);
                        const slotEndDateTime = slotDateTime.clone().add(slotDuration, 'minute');
                        const isPastSlot = isPastDate || (isToday && slotDateTime.isBefore(now));
                        const isUnavailable = !bookingEnabled || isPastSlot || isInactiveDay;

                        // Check if this slot overlaps with an active blockout
                        const activeBlockout = blockouts.find((bo) => {
                          const boStart = dayjs(bo.startAt);
                          const boEnd = dayjs(bo.endAt);
                          const matchesResource = !bo.resourceId || bo.resourceId === s.id;
                          return (
                            matchesResource &&
                            slotDateTime.isBefore(boEnd) &&
                            slotEndDateTime.isAfter(boStart)
                          );
                        });

                        if (activeBlockout) {
                          const isWholeSalon = !activeBlockout.resourceId;
                          return (
                            <Tooltip
                              title={
                                <div>
                                  <div style={{ fontWeight: 600 }}>🔒 Blocked Time</div>
                                  <div>
                                    {activeBlockout.reason ||
                                      (isWholeSalon ? 'Entire Salon Closed' : `${s.name} on Leave`)}
                                  </div>
                                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                                    {dayjs(activeBlockout.startAt).format('DD/MM HH:mm')} -{' '}
                                    {dayjs(activeBlockout.endAt).format('DD/MM HH:mm')}
                                  </div>
                                  {onDeleteBlockout && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        color: '#f87171',
                                        fontWeight: 600,
                                        fontSize: 12,
                                      }}
                                    >
                                      Click to remove blockout ✕
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <div
                                onClick={() => onDeleteBlockout && onDeleteBlockout(activeBlockout)}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#fee2e2',
                                  border: '1px dashed #f87171',
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                  cursor: onDeleteBlockout ? 'pointer' : 'not-allowed',
                                  color: '#991b1b',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  padding: '0 4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <span>🔒</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {activeBlockout.reason || (isWholeSalon ? 'Closed' : 'Leave')}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        }

                        // Check if this specific slot is currently being held
                        const isHolding = holdingSlots.some((hold) => {
                          const holdStart = dayjs(hold.startAt);
                          return (
                            (hold.resourceId === s.id || !hold.resourceId) &&
                            holdStart.isSame(slotDateTime, 'minute')
                          );
                        });

                        if (isHolding) {
                          return (
                            <Tooltip title="This slot is currently being held">
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#fef08a',
                                  cursor: 'not-allowed',
                                  pointerEvents: 'none',
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                }}
                              >
                                🕒
                              </div>
                            </Tooltip>
                          );
                        }

                        return isUnavailable ? (
                          <Tooltip
                            title={
                              !bookingEnabled
                                ? 'Booking is disabled for this site'
                                : isInactiveDay
                                  ? 'Staff not available on this day'
                                  : 'Cannot book in the past'
                            }
                          >
                            <div
                              className="calendar-past-slot"
                              style={{
                                width: '100%',
                                height: '100%',
                                cursor: 'not-allowed',
                                borderRadius: 4,
                                backgroundColor: '#f3f4f6',
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title={`Book ${s.name} at ${time}`}>
                            <div
                              className="calendar-empty-slot"
                              style={{
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                borderRadius: 4,
                              }}
                              onClick={() => onEmptySlotClick && onEmptySlotClick(s.id, time)}
                            />
                          </Tooltip>
                        );
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
