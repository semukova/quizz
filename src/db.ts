import firebase from "firebase";

const config:any = {
  apiKey: "AIzaSyBMiiIvRgUjYeoKSIV68aFztGIS1ojU9TM",
  authDomain: "test-b95ec.firebaseapp.com",
  databaseURL: "https://test-b95ec.firebaseio.com",
  projectId: "test-b95ec",
  storageBucket: "test-b95ec.appspot.com",
  messagingSenderId: "633155461441"
};

export const db:any = firebase.initializeApp(config).database();
