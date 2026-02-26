import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, MapPin, Link as LinkIcon, AlignLeft, Clock, Calendar as CalendarIcon, Move } from 'lucide-react';

// --- 常數設定 ---
const DAYS = [
  { id: 9, name: '一' },
  { id: 10, name: '二' },
  { id: 11, name: '三' },
  { id: 12, name: '四' },
  { id: 13, name: '五' },
  { id: 14, name: '六' },
  { id: 15, name: '日' },
];

const START_HOUR = 6;
const TOTAL_HOURS = 24;
const HOUR_HEIGHT = 48; // 每個小時的像素高度
const MINUTE_SNAP = 15; // 拖曳時吸附的分鐘數

const CATEGORIES = {
  TRANSPORT: { id: 'TRANSPORT', label: '交通', color: 'bg-blue-200 border-blue-400 text-blue-800' },
  ACCOMMODATION: { id: 'ACCOMMODATION', label: '住宿', color: 'bg-purple-200 border-purple-400 text-purple-800' },
  FOOD: { id: 'FOOD', label: '餐飲', color: 'bg-orange-200 border-orange-400 text-orange-800' },
  ATTRACTION: { id: 'ATTRACTION', label: '景點', color: 'bg-green-200 border-green-400 text-green-800' },
  OTHER: { id: 'OTHER', label: '其他', color: 'bg-gray-200 border-gray-400 text-gray-800' },
};

// --- 輔助函式 ---
// 將 "10:30" 轉換為小數 10.5
const timeToDecimal = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
};

// 將小數 10.5 轉換為 "10:30"
const decimalToTime = (decimal) => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  const displayHours = hours >= 24 ? hours - 24 : hours; // 處理跨夜顯示
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// 處理結束時間可能跨夜的情況 (例如開始 22:00, 結束 02:00 -> 實際結束為 26)
const normalizeEndTime = (startDecimal, endDecimal) => {
  if (endDecimal < startDecimal) {
    return endDecimal + 24;
  }
  return endDecimal;
};

// --- 初始假資料 (根據提供的圖片) ---
const INITIAL_EVENTS = [
  { id: '1', title: '機場', category: 'TRANSPORT', day: 10, start: '10:00', end: '15:00', address: '桃園國際機場', notes: '提早兩小時報到', link: 'https://www.taoyuan-airport.com/' },
  { id: '2', title: '飯店', category: 'ACCOMMODATION', day: 10, start: '16:00', end: '17:30', address: '', notes: 'Check-in 休息一下', link: '' },
  { id: '3', title: '餐廳A', category: 'FOOD', day: 10, start: '19:00', end: '20:30', address: '', notes: '預約已確認', link: '' },
  { id: '4', title: '景點A', category: 'ATTRACTION', day: 10, start: '21:00', end: '23:00', address: '', notes: '看夜景', link: '' },
  
  { id: '5', title: '景點B', category: 'ATTRACTION', day: 11, start: '10:30', end: '12:30', address: '', notes: '買票入場', link: '' },
  { id: '6', title: '餐廳B', category: 'FOOD', day: 11, start: '13:00', end: '14:30', address: '', notes: '吃當地小吃', link: '' },
  { id: '7', title: '景點C', category: 'ATTRACTION', day: 11, start: '15:00', end: '18:30', address: '', notes: '預計停留較久', link: '' },
  { id: '8', title: '餐廳C', category: 'FOOD', day: 11, start: '19:00', end: '20:30', address: '', notes: '', link: '' },
  { id: '9', title: '景點D', category: 'ATTRACTION', day: 11, start: '21:00', end: '23:00', address: '', notes: '', link: '' },
  
  { id: '10', title: '餐廳D', category: 'FOOD', day: 12, start: '13:00', end: '14:30', address: '', notes: '', link: '' },
  { id: '11', title: '機場', category: 'TRANSPORT', day: 12, start: '22:00', end: '23:30', address: '', notes: '準備回程', link: '' },
  
  { id: '12', title: '機場', category: 'TRANSPORT', day: 13, start: '14:00', end: '15:30', address: '', notes: '抵達', link: '' },
];


