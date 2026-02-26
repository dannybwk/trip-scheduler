import React from 'react';
import { HOUR_HEIGHT } from '../constants';
import EventBlock from './EventBlock';

export default function CalendarGrid({ events, dragState, gridRef, onPointerDown, onOpenModal, onGridClick, visibleDays, startHour, totalHours }) {
  // 合併：正常事件 + 拖曳中的預覽
  const renderEvents = dragState?.isDragging
    ? [...events, dragState.event]
    : events;

  // 只顯示在可見天數內的事件
  const visibleDayIds = new Set(visibleDays.map(d => d.id));
  const filteredEvents = renderEvents.filter(ev => visibleDayIds.has(Number(ev.day)));

  return (
    <div className="flex flex-1 relative">
      {/* Time Column */}
      <div className="w-14 flex-shrink-0 bg-gray-100 border-r border-gray-200 flex flex-col">
        {Array.from({ length: totalHours }).map((_, i) => {
          const hour = (startHour + i) % 24;
          return (
            <div key={i} className="text-right pr-2 text-xs text-gray-500 relative" style={{ height: `${HOUR_HEIGHT}px` }}>
              <span className="absolute -top-2 right-2">{String(hour).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>

      {/* Events Grid Container */}
      <div
        ref={gridRef}
        className="flex-1 relative cursor-pointer overflow-hidden"
        style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
        onClick={onGridClick}
      >
        {/* Grid Lines */}
        {Array.from({ length: totalHours }).map((_, i) => (
          <div key={`line-${i}`} className="absolute w-full border-t border-gray-200" style={{ top: `${i * HOUR_HEIGHT}px` }} />
        ))}

        {/* Column Dividers */}
        <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}>
          {visibleDays.map((_, i) => (
            <div key={`col-${i}`} className="border-r border-gray-200 last:border-r-0 h-full" />
          ))}
        </div>

        {/* Render Events */}
        {filteredEvents.map((event) => {
          const isDragCopy = dragState?.isDragging && dragState.event.id === event.id && event === dragState.event;
          return (
            <EventBlock
              key={isDragCopy ? 'dragging-copy' : event.id}
              event={event}
              dragState={dragState}
              onPointerDown={onPointerDown}
              onOpenModal={onOpenModal}
              visibleDays={visibleDays}
              startHour={startHour}
            />
          );
        })}
      </div>
    </div>
  );
}
