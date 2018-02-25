// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// import $ from 'jquery';   // does not work in browser, only EDGE



const STATUS_CODES = {
  OK: 0, FATAL_ERROR: 1, CLIENT_ERROR: 2, SYSTEM_ERROR: 3
};

const ERROR_CODES = {
  NO_ERROR: 0, GAME_ALLREADY_RUNNING: 1, SEATS_TAKEN: 2, INVALID_HASH: 3, PARAMETER_MISSING: 4
}

const responseMsg = {
  status: STATUS_CODES.OK,
  errorcode: ERROR_CODES.NO_ERROR,
  text: 'ok'
};


'use strict'

function addNewPlayer() {
  return new Promise((resolve, reject) => {
    var pname = document.getElementById('pname').value;
    localStorage.setItem('pname', pname);
    if (pname == undefined || pname === '' || pname === null) {
      return reject({ error: 1, message: 'pname not set' });
    }
    $.ajax({
      type: "POST",
      url: 'http://localhost:3000/geserver/newplayer?name=' + pname + '&color=red',
      crossDomain: true, success: (result) => {
        console.log('status: >' + result.status + '< error: ' + result.error);
        if (result.status != STATUS_CODES.OK) {
          console.error('something went wrong: ' + JSON.stringify(result));
          return reject(result);
        } else {
          console.log('ok result hash' + result.text + ' result: ' + JSON.stringify(result));
          localStorage.setItem('hash', result.text);
          return resolve(result);
        }
      }, error: function (xhr, ajaxOptions, thrownError) {
        console.error('error!');
        return reject({ error: 2, message: thrownError })
      }
    });
  });
}

function getMap() {
  return new Promise((resolve, reject) => {
    var hash = localStorage.getItem('hash');
    if (hash == undefined || hash == '' || hash == null) {
      return reject({ error: 1, message: 'hash not set' });
    }
    $.ajax({
      type: "GET",
      url: "http://localhost:3000/geserver/map/player/" + hash,
      crossDomain: true, success: (result) => {
        console.log('status: >' + result.status + '< error: ' + result.error);
        if (result.status != STATUS_CODES.OK) {
          // something went wrong, aber so richtig
          console.error(result.text);
          return resolve(result);
        } else {
          return resolve(result);
        }
      }, error: function (xhr, ajaxOptions, thrownError) {
        console.error('error!');
        return reject({ error: 2, message: thrownError })
      }
    });
  });
}

////////////////////////////////////////////////////////////////////////////////
// DOM manipulation here

function addSensorCardElement(element) {
  console.log('hunid: ' + element.humidity + ' sensor: ' + element.sensor);
  var humidityValue = element.humidity == -1000 ? '' : element.humidity / 100 + ' %';
  $("#sensors").append('<div class=\"row center\">\
            <div class="card blue-grey darken-2">\
            <div class="card-content white-text">\
            <span class="card-title" style="font-weight:500">' + element.description + '</span>\
            <p><h5>' + element.temperature / 100 + '&deg; C</h5></p>\
            <p><h5>' + humidityValue + '</h5></p>\
            <p><span> gemessen am: ' + new Date(element.date).toLocaleString() + ' </span></p>\
        </div>\
        <div class="card-action" onClick="gotoChartPage(\'' + element.sensor + '\',\'' + element.description + '\',\'/chart.html\');"><a>Show Chart</a>\
          </div>\
        </div>\
      </div>');
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Service worker code here

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then(function () { console.log('Service Worker Registered'); });
}

console.log('hey');

function startGame() {
  addNewPlayer().then((result) => {
    console.log('result: ' + JSON.stringify(result));
    return getMap();
  }).then((result) => {
    console.log('result is: ' + result + 'json: ' + JSON.stringify(result));
    if (result.status == STATUS_CODES.OK) {
      localStorage.setItem('map', JSON.stringify(result.text));
      window.location.href = '/map.html';
    }
  }).catch((error) => {
    if (error.error == 1) {
      console.log('password not correct');
    }
  });
}

////////////////////////////////////////////////////////////////////////////////