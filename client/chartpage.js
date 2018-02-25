
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


(function () {
  'use strict';

  function getSensorDataForChart(hash, counter) {
    return new Promise((resolve, reject) => {
      if (globalPassword === undefined || globalPassword === '' || globalPassword === null) {
        return reject({ error: 1, message: 'password not set' });
      }
      $.ajax({
        url: "https://us-central1-sensor-pwa.cloudfunctions.net/getsensordataforchart?password=" + globalPassword
          + '&key=' + hash + '&counter=' + counter,
        crossDomain: true, success: (result) => {
          console.log('status: >' + result.status + '< error: ' + result.error);
          if (result.status === 'error' && result.error === '1001') {
            pwnc.style.display = 'block';
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

  function populateChart(chartElement, chartData, description) {

    chartElement.style.display = 'block';
    var temperatureData = [];
    var lables = [];
    var humidData = [];
    var hasHumiditySensor = true;

    // console.log('start populate: ' + JSON.stringify(chartData));
    for (var props in chartData) {
      // console.log('temp:' + props + " date: " + chartData[props].date + " temp: " + chartData[props].temperature + ' humid: ' + chartData[props].humidity);
      let temp = (chartData[props].temperature) / 100;
      let h = (chartData[props].humidity) / 100;
      if (temp > 10000 || h > 10000) continue;
      if (h == -10) { 
        hasHumiditySensor = false;
      }
      
      humidData.push(h);
      temperatureData.push(temp);
      var options = { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }
      lables.push(new Date(chartData[props].date).toLocaleDateString('DE-de', options));    
    }
    console.log('populate done chartElement' + chartElement + ' <');

    var myDatasets = [];
    myDatasets.push({
      data: temperatureData,
      label: 'temperature in degree celsius',
      backgroundColor: '#ffffff',
      pointRadius: 6,
      pointBackgroundColor: '#ff0000',
      borderColor: '#ff000f',
      pointHoverRadius: 8,
      showLines: true
    });
    if ( hasHumiditySensor ) {
      myDatasets.push({
        data: humidData,
        label: 'humidity in %',
        backgroundColor: '#ffffff',
        pointRadius: 6,
        pointBackgroundColor: '#0000ff',
        borderColor: '#0000ff',
        pointHoverRadius: 8,
        showLines: true
      });
    }    
    // build new chart
    var ctx = document.getElementById("myChart");

    var myChart = new Chart(ctx, {
      type: 'line',
      label: "mylabel",
      data: {
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        labels: lables,
        fill: false,
        datasets: myDatasets
      },
      options: {
        title: {
          display: true,
          text: description
        },
        showLines: true, // disable for all datasets
        scales: {
          yAxes: [{
            ticks: {
              min:0,
              stepSize: 10
            }
          }]
        },
        elements: {
          animation: {
            duration: 0, // general animation time
          },
          hover: {
            animationDuration: 10, // duration of animations when hovering an item
          },
          responsiveAnimationDuration: 0, // animation duration after a resize
        }
      }
    });
    console.log('creation done');


  }

  ////////////////////////////////////////////////////////////////////////////////


  const nameNumberOfItems = 'getNumberOfItemsToGet';


  var ctx = document.getElementById("myChart");
  console.log('ctx: ' + JSON.stringify(ctx) + " ctx: " + ctx);
  var globalPassword = localStorage.getItem('globalPassword');
  var counter = localStorage.getItem('getNumberOfItemsToGet');
  if (counter == null || counter == undefined || counter == 0) {
    counter = 10;
  }



  //  ctx.style.display = 'none';
  var counter = 0;

  ////////////////////////////////////////////////////////////////////////////////
  // DOM manipulation here

  var hashValue = localStorage.getItem('hashValue');
  var description = localStorage.getItem('sensorDescription');
  var counterValue = localStorage.getItem(nameNumberOfItems);
  if ( counterValue == undefined || counterValue == null ) {
    counterValue = 10;
  }

  getSensorDataForChart(hashValue, counterValue).then((chartData) => {
    populateChart(ctx, chartData.data, description);
    console.log('data stored');
  }).catch((error) => {
    if (error.error == 1) {
      console.log('password not correct');
    }
  });

})();

////////////////////////////////////////////////////////////////////////////////