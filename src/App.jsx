import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Share2, Check, SlidersHorizontal } from 'lucide-react';
import { ref, set, remove, onValue } from 'firebase/database';
import { database } from './firebase';
import { DAYS, HOUR_HEIGHT, MINUTE_SNAP, INITIAL_EVENTS } from './constants';
import { timeToDecimal, decimalToTime } from './utils';
import { useDragEvent } from './hooks/useDragEvent';
import CalendarGrid from './components/CalendarGrid';
import EventList from './components/EventList';
import EventModal from './components/EventModal';

const STORAGE_KEY = 'trip-events';
const DEFAULT_SETTINGS = { startHour: 9, endHour: 24, hiddenDays: [] };

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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [shared, setShared] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const gridRef = useRef(null);
  const lastDragEnd = useRef(0);

  // --- 計算可見天數與時數 ---
  const visibleDays = useMemo(
    () => DAYS.filter(d => !settings.hiddenDays.includes(d.id)),
    [settings.hiddenDays]
  );
  const startHour = settings.startHour;
  const totalHours = settings.endHour - settings.startHour;

  // --- Firebase: 寫入 ---
  const writeEvent = useCallback((rid, event) => {
    const { isNew, ...data } = event;
    set(ref(database, `trips/${rid}/events/${data.id}`), data);
  }, []);

  const removeEvent = useCallback((rid, eventId) => {
    remove(ref(database, `trips/${rid}/events/${eventId}`));
  }, []);

  const updateSettings = useCallback((newSettings) => {
    if (roomId) {
      set(ref(database, `trips/${roomId}/settings`), newSettings);
    }
  }, [roomId]);

  // --- 拖曳結束回呼 ---
  const handleDragUpdate = useCallback((updatedEvent) => {
    if (roomId) writeEvent(roomId, updatedEvent);
  }, [roomId, writeEvent]);

  const { dragState, handlePointerDown } = useDragEvent(
    gridRef, setEvents, lastDragEnd, handleDragUpdate,
    visibleDays, startHour, totalHours
  );

  // --- 初始化房間 + Firebase 監聽 ---
  useEffect(() => {
    let existingRoomId = getRoomId();

    if (!existingRoomId) {
      existingRoomId = generateRoomId();
      window.location.hash = existingRoomId;

      let initialEvents = INITIAL_EVENTS;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) initialEvents = JSON.parse(raw);
      } catch { /* ignore */ }

      const eventsObj = {};
      initialEvents.forEach(ev => { eventsObj[ev.id] = ev; });
      set(ref(database, `trips/${existingRoomId}/events`), eventsObj);
      set(ref(database, `trips/${existingRoomId}/settings`), DEFAULT_SETTINGS);
    }

    setRoomId(existingRoomId);

    // 訂閱 events
    const eventsRef = ref(database, `trips/${existingRoomId}/events`);
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      setEvents(data ? Object.values(data) : []);
    });

    // 訂閱 settings
    const settingsRef = ref(database, `trips/${existingRoomId}/settings`);
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
    });

    return () => { unsubEvents(); unsubSettings(); };
  }, []);

  // localStorage 備份
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events]);

  // --- 設定操作 ---
  const toggleDay = (dayId) => {
    const hidden = settings.hiddenDays.includes(dayId)
      ? settings.hiddenDays.filter(id => id !== dayId)
      : [...settings.hiddenDays, dayId];
    updateSettings({ ...settings, hiddenDays: hidden });
  };

  const changeStartHour = (h) => {
    const newStart = Number(h);
    if (newStart < settings.endHour) updateSettings({ ...settings, startHour: newStart });
  };

  const changeEndHour = (h) => {
    const newEnd = Number(h);
    if (newEnd > settings.startHour) updateSettings({ ...settings, endHour: newEnd });
  };

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
        day: defaults?.day || visibleDays[0]?.id || 9,
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

    const columnWidth = rect.width / visibleDays.length;
    const dayIndex = Math.max(0, Math.min(Math.floor(relativeX / columnWidth), visibleDays.length - 1));
    const day = visibleDays[dayIndex].id;

    let startDecimal = (relativeY / HOUR_HEIGHT) + startHour;
    const snap = MINUTE_SNAP / 60;
    startDecimal = Math.round(startDecimal / snap) * snap;
    startDecimal = Math.max(startHour, Math.min(startDecimal, startHour + totalHours - 2));
    const start = decimalToTime(startDecimal >= 24 ? startDecimal - 24 : startDecimal);

    handleOpenModal(null, { day, start });
  };

  const handleSaveEvent = (savedEvent) => {
    const { isNew, ...eventData } = savedEvent;
    if (roomId) writeEvent(roomId, eventData);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (roomId) removeEvent(roomId, id);
    setIsModalOpen(false);
  };

  // --- 分享連結 ---
  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${roomId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '排排程', url });
        return;
      } catch { /* 使用者取消 */ }
    }
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

  // 時間選項
  const hourOptions = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200 relative" style={{ height: '90vh' }}>

        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center z-20">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-gray-600" />
            排排程
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(prev => !prev)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showSettings ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${shared ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {shared ? '已複製' : '分享'}
            </button>
          </div>
        </div>

        {/* Settings Bar */}
        {showSettings && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">天：</span>
              {DAYS.map(day => {
                const isHidden = settings.hiddenDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${isHidden ? 'bg-gray-200 text-gray-400 line-through' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {day.id}{day.name}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">時間：</span>
              <select
                value={settings.startHour}
                onChange={(e) => changeStartHour(e.target.value)}
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white"
              >
                {hourOptions.slice(0, 24).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="text-gray-400">—</span>
              <select
                value={settings.endHour}
                onChange={(e) => changeEndHour(e.target.value)}
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white"
              >
                {hourOptions.slice(1).map(h => (
                  <option key={h} value={h}>{h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Calendar Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto relative bg-gray-50 flex flex-col">

          {/* Day Headers (Sticky) */}
          <div className="flex sticky top-0 z-30 bg-gray-400 text-white shadow-sm">
            <div className="w-14 flex-shrink-0 border-r border-gray-300" />
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}>
              {visibleDays.map(day => (
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
            visibleDays={visibleDays}
            startHour={startHour}
            totalHours={totalHours}
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
