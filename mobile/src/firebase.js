import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Auth with AsyncStorage persistence — keeps user logged in between sessions
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
