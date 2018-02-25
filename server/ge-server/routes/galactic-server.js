var colors = require('colors/safe');
var express = require('express');
var ge = require('../ge-main');
const crypto = require('crypto');
// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({ origin: true });

var router = express.Router();

let GEGameController = new ge.GameController(2);
GEGameController.alive();


// error object

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

/* GET home page. */
router.get('/', function (req, res) {
  res.send('well done');
});

router.get('/map/player/:hash', function (req, res) {
  cors(req, res, () => {
    let hash = req.params.hash;
    let playerId = isHashValid(hash);
    console.log('hash: ' + hash + ' playerID: ' + playerId);
    if (playerId != -1) {
      responseMsg.text = GEGameController.getMapForPlayerId(playerId);
    }
    res.send(responseMsg);
  });
});

router.get('/state/:hash', function (req, res) {
  let hash = req.params.hash;
  if (isHashValid(hash) != -1) {
    responseMsg.text = GEGameController.state;
  }
  res.send(responseMsg);
});

router.get('/getplayers/:hash', function (req, res) {
  let hash = req.params.hash;
  if (isHashValid(hash) != -1) {
    responseMsg.text = GEGameController.players;
  }
  res.send(responseMsg);
});

// register new player for game 
// result: hash for all reuqests for that user
router.post('/newplayer', function (req, res) {
  cors(req, res, () => {
    responseMsg.status = STATUS_CODES.OK;
    responseMsg.errorcode = ERROR_CODES.NO_ERROR;
    let name = req.query.name;
    let color = req.query.color;
    console.log('newplayer called!!');
    console.log('parameter: ' + name + ' c:' + color + '<');
    if (name == undefined || color == undefined) {
      responseMsg.status = STATUS_CODES.CLIENT_ERROR;
      responseMsg.errorcode = ERROR_CODES.PARAMETER_MISSING;
      responseMsg.text = 'parameter not set';
    } else {
      let player = new ge.Player(name, 1, getColor(color), color);
      let playerId = GEGameController.addPlayer(player);
      if (playerId == 0) {
        responseMsg.status = STATUS_CODES.SYSTEM_ERROR;
        responseMsg.errorcode = ERROR_CODES.SEATS_TAKEN;
        responseMsg.text = 'registration denied, all seats taken';
      } else if (playerId == -1) {
        responseMsg.status = STATUS_CODES.SYSTEM_ERROR;
        responseMsg.errorcode = ERROR_CODES.GAME_ALLREADY_RUNNING;
        responseMsg.text = 'registration denied, game allready running';
      } else {
        let hash = crypto.createHash('sha256');
        hash.update('' + name + color + Date.now());
        responseMsg.text = hash.digest('hex');
        GEGameController.updateHashForPlayerId(playerId, responseMsg.text);
        hash = null;
      }
    }
    console.log('result: ' + JSON.stringify(responseMsg));
    res.send(responseMsg);
  });
});


router.post('/newcmd/:hash', function (req, res) {
  cors(req, res, () => {
    let hash = req.params.hash;
    let from = req.query.from;
    let destination = req.query.destination;
    let ships = req.query.ships;
    let special = req.query.special;
    let playerId = isHashValid(hash);
    console.log('hash: ' + hash + ' playerID: ' + playerId);
    console.log('hello - a problem?');
    if (playerId == -1) {
      // error....
      responseMsg.text = GEGameController.newCmdForPlayer(playerId, cmd);
    }
    if (from == undefined || destination == undefined) {
      responseMsg.status = STATUS_CODES.CLIENT_ERROR;
      responseMsg.errorcode = ERROR_CODES.PARAMETER_MISSING;
      responseMsg.text = 'parameter cmd not set';
    }
    if (ships == '' && special == '') {
      // time measurement
      responseMsg.text = '18 y';
    }
    res.send(responseMsg);
  })
});

// needs to be called by a client (at least every x seconds, otherwise killed)
// does not mean: you do something every x seconds, but the client must be 
// active and open
router.put('/pingalive/:hash', function (req, res) {
  let hash = req.params.hash;
  let playerId = isHashValid(hash);
  console.log('hash: ' + hash + ' playerID: ' + playerId);
  if (playerId != -1) {
    responseMsg.text = GEGameController.markPlayerAlive(playerId);
  }
  res.send(responseMsg);
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// hash

function isHashValid(hash) {
  let playerId = GEGameController.isHashValid(hash);
  if (playerId == -1) {
    responseMsg.status = STATUS_CODES.SYSTEM_ERROR;
    responseMsg.errorcode = ERROR_CODES.INVALID_HASH;
    responseMsg.text = 'invalid hash for given id';
  }
  return playerId;
}

function getColor(colorstring) {
  let color = colors.white.bold;
  switch (colorstring) {
    case 'red':
      color = colors.red.bold;
      break;
    case 'blue':
      color = colors.blue.bold;
      break;
    case 'green':
      color = colors.green.bold;
      break;
    case 'yellow':
      color = colors.yellow.bold;
      break;
  }
  return color;
}

////////////////////////////////////////////////////////////////////////////////

module.exports = router;
