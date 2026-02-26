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
