import dayjs from 'dayjs';

/**
 * Computes ISO startAt and endAt timestamps for a given date, time slot, and duration.
 */
export function computeSlotInterval(
  date: dayjs.Dayjs | string,
  timeSlot?: string,
  durationMinutes: number = 30,
) {
  const formattedDate = typeof date === 'string' ? date : date.format('YYYY-MM-DD');
  const safeTime = timeSlot || '09:00';
  const startAt = dayjs(`${formattedDate} ${safeTime}`).toISOString();
  const endAt = dayjs(`${formattedDate} ${safeTime}`).add(durationMinutes, 'minute').toISOString();

  return {
    startAt,
    endAt,
    formattedDate,
  };
}

/**
 * Checks if two calendar slots refer to the same resource, time, and day.
 */
export function isSameSlot(
  a: { staffId?: string; resourceId?: string; time?: string; date?: dayjs.Dayjs | string },
  b: { staffId?: string; resourceId?: string; time?: string; date?: dayjs.Dayjs | string },
): boolean {
  const idA = a.staffId || a.resourceId;
  const idB = b.staffId || b.resourceId;
  if (idA !== idB || a.time !== b.time) return false;

  const dateA = typeof a.date === 'string' ? a.date : a.date?.format('YYYY-MM-DD');
  const dateB = typeof b.date === 'string' ? b.date : b.date?.format('YYYY-MM-DD');
  return dateA === dateB;
}
