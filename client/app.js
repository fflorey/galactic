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

function gotoChartPage(key, description, target_url) {
  localStorage.setItem('hashValue', key);
  localStorage.setItem('sensorDescription', description);
  window.location.href = target_url;
}

(function () {
  'use strict';

  function getSensorData() {
    return new Promise((resolve, reject) => {
      if (globalPassword === undefined || globalPassword === '' || globalPassword === null) {
        return reject({ error: 1, message: 'password not set' });
      }
      $.ajax({
        url: 'https://us-central1-sensor-pwa.cloudfunctions.net/getsensordata?password=' + globalPassword,
        crossDomain: true, success: (result) => {
          console.log('status: >' + result.status + '< error: ' + result.error);
          if (result.status == 'error' && result.error == '1001') {
            pwnc.style.display = 'block';
          } else {
            return resolve(result);
          }
        }, error: function (xhr, ajaxOptions, thrownError) {
          console.error('error!');
          return reject({ error: 2, message: thrownError })
        }
      });
    })
  }

  ////////////////////////////////////////////////////////////////////////////////

  var pwe = document.getElementById("pw-note");
  var pwnc = document.getElementById("pw-notcorrect");
  var globalPassword = localStorage.getItem('globalPassword');
  var counter = localStorage.getItem('getNumberOfItemsToGet');
  if (counter == null || counter == undefined || counter == 0) {
    counter = 10;
  }
  pwe.style.display = 'none';
  pwnc.style.display = 'none';
  var counter = 0;

  var app = {
    details: "about me"
  };

  if (globalPassword === undefined || globalPassword === null || globalPassword === '') {
    console.error('no pw set: ' + globalPassword);
    pwe.style.display = 'block';
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

  getSensorData().then((result) => {
    var dos = [];
    for (var element in result.data) {
      var sensor = result.data[element].sensor
      console.log('sensor data: ' + sensor);
      addSensorCardElement(result.data[element]);
      // dos.push(getSensorDataForChart(sensor, 10));
    }
    return Promise.all(dos);
  }).then((result) => {
    console.log('result is: ' + result + 'json: ' + JSON.stringify(result));
    for (var element in result) {
      console.log('Final result of getSensorDataForChat: ' + element + ' : ' + JSON.stringify(element));
    }
  }).catch((error) => {
    if (error.error == 1) {
      console.log('password not correct');
      pwnc.style.display = 'block';
    }
  });

  ////////////////////////////////////////////////////////////////////////////////
  // Service worker code here

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function () { console.log('Service Worker Registered'); });
  }


})();

////////////////////////////////////////////////////////////////////////////////