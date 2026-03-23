// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Config Firebase thật của dự án BASTICKET
const firebaseConfig = {
  apiKey: "AIzaSyBbd4hNOsYbQJoAvhHHBOTpuRdAvq6MicE",
  authDomain: "basticket-99666.firebaseapp.com",
  projectId: "basticket-99666",
  storageBucket: "basticket-99666.firebasestorage.app",
  messagingSenderId: "244933113606",
  appId: "1:244933113606:web:716d7b40754fa831459087",
  measurementId: "G-CHZ1G3G732"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Lấy tham chiếu đến Dịch vụ Xác thực và Nhà cung cấp Google
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
