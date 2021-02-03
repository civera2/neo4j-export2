import firebase from "firebase/app";
import "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  databaseURL:
    "https://" + process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseio.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
export default firebaseApp;
