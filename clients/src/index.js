import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import APPLICATIONS from './data/applications.json';

const firebaseConfig = {
    apiKey: "AIzaSyC-ZwwK1bVE9YT51KxWwhmXLIreFC1-AtU",
    authDomain: "trailfinder-9f4d2.firebaseapp.com",
    databaseURL: "https://trailfinder-9f4d2-default-rtdb.firebaseio.com",
    projectId: "trailfinder-9f4d2",
    storageBucket: "trailfinder-9f4d2.appspot.com",
    messagingSenderId: "289839204328",
    appId: "1:289839204328:web:175b5117c838536e04465d"
};
firebase.initializeApp(firebaseConfig);

ReactDOM.render(<BrowserRouter><App applications={APPLICATIONS} /></BrowserRouter>, document.getElementById('root'));
