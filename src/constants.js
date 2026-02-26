export const DAYS = [
  { id: 9, name: '一' },
  { id: 10, name: '二' },
  { id: 11, name: '三' },
  { id: 12, name: '四' },
  { id: 13, name: '五' },
  { id: 14, name: '六' },
  { id: 15, name: '日' },
];

export const START_HOUR = 6;
export const TOTAL_HOURS = 24;
export const HOUR_HEIGHT = 48;
export const MINUTE_SNAP = 15;

export const CATEGORIES = {
  RESTAURANT: { id: 'RESTAURANT', label: '餐廳', color: 'bg-orange-200 border-orange-400 text-orange-800' },
  SNACK:      { id: 'SNACK',      label: '小吃', color: 'bg-amber-200 border-amber-400 text-amber-800' },
  ATTRACTION: { id: 'ATTRACTION', label: '景點', color: 'bg-green-200 border-green-400 text-green-800' },
  EXPERIENCE: { id: 'EXPERIENCE', label: '體驗', color: 'bg-pink-200 border-pink-400 text-pink-800' },
  REST:       { id: 'REST',       label: '休憩', color: 'bg-purple-200 border-purple-400 text-purple-800' },
  TRANSPORT:  { id: 'TRANSPORT',  label: '交通', color: 'bg-blue-200 border-blue-400 text-blue-800' },
  OTHER:      { id: 'OTHER',      label: '其他', color: 'bg-gray-200 border-gray-400 text-gray-800' },
};

export const INITIAL_EVENTS = [
  { id: '1', title: '機場', category: 'TRANSPORT', day: 10, start: '10:00', end: '15:00', address: '桃園國際機場', notes: '提早兩小時報到', link: 'https://www.taoyuan-airport.com/' },
  { id: '2', title: '飯店', category: 'REST', day: 10, start: '16:00', end: '17:30', address: '', notes: 'Check-in 休息一下', link: '' },
  { id: '3', title: '餐廳A', category: 'RESTAURANT', day: 10, start: '19:00', end: '20:30', address: '', notes: '預約已確認', link: '' },
  { id: '4', title: '景點A', category: 'ATTRACTION', day: 10, start: '21:00', end: '23:00', address: '', notes: '看夜景', link: '' },

  { id: '5', title: '景點B', category: 'ATTRACTION', day: 11, start: '10:30', end: '12:30', address: '', notes: '買票入場', link: '' },
  { id: '6', title: '小吃街', category: 'SNACK', day: 11, start: '13:00', end: '14:30', address: '', notes: '吃當地小吃', link: '' },
  { id: '7', title: '景點C', category: 'ATTRACTION', day: 11, start: '15:00', end: '18:30', address: '', notes: '預計停留較久', link: '' },
  { id: '8', title: '餐廳C', category: 'RESTAURANT', day: 11, start: '19:00', end: '20:30', address: '', notes: '', link: '' },
  { id: '9', title: '景點D', category: 'EXPERIENCE', day: 11, start: '21:00', end: '23:00', address: '', notes: '', link: '' },

  { id: '10', title: '餐廳D', category: 'RESTAURANT', day: 12, start: '13:00', end: '14:30', address: '', notes: '', link: '' },
  { id: '11', title: '機場', category: 'TRANSPORT', day: 12, start: '22:00', end: '23:30', address: '', notes: '準備回程', link: '' },

  { id: '12', title: '機場', category: 'TRANSPORT', day: 13, start: '14:00', end: '15:30', address: '', notes: '抵達', link: '' },
];
