import dayjs from 'dayjs';
import type {
  AdminBookingSlotItem,
  AvailableSlot,
  BookingConfig,
  ManualBookingFormData,
  ManualBookingFormValues,
  SelectedCalendarSlot,
} from '../types/booking.types';

export const phoneValidator = (_: unknown, value: string) => {
  if (!value) return Promise.resolve();
  const phoneRegex = /^0[0-9]{9,10}$/;
  if (!phoneRegex.test(value)) {
    return Promise.reject(new Error('Phone must match Vietnamese format (0xxxxxxxxx).'));
  }
  return Promise.resolve();
};

export function getEffectiveServices(
  siteServices?: { id: string; name: string }[],
  config?: BookingConfig | null,
): Array<{ id: string; name: string }> {
  const list =
    siteServices && siteServices.length > 0
      ? siteServices
      : config?.serviceDetails && config.serviceDetails.length > 0
        ? config.serviceDetails
        : (config?.services as Array<{ id?: string; name?: string } | string>) || [];
  return list.map((s) => {
    if (typeof s === 'string') return { id: s, name: s };
    return { id: s.id || s.name || 'service', name: s.name || s.id || 'Service' };
  });
}

export function getEffectiveStaff(
  siteStaff?: { id: string; name: string }[],
  config?: BookingConfig | null,
): Array<{ id: string; name: string }> {
  const list =
    siteStaff && siteStaff.length > 0
      ? siteStaff
      : config?.resourceDetails && config.resourceDetails.length > 0
        ? config.resourceDetails
        : (config?.resources as Array<{ id?: string; name?: string } | string>) || [];
  return list.map((s) => {
    if (typeof s === 'string') return { id: s, name: s };
    return { id: s.id || s.name || 'staff', name: s.name || s.id || 'Staff' };
  });
}

export function buildTimeSlotOptions(
  availableSlots: AvailableSlot[],
  selectedStaffIds: string[],
  selectedFormDates: dayjs.Dayjs[],
  effectiveStaff: Array<{ id: string; name: string }>,
) {
  const options: Array<{
    value: string;
    label: string;
    startAt: string;
    endAt: string;
    resourceId: string;
    resourceName: string;
    isHolding: boolean;
  }> = [];

  for (const slot of availableSlots) {
    const time = dayjs(slot.startAt).format('HH:mm');
    const dateLabel = dayjs(slot.startAt).format('DD/MM');
    const baseTimeStr = selectedFormDates.length > 1 ? `${dateLabel} ${time}` : time;
    const isHolding = slot.status === 'HOLDING';

    if (slot.availableResources && slot.availableResources.length > 0) {
      for (const res of slot.availableResources) {
        if (selectedStaffIds.length > 0 && !selectedStaffIds.includes(res.resourceId)) {
          continue;
        }
        const displayLabel =
          selectedStaffIds.length > 1 ? `${baseTimeStr} — 👤 ${res.resourceName}` : baseTimeStr;
        options.push({
          value: `${slot.startAt}__${res.resourceId}`,
          label: isHolding ? `${displayLabel} - Being booked... 🕒` : displayLabel,
          startAt: slot.startAt,
          endAt: slot.endAt,
          resourceId: res.resourceId,
          resourceName: res.resourceName,
          isHolding,
        });
      }
    } else {
      const resId = slot.resourceId || selectedStaffIds[0] || '';
      const resObj = effectiveStaff.find((s) => s.id === resId);
      const resName = resObj?.name || 'Staff';
      const displayLabel =
        selectedStaffIds.length > 1 ? `${baseTimeStr} — 👤 ${resName}` : baseTimeStr;
      options.push({
        value: `${slot.startAt}__${resId}`,
        label: isHolding ? `${displayLabel} - Being booked... 🕒` : displayLabel,
        startAt: slot.startAt,
        endAt: slot.endAt,
        resourceId: resId,
        resourceName: resName,
        isHolding,
      });
    }
  }
  return options;
}

