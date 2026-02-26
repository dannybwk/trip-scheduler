import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { DAYS, START_HOUR, HOUR_HEIGHT, MINUTE_SNAP, INITIAL_EVENTS } from './constants';
import { timeToDecimal, decimalToTime } from './utils';
import { useDragEvent } from './hooks/useDragEvent';
import CalendarGrid from './components/CalendarGrid';
import EventList from './components/EventList';
import EventModal from './components/EventModal';

const STORAGE_KEY = 'trip-events';

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const [events, setEvents] = useState(() => loadEvents() || INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const gridRef = useRef(null);
  const lastDragEnd = useRef(0);
  const { dragState, handlePointerDown } = useDragEvent(gridRef, setEvents, lastDragEnd);

  // localStorage 持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // --- 表單處理 ---
  const handleOpenModal = (event = null, defaults = null) => {
    if (event && !event.isNew) {
      // 編輯既有事件
      setEditingEvent({ ...event, isNew: false });
    } else {
      // 新增事件，可帶入預設 day/start
      const start = defaults?.start || '10:00';
      const startDec = timeToDecimal(start);
      const endDec = startDec + 2; // 預設 2 小時
      setEditingEvent({
        id: Date.now().toString(),
        title: '',
        category: 'ATTRACTION',
        day: defaults?.day || 9,
        start,
        end: decimalToTime(endDec >= 24 ? endDec - 24 : endDec),
        address: '',
        notes: '',
        link: '',
        isNew: true,
      });
    }
    setIsModalOpen(true);
  };

  // 點擊行事曆空白處 → 新增事件，自動帶入日期與時間
  const handleGridClick = (e) => {
    // 拖曳剛結束，忽略這次 click
    if (Date.now() - lastDragEnd.current < 200) return;
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // 計算天數
    const columnWidth = rect.width / 7;
    const dayIndex = Math.max(0, Math.min(Math.floor(relativeX / columnWidth), 6));
    const day = DAYS[dayIndex].id;

    // 計算時間，吸附到 MINUTE_SNAP
    let startDecimal = (relativeY / HOUR_HEIGHT) + START_HOUR;
    const snap = MINUTE_SNAP / 60;
    startDecimal = Math.round(startDecimal / snap) * snap;
    startDecimal = Math.max(START_HOUR, Math.min(startDecimal, START_HOUR + 22)); // 留空間給 2hr
    const start = decimalToTime(startDecimal >= 24 ? startDecimal - 24 : startDecimal);

    handleOpenModal(null, { day, start });
  };

  const handleSaveEvent = (savedEvent) => {
    // Strip the isNew flag before saving
    const { isNew, ...eventData } = savedEvent;
    if (isNew) {
      setEvents(prev => [...prev, eventData]);
    } else {
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setIsModalOpen(false);
  };

  // 排序事件供列表顯示
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return timeToDecimal(a.start) - timeToDecimal(b.start);
    });
  }, [events]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200 relative" style={{ height: '90vh' }}>

        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center z-20">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-gray-600" />
            排排程
          </h1>
        </div>

        {/* Calendar Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto relative bg-gray-50 flex flex-col">

          {/* Day Headers (Sticky) */}
          <div className="flex sticky top-0 z-30 bg-gray-400 text-white shadow-sm">
            <div className="w-14 flex-shrink-0 border-r border-gray-300" />
            <div className="flex-1 grid grid-cols-7">
              {DAYS.map(day => (
                <div key={day.id} className="text-center py-2 font-medium border-r border-gray-300 last:border-r-0">
                  <div className="text-lg">{day.id}</div>
                  <div className="text-xs opacity-90">{day.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Area */}
          <CalendarGrid
            events={events}
            dragState={dragState}
            gridRef={gridRef}
            onPointerDown={handlePointerDown}
            onOpenModal={handleOpenModal}
            onGridClick={handleGridClick}
          />

          {/* Bottom Event List */}
          <EventList sortedEvents={sortedEvents} onOpenModal={handleOpenModal} />
        </div>

        {/* Floating Action Button — fixed 定位避免被裁切 */}
        <button
          onClick={() => handleOpenModal()}
          className="fixed bottom-8 right-8 w-14 h-14 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 hover:scale-105 transition-all text-gray-800 z-50 focus:outline-none focus:ring-4 focus:ring-yellow-200"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
