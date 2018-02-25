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
};

const responseMsg = {
  status: STATUS_CODES.OK,
  errorcode: ERROR_CODES.NO_ERROR,
  text: 'ok'
};


(function () {
  'use strict'

  class Planet {
    constructor(posx, posy, id, production, ownerId) {
      this.posx = posx;
      this.posy = posy;
      this.id = id;
      this.production = production;
      this.ownerId = ownerId;
      this.ships = 0;
    }
  };

  class Universe {
    constructor(age, maxx, maxy, planets) {
      this.age = age;
      this.maxx = maxx;
      this.maxy = maxy;
      this.planets = planets;
    }
    calcDistance(pl1id, pl2id) {
      let planet1 = null;
      let planet2 = null;
      this.planets.forEach(planet => {
        if (planet.id == pl1id) {
          planet1 = planet;
        }
        if (planet.id == pl2id) {
          planet2 = planet;
        }
      });
      if (planet1 == null || planet2 == null) {
        console.error('cant calc distance on non-existing planet (pl1: ' + pl1id + ' pl2: ' + pl2id + ')');
        console.error('something went really so richtig wrong!');
        return -1;
      }
      let distance = Math.ceil(Math.sqrt(Math.pow(planet1.posx - planet2.posx, 2) + Math.pow(planet1.posy - planet2.posy, 2)) / 3.5);
      console.log('distance: ' + distance);
      return (distance);
    }

    isPlanetAt(x, y) {
      var ret = 0;
      this.planets.forEach(planet => {
        if (y == planet.posy && x == planet.posx) {
          ret = planet.id;
        }
      });
      return '' + ret;
    }

    getPlanetWithId(planetId) {
      let ret = null;
      this.planets.forEach(planet => {
        if (planet.id == planetId) {
          ret = planet;
        }
      });
      return ret;
    }
  };

  ////////////////////////////////////////////////////////////////////////////////

  const neutralID = 99;

  function drawUniverse() {
    let u = JSON.parse(localStorage.getItem('map'));
    console.log('Ok, read universe from local storage: ' + JSON.stringify(u));
    let universe = new Universe(u.age, u.maxx, u.maxy, u.planets);
    console.log('Ok, read universe from local storage: ' + JSON.stringify(u));

    let htmlString = '<br><div style="font-family: monospace"><nobr> -------------------------------------UNIVERSE------------------------------------</nobr>';
    for (let y = 0; y < universe.maxy; y++) {
      htmlString += '<br>|';
      for (let x = 0; x < universe.maxx; x++) {
        var planetId = universe.isPlanetAt(x, y);
        let planetText = '';
        if (planetId > 0) {
          if (planetId < 10) {
            planetText = '0' + planetId;
          } else {
            planetText = '' + planetId;
          }
          let planet = universe.getPlanetWithId(planetId);  
          let plcolor = planet.ownerId == 1 ? 'red' : 'blue';
          plcolor = planet.ownerId == 99 ? 'grey' : plcolor;
          htmlString += '<div style="color:' + plcolor + '; display:inline">' + planetText + '</div>';
        } else {
          htmlString += '&nbsp;&nbsp;';
        }
      }
      htmlString += '|';
    }
    htmlString += '<br><div><nobr>--------------------------------------UNIVERSE------------------------------------</nobr></div></div>';
    $('#mapplaceholder').append(htmlString);
  }

  function drawPlanetList() {
    let htmlString = '<br><table class="tg"><tr><th class="tg-031e">Planet</th><th class="th">Owner</th>\
        <th class="th">Prod.</th>\
        <th class="th">Ships</th>';
    htmlString += '<th class="">Planet</th><th class="">Owner</th><th class="">Prod.</th><th class="">Ships</th>';
    htmlString += '</tr>';
    let u = JSON.parse(localStorage.getItem('map'));
    for (let index = 0; index < u.planets.length; index++) {
      const element = u.planets[index];
      if (index % 2 == 0) {
        htmlString += '<tr>';
      }
      let prodText = element.production == -1 ? '?' : element.production;
      let shipsText = element.ships == -1 ? '?' : element.ships;
      let ownerText = element.ownerId == neutralID ? '-' : element.ownerId;

      htmlString += '<td class="td">' + element.id + '</td><td class="td">' + ownerText
        + '</td><td class="td">' + prodText + '</td><td class="td">' + shipsText + '</td>';
      if ((index + 1) % 2 == 0) {
        htmlString += '</tr>';
      }
    }
    htmlString += '</table>';
    $('#planetsplaceholder').append(htmlString);
  }

  drawUniverse();
  drawPlanetList();

})();

function newCmd() {
  let from = $('#from_planet').val();
  let to = $('#to_planet').val();
  let ships = $('#ships').val();
  callRestNewCmd(from, to, ships).then ( result => {
    console.log('result: ' + result);
  }).catch ( (err) => {
    console.error('err :' + err);
  });
  console.log('X: ' + from + ' to: ' +  to + ' with ' + ships + ' <');  
}

////////////////////////////////////////////////////////////////////////////////
// all functions to call the server

function callRestNewCmd( from, to, ships) {
  let hash = localStorage.getItem('hash');
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: 'http://localhost:3000/geserver/newcmd/' + hash + '?from=' + from + '&destination=' + to + 'ships=' + ships,
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
        return reject({ error: 2, message: thrownError });
      }
    });
  });
}


////////////////////////////////////////////////////////////////////////////////
