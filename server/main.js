// NUR NOCH VORLAGE!!!! wird nicht mehr benötgt!!! Die Datei liegt im Unterverzeichnis

"use strict";
var colors = require('colors/safe');
const readline = require('readline');


var neutralID = 99;
var MAXPROD = 15;


///////////////PLAYER//////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class Player {
    constructor(name, id, colorobj) {
        this.name = name;
        this.id = id;
        this.color = colorobj;
    }
}

////////////////FLEET//////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class Fleet {
    constructor(ships, to, remainingRounds) {
        this.ships = ships;
        this.to = to;
        this.remainingRounds = remainingRounds;
    }

    nextRound() {
        remainingRounds -= 1;
        if (remainingRounds == 0) {
            return true;
        } else {
            return false;
        }
    }
}


////////////////PLANET/////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class Planet {

    constructor(posx, posy, id, production, ownerId) {
        this.posx = posx;
        this.posy = posy;
        this.id = id;
        this.production = production;
        this.ships = (Math.round(Math.random() * 10) + 3) * this.production;
        this.ownerId = ownerId;
    }

    nextRound() {
        this.ships += this.production;
    }
    changeOwner(newOwnerId) {
        this.ownerId = newOwnerId;
    }

};

////////////////UNIVERSE///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// holds all planets and performs the action for the planets
class Universe {
    constructor(maxx, maxy, planets, maxProduction) {
        // build universe        
        this.age = 1;
        this.maxx = maxx;
        this.maxy = maxy;
        this.planets = new Array(planets + 1);
        for (let i = 0; i < planets; i++) {
            while (true) {
                var newx = Math.floor(Math.random() * maxx);
                var newy = Math.floor(Math.random() * maxy);
                if (this.isPlanetAt(newx, newy)) {
                    break;
                }
            }
            var p = new Planet(newx, newy, i + 1, this.calcProduction(MAXPROD), neutralID);
            this.planets.push(p);
        }
    }

    // playerid must be an id of a planet (== its start world)
    addPlayer(playerid) {
        if (this.age != 1) {
            console.error('can only be done at beginning!');
        }
        this.planets.forEach(planet => {
            if (planet.id == playerid) {
                planet.ownerId = playerid;
                planet.production = 10;
                planet.ships = 200;
            }
        });

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

    nextRound() {
        this.planets.forEach(planet => {
            planet.nextRound();
        });
        this.age++;
    }

    calcProduction(maxProduction) {
        var prod = 0;
        while (maxProduction--) {
            if (Math.random() < 0.2) {
                prod++;
            }
        }
        return prod;
    }

}



////////////////VISUALIZER//////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class Visualizer {
    // static possible?

    constructor(universeobj, players) {
        this.universe = universeobj;
        this.players = players;
    }

    drawUniverse() {
        console.log(' YEAR: ' + this.universe.age + ' ---------------------------UNIVERSE-------------------------------------');
        for (let y = 0; y < this.universe.maxy; y++) {
            process.stdout.write('|');
            for (let x = 0; x < this.universe.maxx; x++) {
                var planetId = this.universe.isPlanetAt(x, y);
                let planetText = '';
                if (planetId > 0) {
                    if (planetId < 10) {
                        planetText = '0' + planetId;
                    } else {
                        planetText = '' + planetId;
                    }
                    let planet = this.universe.getPlanetWithId(planetId);
                    if (planet.ownerId == neutralID) {
                        process.stdout.write(colors.white.bold(planetText));
                    } else {
                        let colorobj = this.getColorObjectForPlayerId(planet.ownerId);
                        process.stdout.write(colorobj(planetText));
                    }
                } else {
                    process.stdout.write('  ');
                }
            }
            console.log('|');
        }
        console.log('--------------------------------------UNIVERSE------------------------------------');
    }

    getColorObjectForPlayerId(playerId) {
        let colobj = null;
        this.players.forEach(player => {
            if (playerId == player.id) {
                colobj = player.color;
            }
        });
        return colobj;
    }

    drawSystems() {
        console.log('-------------------------------------UNIVERSE-------------------------------------');
        let counter = 0;
        this.universe.planets.forEach(planet => {
            counter++;
            process.stdout.write('ID: ' + planet.id + ' OWNER: ' + planet.ownerId);
            if (planet.ownerId == neutralID) {
                process.stdout.write(' PROD: ' + planet.production + ' SHIPS: ' + planet.ships);
            } else {
                process.stdout.write(' PROD: ??  SHIPS: ???');
            }
            if (counter % 3 == 0) {
                console.log('');
            } else {
                process.stdout.write('\t');
            }
        });

    }

}

////////////////GAMECONTROLLER//////////////////////////////////////////////////////
////////////////GAMECONTROLLER//////////////////////////////////////////////////////
// holds all planets and performs the action for the planets

let gameState = {
    start: 1, run: 2, end: 3
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


class GameController {
    constructor() {
        this.state = 0;
        this.players = new Array();
        this.universe = null;
        this.visualizer = null;
        this.fleets = new Array(100);
        this.setup();
        this.start();
    }

    start() {
        while (true) {
            this.nextRound();
            if (this.state == gameState.end) {
                break;
            }
        }
    }

    setup() {
        this.universe = new Universe(40, 30, 39, 10);
        this.players.push(new Player('fflorey', 1, colors.red.bold));
        this.players.push(new Player('scheuber', 2, colors.green.bold));
        this.universe.addPlayer(1);
        this.universe.addPlayer(2);
        this.visualizer = new Visualizer(this.universe, this.players);
        console.log('DIST: ' + this.universe.calcDistance(1, 2));
    }

    nextRound() {
        this.visualizer.drawUniverse();
        this.visualizer.drawSystems();

        console.log('l:' + this.players.length);
        for (let index = 0; index < this.players.length; index++) {
            const player = this.players[index];        
            this.getCommands(player);
        }
        console.log('ohem');

        this.state = gameState.end;
        this.universe.nextRound();
    }

    // DOES NOT WORK!!

    getCommands(player) {

        rl.question('Your command, ' + player.name + ': ', (cmd) => {
            console.log('understood - i will do so...' + cmd);
            if (cmd == 'ok') {
                return;
            } else {
                console.log('oh, lets see...');
                this.getCommands(player);
            }
            return;
        });

    }
}


new GameController();


