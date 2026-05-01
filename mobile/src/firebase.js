import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDNXiC1YI2smhzPJRPHlurgqiPvrjnDhUc',
  authDomain:        'pockettube-1a180.firebaseapp.com',
  projectId:         'pockettube-1a180',
  storageBucket:     'pockettube-1a180.firebasestorage.app',
  messagingSenderId: '478381526713',
  appId:             '1:478381526713:web:1ecbe0cfa5236ac405d568',
  measurementId:     'G-N6TQF0HJ6F',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