export default function App() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // 拖曳狀態管理
  const gridRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  // --- 表單處理 ---
  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
    } else {
      setEditingEvent({
        id: Date.now().toString(),
        title: '',
        category: 'ATTRACTION',
        day: 9,
        start: '10:00',
        end: '12:00',
        address: '',
        notes: '',
        link: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = (savedEvent) => {
    if (events.find(e => e.id === savedEvent.id)) {
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
    } else {
      setEvents([...events, savedEvent]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
    setIsModalOpen(false);
  };

  // --- 拖曳邏輯 ---
  const handlePointerDown = (e, event) => {
    e.stopPropagation();
    e.preventDefault(); // 防止選取文字
    const rect = gridRef.current.getBoundingClientRect();
    
    // 計算滑鼠在方塊內的相對位置，讓拖曳時不會跳動
    const startDecimal = timeToDecimal(event.start);
    const eventTop = (startDecimal < START_HOUR ? startDecimal + 24 - START_HOUR : startDecimal - START_HOUR) * HOUR_HEIGHT;
    const offsetY = e.clientY - rect.top - eventTop;

    setDragState({
      event: { ...event },
      isDragging: true,
      offsetY: offsetY,
    });
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragState || !dragState.isDragging || !gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      
      // 計算相對於網格的 X 和 Y
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      // 計算新的天數 (Day)
      const columnWidth = rect.width / 7;
      let newDayIndex = Math.floor(relativeX / columnWidth);
      newDayIndex = Math.max(0, Math.min(newDayIndex, 6)); // 限制在 0-6 之間
      const newDay = DAYS[newDayIndex].id;

      // 計算新的時間 (Hour)
      // 減去初始點擊在方塊內的偏移量，讓方塊跟隨滑鼠
      const adjustedY = relativeY - dragState.offsetY; 
      let newStartDecimal = (adjustedY / HOUR_HEIGHT) + START_HOUR;
      
      // 吸附到最近的網格 (例如 15 分鐘 = 0.25 小時)
      const snapDecimal = MINUTE_SNAP / 60;
      newStartDecimal = Math.round(newStartDecimal / snapDecimal) * snapDecimal;

      // 確保時間不會超出範圍 (06:00 到 29:00)
      const duration = normalizeEndTime(timeToDecimal(dragState.event.start), timeToDecimal(dragState.event.end)) - timeToDecimal(dragState.event.start);
      if (newStartDecimal < START_HOUR) newStartDecimal = START_HOUR;
      if (newStartDecimal + duration > START_HOUR + TOTAL_HOURS) newStartDecimal = START_HOUR + TOTAL_HOURS - duration;

      // 更新拖曳中的暫時狀態
      let newStart = decimalToTime(newStartDecimal);
      let newEndDecimal = newStartDecimal + duration;
      let newEnd = decimalToTime(newEndDecimal >= 24 ? newEndDecimal - 24 : newEndDecimal);

      setDragState(prev => ({
        ...prev,
        event: {
          ...prev.event,
          day: newDay,
          start: newStart,
          end: newEnd
        }
      }));
    };

    const handlePointerUp = () => {
      if (dragState && dragState.isDragging) {
        // 將變更儲存回主狀態
        setEvents(prev => prev.map(e => e.id === dragState.event.id ? dragState.event : e));
        setDragState(null);
      }
    };

    if (dragState && dragState.isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  // 排序事件供列表顯示
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return timeToDecimal(a.start) - timeToDecimal(b.start);
    });
  }, [events]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200" style={{ height: '90vh' }}>
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center z-20">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-gray-600" />
            Calendar (週/日/月)
          </h1>
        </div>

        {/* Calendar Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto relative bg-gray-50 flex flex-col">
          
          {/* Day Headers (Sticky) */}
          <div className="flex sticky top-0 z-10 bg-gray-400 text-white shadow-sm">
            <div className="w-14 flex-shrink-0 border-r border-gray-300"></div> {/* 空白左上角 */}
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
          <div className="flex flex-1 relative">
            {/* Time Column */}
            <div className="w-14 flex-shrink-0 bg-gray-100 border-r border-gray-200 flex flex-col">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = (START_HOUR + i) % 24;
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
              className="flex-1 relative" 
              style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
            >
              {/* Grid Lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div key={`line-${i}`} className="absolute w-full border-t border-gray-200" style={{ top: `${i * HOUR_HEIGHT}px` }} />
              ))}
              
              {/* Column Dividers */}
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {DAYS.map((_, i) => (
                  <div key={`col-${i}`} className="border-r border-gray-200 last:border-r-0 h-full" />
                ))}
              </div>

              {/* Render Events */}
              {[...events, ...(dragState?.isDragging ? [dragState.event] : [])].map((event, index) => {
                const isDraggingThis = dragState?.isDragging && dragState.event.id === event.id;
                // 如果正在拖曳，原本的方塊變半透明
                const isOriginal = dragState?.isDragging && events.find(e => e.id === event.id) === event;
                
                const startDecimal = timeToDecimal(event.start);
                let endDecimal = timeToDecimal(event.end);
                endDecimal = normalizeEndTime(startDecimal, endDecimal);

                // 計算位置
                // 處理跨夜 (如果在06:00之前，加上24)
                let displayStart = startDecimal;
                if (displayStart < START_HOUR) displayStart += 24;
                
                const top = (displayStart - START_HOUR) * HOUR_HEIGHT;
                const height = (endDecimal - startDecimal) * HOUR_HEIGHT;
                const dayIndex = DAYS.findIndex(d => d.id === parseInt(event.day));
                const left = `${(dayIndex / 7) * 100}%`;
                const width = `${100 / 7}%`;

                const categoryStyle = CATEGORIES[event.category] || CATEGORIES.OTHER;

                return (
                  <div
                    key={isDraggingThis ? 'dragging-copy' : event.id}
                    onPointerDown={(e) => isOriginal ? null : handlePointerDown(e, event)}
                    className={`absolute p-1 cursor-grab active:cursor-grabbing transition-opacity duration-150 ease-in-out ${isOriginal ? 'opacity-30 pointer-events-none' : 'opacity-95'} ${isDraggingThis ? 'z-50 shadow-lg scale-[1.02]' : 'z-10 hover:z-20'}`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: left,
                      width: width,
                      padding: '2px', // 避免緊貼邊界
                    }}
                  >
                    <div 
                      onClick={(e) => {
                        // 避免拖曳結束時觸發點擊
                        if(dragState?.isDragging) return;
                        handleOpenModal(event);
                      }}
                      className={`w-full h-full rounded-md border p-1.5 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${categoryStyle.color}`}
                      title="點擊查看/編輯詳情"
                    >
                      <div className="font-bold text-xs truncate">{event.title}</div>
                      <div className="text-[10px] opacity-80 truncate">{event.start}-{event.end}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Bottom Event List Section (as seen in mockup) */}
          <div className="p-6 bg-white border-t border-gray-200 pb-24">
            <h2 className="text-lg font-bold mb-4">Event (照時間順序)</h2>
            <div className="space-y-2">
              {sortedEvents.map(event => (
                <div key={`list-${event.id}`} className="flex items-start gap-3 text-sm">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${CATEGORIES[event.category]?.color.split(' ')[0]}`} style={{ backgroundColor: 'currentColor' }}></div>
                  <div className="flex-1">
                    <span 
                      className="font-semibold cursor-pointer text-blue-700 hover:text-blue-500 hover:underline transition-colors"
                      onClick={() => handleOpenModal(event)}
                      title="點擊查看/編輯詳情"
                    >
                      {event.title}
                    </span> : ( {DAYS.find(d=>d.id == event.day)?.name} {event.start}-{event.end} 
                    {event.notes && ` | ${event.notes}`} )
                  </div>
                  <div className="flex gap-2">
                    {event.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded">
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
              ))}
              {sortedEvents.length === 0 && <div className="text-gray-400 text-sm italic">尚無行程，點擊右下角新增。</div>}
            </div>
          </div>

        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => handleOpenModal()}
          className="absolute bottom-6 right-6 w-14 h-14 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 hover:scale-105 transition-all text-gray-800 z-50 focus:outline-none focus:ring-4 focus:ring-yellow-200"
        >
          <Plus className="w-8 h-8" />
        </button>

      </div>

      {/* Event Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">{editingEvent.id.length > 10 ? '新增行程' : '編輯行程'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Title & Category */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">標題</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="例如：參觀博物館"
                    autoFocus
                  />
                </div>
                <div className="w-1/3 space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">分類</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({...editingEvent, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {Object.values(CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Setup */}
              <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> 時間安排</label>
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={editingEvent.day}
                    onChange={(e) => setEditingEvent({...editingEvent, day: e.target.value})}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                  >
                    {DAYS.map(day => (
                      <option key={day.id} value={day.id}>{day.id}號 ({day.name})</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={editingEvent.start}
                    onChange={(e) => setEditingEvent({...editingEvent, start: e.target.value})}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                  />
                  <span className="text-gray-400">至</span>
                  <input
                    type="time"
                    value={editingEvent.end}
                    onChange={(e) => setEditingEvent({...editingEvent, end: e.target.value})}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">若結束時間早於開始時間，將視為跨夜行程。</p>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> 地址 (可連結至地圖)</label>
                <input
                  type="text"
                  value={editingEvent.address}
                  onChange={(e) => setEditingEvent({...editingEvent, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="輸入地點或地址..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1"><AlignLeft className="w-3 h-3"/> 備註事項</label>
                <textarea
                  value={editingEvent.notes}
                  onChange={(e) => setEditingEvent({...editingEvent, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="紀錄票號、注意事項..."
                />
              </div>

              {/* External Link */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> 相關資訊連結</label>
                <input
                  type="url"
                  value={editingEvent.link}
                  onChange={(e) => setEditingEvent({...editingEvent, link: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>

            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              {editingEvent.id.length <= 10 ? (
                <button 
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  刪除行程
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleSaveEvent(editingEvent)}
                  disabled={!editingEvent.title}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}