// 將 "10:30" 轉換為小數 10.5
export const timeToDecimal = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
};

// 將小數 10.5 轉換為 "10:30"
export const decimalToTime = (decimal) => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  const displayHours = hours >= 24 ? hours - 24 : hours;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// 處理結束時間可能跨夜的情況
export const normalizeEndTime = (startDecimal, endDecimal) => {
  if (endDecimal < startDecimal) {
    return endDecimal + 24;
  }
  return endDecimal;
};

// --- 分享連結：壓縮 events 到 URL hash ---

// 將 events 編碼成 URL-safe 的 base64 字串
export function encodeEvents(events) {
  const json = JSON.stringify(events);
  const bytes = new TextEncoder().encode(json);
  // 使用 CompressionStream 壓縮（同步用不了，改用簡易 UTF-16 編碼）
  // 直接 btoa，對中文先做 percent-encode
  const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
  return encoded;
}

// 從 base64 字串解碼回 events
export function decodeEvents(str) {
  try {
    const json = decodeURIComponent(
      atob(str).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return null;
}
