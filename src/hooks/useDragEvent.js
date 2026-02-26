import { useState, useEffect, useCallback } from 'react';
import { HOUR_HEIGHT, MINUTE_SNAP } from '../constants';
import { timeToDecimal, decimalToTime, normalizeEndTime } from '../utils';

const DRAG_THRESHOLD = 5;

export function useDragEvent(gridRef, setEvents, lastDragEnd, onUpdateEvent, visibleDays, startHour, totalHours) {
  const [dragState, setDragState] = useState(null);

  const handlePointerDown = useCallback((e, event) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = gridRef.current.getBoundingClientRect();

    const startDecimal = timeToDecimal(event.start);
    let displayStart = startDecimal;
    if (displayStart < startHour) displayStart += 24;
    const eventTop = (displayStart - startHour) * HOUR_HEIGHT;
    const offsetY = e.clientY - rect.top - eventTop;

    setDragState({
      event: { ...event },
      isDragging: false,
      offsetY,
      startX: e.clientX,
      startY: e.clientY,
    });
  }, [gridRef, startHour]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      if (!gridRef.current) return;

      if (!dragState.isDragging) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        setDragState(prev => ({ ...prev, isDragging: true }));
      }

      const rect = gridRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const columnWidth = rect.width / visibleDays.length;
      let newDayIndex = Math.floor(relativeX / columnWidth);
      newDayIndex = Math.max(0, Math.min(newDayIndex, visibleDays.length - 1));
      const newDay = visibleDays[newDayIndex].id;

      const adjustedY = relativeY - dragState.offsetY;
      let newStartDecimal = (adjustedY / HOUR_HEIGHT) + startHour;

      const snapDecimal = MINUTE_SNAP / 60;
      newStartDecimal = Math.round(newStartDecimal / snapDecimal) * snapDecimal;

      const duration = normalizeEndTime(timeToDecimal(dragState.event.start), timeToDecimal(dragState.event.end)) - timeToDecimal(dragState.event.start);
      if (newStartDecimal < startHour) newStartDecimal = startHour;
      if (newStartDecimal + duration > startHour + totalHours) newStartDecimal = startHour + totalHours - duration;

      const newStart = decimalToTime(newStartDecimal);
      const newEndDecimal = newStartDecimal + duration;
      const newEnd = decimalToTime(newEndDecimal >= 24 ? newEndDecimal - 24 : newEndDecimal);

      setDragState(prev => ({
        ...prev,
        event: { ...prev.event, day: newDay, start: newStart, end: newEnd },
      }));
    };

    const handlePointerUp = () => {
      if (dragState && dragState.isDragging) {
        setEvents(prev => prev.map(e => e.id === dragState.event.id ? dragState.event : e));
        if (onUpdateEvent) onUpdateEvent(dragState.event);
        if (lastDragEnd) lastDragEnd.current = Date.now();
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, gridRef, setEvents, visibleDays, startHour, totalHours]);

  return { dragState, handlePointerDown };
}
