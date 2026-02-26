import React from 'react';
import { MapPin, Link as LinkIcon } from 'lucide-react';
import { DAYS, CATEGORIES } from '../constants';

export default function EventList({ sortedEvents, onOpenModal }) {
  return (
    <div className="p-6 bg-white border-t border-gray-200 pb-24">
      <h2 className="text-lg font-bold mb-4">Event (照時間順序)</h2>
      <div className="space-y-2">
        {sortedEvents.map(event => {
          const cat = CATEGORIES[event.category] || CATEGORIES.OTHER;
          const dotColor = cat.color.split(' ')[0]; // e.g. "bg-orange-200"
          return (
            <div key={`list-${event.id}`} className="flex items-start gap-3 text-sm">
              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
              <div className="flex-1">
                <span
                  className="font-semibold cursor-pointer text-blue-700 hover:text-blue-500 hover:underline transition-colors"
                  onClick={() => onOpenModal(event)}
                  title="點擊查看/編輯詳情"
                >
                  {event.title}
                </span>
                {' '}:({' '}
                {DAYS.find(d => d.id === Number(event.day))?.name}{' '}
                {event.start}-{event.end}
                {event.notes && ` | ${event.notes}`}
                {' '})
              </div>
              <div className="flex gap-2">
                {event.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {event.link && (
                  <a href={event.link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1 rounded">
                    <LinkIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {sortedEvents.length === 0 && (
          <div className="text-gray-400 text-sm italic">尚無行程，點擊右下角新增。</div>
        )}
      </div>
    </div>
  );
}
