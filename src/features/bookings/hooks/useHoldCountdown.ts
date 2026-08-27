import { useState, useEffect, useMemo } from 'react';

export function useHoldCountdown(holdExpiry: Date | null, onHoldExpired: () => void) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!holdExpiry) return;

    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (holdExpiry.getTime() - current.getTime() <= 0) {
        onHoldExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiry, onHoldExpired]);

  const timeLeft = useMemo(() => {
    if (!holdExpiry) return null;
    return Math.max(0, holdExpiry.getTime() - now.getTime());
  }, [holdExpiry, now]);

  const formattedTimeLeft = useMemo(() => {
    if (timeLeft === null || timeLeft <= 0) return '';
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return { timeLeft, formattedTimeLeft };
}
