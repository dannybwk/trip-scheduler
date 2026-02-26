import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDgSW1J407kiqm6FBqSEA_Z01WkMXNkpoA",
  authDomain: "t-plus-studio.firebaseapp.com",
  databaseURL: "https://t-plus-studio-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "t-plus-studio",
  storageBucket: "t-plus-studio.firebasestorage.app",
  messagingSenderId: "451583137408",
  appId: "1:451583137408:web:7fee5c762f119996c87865",
  measurementId: "G-RP60366X9G",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
