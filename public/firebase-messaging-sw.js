// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// To receive background messages, we must initialize the app in the service worker.
// These values should normally match the environment variables. Since service workers
// don't have access to process.env or import.meta.env, we use placeholder values here.
// In a true production app, you can use a bundler plugin or URL query parameters to inject these.

const firebaseConfig = {
  apiKey: "AIzaSyD3r-DzbJh9t_TUsMD009vpAUWsmuabiI0",
  authDomain: "bsq-all-five.firebaseapp.com",
  projectId: "bsq-all-five",
  storageBucket: "bsq-all-five.firebasestorage.app",
  messagingSenderId: "779528287705",
  appId: "1:779528287705:web:84751bf6f9ebc49d6e15c8"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'BSQ ALL-FIVE Alert';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification.',
      icon: '/favicon.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.log('Firebase SW initialization failed:', error);
}
