// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl9mHJIHa4303XKNDdeO5CLpIVTlg8kBM",
  authDomain: "vibook-6409f.firebaseapp.com",
  projectId: "vibook-6409f",
  storageBucket: "vibook-6409f.appspot.com", 
  messagingSenderId: "124216296204",
  appId: "1:124216296204:web:f40406b9e045d8d9a13f29"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth(app);
export const db=getFirestore(app);
export default app;