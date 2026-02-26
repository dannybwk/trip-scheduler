import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Share2, Check } from 'lucide-react';
import { ref, set, remove, onValue } from 'firebase/database';
import { database } from './firebase';
import { DAYS, START_HOUR, HOUR_HEIGHT, MINUTE_SNAP, INITIAL_EVENTS } from './constants';
import { timeToDecimal, decimalToTime } from './utils';
import { useDragEvent } from './hooks/useDragEvent';
import CalendarGrid from './components/CalendarGrid';
import EventList from './components/EventList';
import EventModal from './components/EventModal';

const STORAGE_KEY = 'trip-events';

function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function getRoomId() {
  const hash = window.location.hash.slice(1);
  if (hash && /^[a-z0-9]{4,12}$/.test(hash)) return hash;
  return null;
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [shared, setShared] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const gridRef = useRef(null);
  const lastDragEnd = useRef(0);
  const isFirebaseUpdate = useRef(false);

  // --- Firebase: 寫入單一事件 ---
  const writeEvent = useCallback((rid, event) => {
    const { isNew, ...data } = event;
    set(ref(database, `trips/${rid}/events/${data.id}`), data);
  }, []);

  const removeEvent = useCallback((rid, eventId) => {
    remove(ref(database, `trips/${rid}/events/${eventId}`));
  }, []);

  // --- 拖曳結束回呼 ---
  const handleDragUpdate = useCallback((updatedEvent) => {
    if (roomId) {
      writeEvent(roomId, updatedEvent);
    }
  }, [roomId, writeEvent]);

  const { dragState, handlePointerDown } = useDragEvent(gridRef, setEvents, lastDragEnd, handleDragUpdate);

  // --- 初始化房間 + Firebase 監聽 ---
  useEffect(() => {
    let existingRoomId = getRoomId();

    if (!existingRoomId) {
      // 建立新房間
      existingRoomId = generateRoomId();
      window.location.hash = existingRoomId;

      // 用 localStorage 資料或初始資料建房
      let initialEvents = INITIAL_EVENTS;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) initialEvents = JSON.parse(raw);
      } catch { /* ignore */ }

      // 寫入 Firebase
      const eventsObj = {};
      initialEvents.forEach(ev => { eventsObj[ev.id] = ev; });
      set(ref(database, `trips/${existingRoomId}/events`), eventsObj);
    }

    setRoomId(existingRoomId);

    // 訂閱 Firebase
    const eventsRef = ref(database, `trips/${existingRoomId}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      isFirebaseUpdate.current = true;
      setEvents(list);
    });

    return () => unsubscribe();
  }, []);

  // localStorage 備份（僅在非 Firebase 觸發時寫入，避免多餘寫入也無妨）
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events]);

  // --- 表單處理 ---
  const handleOpenModal = (event = null, defaults = null) => {
    if (event && !event.isNew) {
      setEditingEvent({ ...event, isNew: false });
    } else {
      const start = defaults?.start || '10:00';
      const startDec = timeToDecimal(start);
      const endDec = startDec + 2;
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

  const handleGridClick = (e) => {
    if (Date.now() - lastDragEnd.current < 200) return;
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    const columnWidth = rect.width / 7;
    const dayIndex = Math.max(0, Math.min(Math.floor(relativeX / columnWidth), 6));
    const day = DAYS[dayIndex].id;

    let startDecimal = (relativeY / HOUR_HEIGHT) + START_HOUR;
    const snap = MINUTE_SNAP / 60;
    startDecimal = Math.round(startDecimal / snap) * snap;
    startDecimal = Math.max(START_HOUR, Math.min(startDecimal, START_HOUR + 22));
    const start = decimalToTime(startDecimal >= 24 ? startDecimal - 24 : startDecimal);

    handleOpenModal(null, { day, start });
  };

  const handleSaveEvent = (savedEvent) => {
    const { isNew, ...eventData } = savedEvent;
    if (roomId) {
      writeEvent(roomId, eventData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (roomId) {
      removeEvent(roomId, id);
    }
    setIsModalOpen(false);
  };

  // --- 分享連結（只含 roomId）---
  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      prompt('複製此連結分享給朋友：', url);
    }
  };

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
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${shared ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shared ? '已複製' : '分享'}
          </button>
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

        {/* Floating Action Button */}
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
