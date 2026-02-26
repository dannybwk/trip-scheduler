import React from 'react';
import { DAYS, CATEGORIES, START_HOUR, HOUR_HEIGHT } from '../constants';
import { timeToDecimal, normalizeEndTime } from '../utils';

export default function EventBlock({ event, dragState, onPointerDown, onOpenModal }) {
  const isDraggingThis = dragState?.isDragging && dragState.event.id === event.id;
  const isOriginal = dragState?.isDragging && !isDraggingThis;
  const isOriginalOfDragged = isOriginal && dragState.event.id === event.id;

  const startDecimal = timeToDecimal(event.start);
  let endDecimal = timeToDecimal(event.end);
  endDecimal = normalizeEndTime(startDecimal, endDecimal);

  let displayStart = startDecimal;
  if (displayStart < START_HOUR) displayStart += 24;

  const top = (displayStart - START_HOUR) * HOUR_HEIGHT;
  const height = (endDecimal - startDecimal) * HOUR_HEIGHT;
  const dayIndex = DAYS.findIndex(d => d.id === Number(event.day));
  const left = `${(dayIndex / 7) * 100}%`;
  const width = `${100 / 7}%`;

  const categoryStyle = CATEGORIES[event.category] || CATEGORIES.OTHER;

  return (
    <div
      onPointerDown={(e) => isOriginalOfDragged ? null : onPointerDown(e, event)}
      className={`absolute p-0.5 cursor-grab active:cursor-grabbing transition-opacity duration-150 ease-in-out ${isOriginalOfDragged ? 'opacity-30 pointer-events-none' : 'opacity-95'} ${isDraggingThis ? 'z-50 shadow-lg scale-[1.02]' : 'z-10 hover:z-20'}`}
      style={{ top: `${top}px`, height: `${height}px`, left, width }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (dragState?.isDragging) return;
          onOpenModal(event);
        }}
        className={`w-full h-full rounded-md border p-1.5 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${categoryStyle.color}`}
        title="點擊查看/編輯詳情"
      >
        <div className="font-bold text-xs truncate">{event.title}</div>
        <div className="text-[10px] opacity-80 truncate">{event.start}-{event.end}</div>
      </div>
    </div>
  );
}
