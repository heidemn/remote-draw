let games = [];

// const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
// const backendUrl = isLocal ?
// 	`${window.location.protocol}//${window.location.hostname}:42023` :
// 	`${window.location.protocol}//backend.${window.location.host}`;
// console.log('Connecting to backend', backendUrl);
// let socket = io(backendUrl);
let socket = io();

function getName() {
	let nameInput = document.getElementById('name');
	console.log(nameInput);
	return nameInput.value.trim();
}
function loadName() {
	let nameInput = document.getElementById('name');
	let lastName = localStorage.getItem('name');
	if (lastName) {
		nameInput.value = lastName;
	}
}
function saveName() {
	let nameInput = document.getElementById('name');
	localStorage.setItem('name', nameInput.value.trim());
}

function joinGame(id) {
	console.log('Join painting', id);
	saveName();
	const nameUrl = encodeURIComponent(getName());
	window.location.href = `draw.html?join=${id}&name=${nameUrl}`;
}

function startGame() {
	console.log('Start painting');
	saveName();
	const nameUrl = encodeURIComponent(getName());
	window.location.href = `draw.html?start&name=${nameUrl}`;
}

function enable(elem, doEnable) {
	if (!doEnable) {
		elem.disabled = 'disabled';
	} else {
		elem.removeAttribute('disabled');
	}
}

function updateGames(msg) {
	console.log('updateGames()', msg.games);
	games = msg.games;
	const name = getName();
	console.log('Name', name);

	let gamesList = document.getElementById('games-list');
	gamesList.innerHTML = games.length > 0 ? '' : '<li>(none)</li>';
	for (let game of games) {
		let li = document.createElement('li');
		let ago = timeago.format(game.started);
		li.textContent = ago /*game.id*/ + ' (' + game.players.join(', ') + ') ';
		let button = document.createElement('button');
		button.textContent = 'Join painting';
		button.onclick = joinGame.bind(window, game.id);
		enable(button, !!name);
		li.appendChild(button);
		gamesList.appendChild(li);
	}

	let startGameButton = document.getElementById('new-game');
	enable(startGameButton, !!name);
	let nameLabel = document.getElementById('name-label');
	nameLabel.style.color = name ? '#000' : '#f00';
}

function updateName() {
	updateGames({games});
}

socket.on('games', updateGames);

window.onload = function onload() {
	loadName();
	//updateGames({games});
	// updateGames({ games: [
	// 	{
	// 		id: 'abcde',
	// 		players: ['Foo', 'bar', 'booo']
	// 	},
	// 	{
	// 		id: 'zzzzzz',
	// 		players: ['77777', 'ääää', '0000']
	// 	},
	// ]});

	// setInterval(() => {
	// 	console.log('Emit games');
	// 	socket.emit('games', {});
	// }, 5000);
};
