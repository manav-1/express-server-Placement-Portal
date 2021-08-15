const firebase = require('firebase')
// import { auth } from "firebase/auth"; //eslint-disable-line
// import { database } from "firebase/database"; //eslint-disable-line
// import { storage } from "firebase/storage"; //eslint-disable-line
var firebaseConfig = {
  apiKey: "AIzaSyDUFM10Vom9Cxd32MbT7dbvFMLKLmCMl1E",
  authDomain: "quizmania-cdf81.firebaseapp.com",
  databaseURL: "https://quizmania-cdf81-default-rtdb.firebaseio.com",
  projectId: "quizmania-cdf81",
  storageBucket: "quizmania-cdf81.appspot.com",
  messagingSenderId: "826674071410",
  appId: "1:826674071410:web:144c2e1bcb4696664d3feb",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

module.exports={firebase}