export function convertFormToBookingPayload({
  values,
  isMultiSlot,
  totalSlots,
  selectedSlots,
  selectedTimeSlotsArr,
  timeSlotOptions,
  availableSlots,
  selectedStaffIds,
  selectedFormDates,
}: {
  values: ManualBookingFormValues;
  isMultiSlot: boolean;
  totalSlots: number;
  selectedSlots: SelectedCalendarSlot[];
  selectedTimeSlotsArr: string[];
  timeSlotOptions: ReturnType<typeof buildTimeSlotOptions>;
  availableSlots: AvailableSlot[];
  selectedStaffIds: string[];
  selectedFormDates: dayjs.Dayjs[];
}): ManualBookingFormData {
  const slotServicesList: string[] = [];
  const slotNotesRaw: string[] = [];
  if (totalSlots > 1) {
    for (let i = 0; i < totalSlots; i++) {
      const sId =
        (Array.isArray(values.slotServices) ? values.slotServices[i] : values.slotServices?.[i]) ||
        values.serviceId;
      if (sId) slotServicesList.push(sId);

      const sNote =
        (Array.isArray(values.slotNotes) ? values.slotNotes[i] : values.slotNotes?.[i]) || '';
      slotNotesRaw.push(sNote.trim());
    }
  } else {
    if (values.serviceId) {
      slotServicesList.push(values.serviceId);
    }
    const singleSlotNote =
      (Array.isArray(values.slotNotes) ? values.slotNotes[0] : values.slotNotes?.[0]) || '';
    slotNotesRaw.push(singleSlotNote.trim());
  }

  const singleServiceId = slotServicesList[0] || values.serviceId;
  const serviceIds = slotServicesList.length > 0 ? slotServicesList : undefined;

  let slotsPayload: AdminBookingSlotItem[] | undefined = undefined;

  if (isMultiSlot) {
    slotsPayload = selectedSlots.map((s, idx) => {
      const parsed = dayjs(s.date);
      return {
        resourceId: s.staffId,
        date: parsed.isValid() ? parsed.format('YYYY-MM-DD') : String(s.date),
        timeSlot: s.time,
        serviceId: slotServicesList[idx] || slotServicesList[0],
        notes: slotNotesRaw[idx] || undefined,
      };
    });
  } else if (selectedTimeSlotsArr.length > 1 || selectedFormDates.length > 0) {
    slotsPayload = selectedTimeSlotsArr.map((timeVal, idx) => {
      const opt = timeSlotOptions.find((o) => o.value === timeVal);
      const matchedSlot = availableSlots.find(
        (s) => s.startAt === timeVal || (opt && s.startAt === opt.startAt),
      );
      const slotStartAt = opt ? opt.startAt : matchedSlot ? matchedSlot.startAt : timeVal;
      const slotDate = dayjs(slotStartAt).isValid()
        ? dayjs(slotStartAt).format('YYYY-MM-DD')
        : selectedFormDates[0]
          ? selectedFormDates[0].format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD');
      const slotTime = dayjs(slotStartAt).isValid() ? dayjs(slotStartAt).format('HH:mm') : timeVal;
      const slotResourceId =
        opt?.resourceId ||
        selectedStaffIds[0] ||
        (typeof values.staffId === 'string' ? values.staffId : values.staffId?.[0]) ||
        '';

      return {
        resourceId: slotResourceId,
        date: slotDate,
        timeSlot: slotTime,
        serviceId: slotServicesList[idx] || slotServicesList[0],
        notes: slotNotesRaw[idx] || undefined,
      };
    });
  }

  let finalDate = '';
  let finalTime = '';
  let finalResourceId = '';

  if (isMultiSlot) {
    finalDate = dayjs(selectedSlots[0]?.date).isValid()
      ? dayjs(selectedSlots[0]?.date).format('YYYY-MM-DD')
      : String(selectedSlots[0]?.date || '');
    finalTime = selectedSlots[0]?.time || '';
    finalResourceId = selectedSlots[0]?.staffId || '';
  } else {
    const rawTimeSlot = selectedTimeSlotsArr[0] || '';
    const opt = timeSlotOptions.find((o) => o.value === rawTimeSlot);
    const matchedSlot = availableSlots.find(
      (s) => s.startAt === rawTimeSlot || (opt && s.startAt === opt.startAt),
    );
    const resolvedStartAt = opt ? opt.startAt : matchedSlot ? matchedSlot.startAt : rawTimeSlot;

    finalDate = dayjs(resolvedStartAt).isValid()
      ? dayjs(resolvedStartAt).format('YYYY-MM-DD')
      : selectedFormDates[0]
        ? selectedFormDates[0].format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');

    finalTime = dayjs(resolvedStartAt).isValid()
      ? dayjs(resolvedStartAt).format('HH:mm')
      : rawTimeSlot;

    finalResourceId =
      opt?.resourceId ||
      selectedStaffIds[0] ||
      (typeof values.staffId === 'string' ? values.staffId : values.staffId?.[0]) ||
      '';
  }

  const parsedDate = values.date
    ? dayjs.isDayjs(values.date)
      ? values.date
      : Array.isArray(values.date) && values.date[0] && dayjs.isDayjs(values.date[0])
        ? values.date[0]
        : dayjs(values.date as string)
    : finalDate
      ? dayjs(finalDate)
      : undefined;

  const generalNote = values.notes?.trim() || '';
  const topLevelNote =
    totalSlots === 1 && slotNotesRaw[0]
      ? [generalNote, slotNotesRaw[0]].filter(Boolean).join('\n')
      : generalNote;

  return {
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail?.trim() || undefined,
    customerPhone: values.customerPhone.trim(),
    serviceId: singleServiceId,
    serviceIds,
    staffId: finalResourceId || undefined,
    date: parsedDate && parsedDate.isValid() ? parsedDate : undefined,
    timeSlot: finalTime || undefined,
    notes: topLevelNote || undefined,
    slots: slotsPayload,
  };
}
