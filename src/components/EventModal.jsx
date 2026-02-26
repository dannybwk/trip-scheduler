import React from 'react';
import { X, MapPin, Link as LinkIcon, AlignLeft, Clock } from 'lucide-react';
import { DAYS, CATEGORIES } from '../constants';

export default function EventModal({ editingEvent, setEditingEvent, onSave, onDelete, onClose }) {
  if (!editingEvent) return null;

  const isNew = editingEvent.isNew;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">{isNew ? '新增行程' : '編輯行程'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Title & Category */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">標題</label>
              <input
                type="text"
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                placeholder="例如：參觀博物館"
                autoFocus
              />
            </div>
            <div className="w-1/3 space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">分類</label>
              <select
                value={editingEvent.category}
                onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
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
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" /> 時間安排
            </label>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={editingEvent.day}
                onChange={(e) => setEditingEvent({ ...editingEvent, day: Number(e.target.value) })}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
              >
                {DAYS.map(day => (
                  <option key={day.id} value={day.id}>{day.id}號 ({day.name})</option>
                ))}
              </select>
              <input
                type="time"
                value={editingEvent.start}
                onChange={(e) => setEditingEvent({ ...editingEvent, start: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
              />
              <span className="text-gray-400">至</span>
              <input
                type="time"
                value={editingEvent.end}
                onChange={(e) => setEditingEvent({ ...editingEvent, end: e.target.value })}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">若結束時間早於開始時間，將視為跨夜行程。</p>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 地址 (可連結至地圖)
            </label>
            <input
              type="text"
              value={editingEvent.address}
              onChange={(e) => setEditingEvent({ ...editingEvent, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="輸入地點或地址..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> 備註事項
            </label>
            <textarea
              value={editingEvent.notes}
              onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="紀錄票號、注意事項..."
            />
          </div>

          {/* External Link */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> 相關資訊連結
            </label>
            <input
              type="url"
              value={editingEvent.link}
              onChange={(e) => setEditingEvent({ ...editingEvent, link: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          {!isNew ? (
            <button
              onClick={() => {
                if (window.confirm('確定要刪除此行程嗎？')) {
                  onDelete(editingEvent.id);
                }
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              刪除行程
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onSave(editingEvent)}
              disabled={!editingEvent.title}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
