import { useState, useEffect, useCallback } from 'react';
import { DAYS, START_HOUR, TOTAL_HOURS, HOUR_HEIGHT, MINUTE_SNAP } from '../constants';
import { timeToDecimal, decimalToTime, normalizeEndTime } from '../utils';

const DRAG_THRESHOLD = 5; // px — 移動超過此值才算拖曳

export function useDragEvent(gridRef, setEvents) {
  const [dragState, setDragState] = useState(null);

  const handlePointerDown = useCallback((e, event) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = gridRef.current.getBoundingClientRect();

    const startDecimal = timeToDecimal(event.start);
    const eventTop = (startDecimal < START_HOUR ? startDecimal + 24 - START_HOUR : startDecimal - START_HOUR) * HOUR_HEIGHT;
    const offsetY = e.clientY - rect.top - eventTop;

    setDragState({
      event: { ...event },
      isDragging: false, // 尚未真正開始拖曳
      offsetY,
      startX: e.clientX,
      startY: e.clientY,
    });
  }, [gridRef]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      if (!gridRef.current) return;

      // 還沒超過 threshold，檢查是否開始拖曳
      if (!dragState.isDragging) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        // 超過 threshold，正式開始拖曳
        setDragState(prev => ({ ...prev, isDragging: true }));
      }

      const rect = gridRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      // 計算新的天數
      const columnWidth = rect.width / 7;
      let newDayIndex = Math.floor(relativeX / columnWidth);
      newDayIndex = Math.max(0, Math.min(newDayIndex, 6));
      const newDay = DAYS[newDayIndex].id;

      // 計算新的時間
      const adjustedY = relativeY - dragState.offsetY;
      let newStartDecimal = (adjustedY / HOUR_HEIGHT) + START_HOUR;

      const snapDecimal = MINUTE_SNAP / 60;
      newStartDecimal = Math.round(newStartDecimal / snapDecimal) * snapDecimal;

      const duration = normalizeEndTime(timeToDecimal(dragState.event.start), timeToDecimal(dragState.event.end)) - timeToDecimal(dragState.event.start);
      if (newStartDecimal < START_HOUR) newStartDecimal = START_HOUR;
      if (newStartDecimal + duration > START_HOUR + TOTAL_HOURS) newStartDecimal = START_HOUR + TOTAL_HOURS - duration;

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
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, gridRef, setEvents]);

  return { dragState, handlePointerDown };
}
