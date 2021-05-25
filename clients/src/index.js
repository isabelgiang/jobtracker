import firebase from 'firebase/app';
import 'firebase/auth'; 
import 'firebase/database';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import _ from 'lodash';
import App from './App';
import './index.css';
import TRAIL_DATA from './data/trail_data.json';
import TRAIL_INFO from './data/trail_info.json';

import 'font-awesome/css/font-awesome.css'; //using FA 4.7 atm

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

let avgTraffic = _(TRAIL_DATA)
    .groupBy('id')
    .map((trail, id) => ({
        id: id,
        avgTraffic: _.meanBy(trail, 'bike')
    }))
    .value();

TRAIL_INFO.forEach(trail => {
    let trafficRow = _.find(avgTraffic, {id: trail.id.toString()});
    trail['avgTraffic'] = trafficRow['avgTraffic'];
});

ReactDOM.render(<BrowserRouter><App info={TRAIL_INFO} /></BrowserRouter>, document.getElementById('root'));