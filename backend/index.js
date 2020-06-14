const io = require('socket.io')();
// var rndWord = require('random-noun-generator-german');
// // generate a random german noun
// console.log(rndWord());
// console.log(rndWord());
// console.log(rndWord());
// console.log(rndWord());
// console.log(rndWord());

let games = {
	// gameId: {
	// 	gameId,
	// 	clients: [{clientId, name}, ...]
	// 	picture
	// }
};

// let picture = [
// 	// {
// 	// 	client: 'ID',
// 	// 	i: 0,
// 	// 	color: [r,g,b],
// 	// 	path: [[x,y], [x,y], ...]
// 	// }
// ];


setInterval(() => {
	let gamesList = [];
	for (let gameId in games) {
		gamesList.push({
			id: gameId,
			started: games[gameId].started,
			players: games[gameId].clients.map(client => client.name)
		});
	}
	// Top: newest / bottom: oldest game
	gamesList.sort((a, b) => b.started - a.started);
	io.emit('games', {games: gamesList});
}, 3000);

function getGameId(msg, mustExist = true) {
	const gameId = msg && msg.gameId;
	if (!gameId || gameId.length !== 22) {
		return false;
	}
	if (mustExist && !games[gameId]) {
		return false;
	}

	return gameId;
}

io.on('connection', socket => {
	let socketClientId;
	console.log('Client connected!'); //, socket);

	socket.on('disconnect', () => {
		console.log('ON disconnect:', socketClientId);
		if (!socketClientId) {
			return;
		}

		for (let gameId in games) {
			games[gameId].clients = games[gameId].clients.filter(el => {
				return el.clientId !== socketClientId;
			});
			if (games[gameId].clients.length === 0) {
				console.log('*TERMINATE game:', gameId);
				delete games[gameId];
			}
		}
	});

	// socket.on('games', msg => {});

	socket.on('join', msg => {
		console.log('ON join:', msg);
		console.log('ON join > gameId  :', msg.gameId);
		console.log('ON join > clientId:', msg.clientId);
		console.log('ON join > name    :', msg.name);
		const gameId = getGameId(msg, false);
		if (!gameId) {
			console.error('on(join): Invalid game ID', msg && msg.gameId);
			return false;
		}

		socketClientId = msg.clientId;

		socket.join(gameId);
		games[gameId] = games[gameId] || {
			gameId,
			started: Date.now(),
			clients: [],
			picture: []
		};
		games[gameId].clients.push({
			clientId: msg.clientId,
			name: msg.name
		});

		// Let new player get current painting:
		io.to(gameId).emit('picture', games[gameId].picture);
	});

	socket.on('clear', msg => {
		const gameId = getGameId(msg);
		if (!gameId) {
			console.error('on(clear): Invalid game ID', msg && msg.gameId);
			return false;
		}

		console.log('ON clear:', gameId, msg.color);
		games[gameId].picture = [];
		io.to(gameId).emit('clear', msg);
	});

	socket.on('draw', msg => {
		const gameId = getGameId(msg);
		if (!gameId) {
			console.error('on(draw): Invalid game ID', msg && msg.gameId);
			return false;
		}		
		if (!msg || !msg.gameId || !msg.client || (typeof msg.i) !== 'number' || !msg.color || !msg.path) {
			console.error('Invalid message', msg);
			return;
		}

		//console.log('ON draw:', msg);
		console.log('ON draw: gameId', gameId, 'client', msg.client, 'path.length', msg.path.length);
		games[gameId].picture.push(msg);
		io.to(gameId).emit('picture', games[gameId].picture);
	});
});
io.listen(42023);
io.httpServer.on('listening', () => console.log('socket.io listening on port 42023!'));

const express = require('express');
const app = express();
// TODO: no-cache ?
app.use('/', express.static(__dirname + '/../frontend'));
app.listen(42024, () => console.log('Frontend listening on port 42024!'));
