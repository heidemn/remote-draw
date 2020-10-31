function generateId() {
	const bytes = new Uint8Array(16); // same length as UUID
	window.crypto.getRandomValues(bytes);
	const base64 = btoa(String.fromCharCode(...bytes));
	const base64Url = base64
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	console.log('My ID:', base64Url);
	return base64Url;
}

const urlParams = new URLSearchParams(window.location.search);

const clientId = generateId();
const playerName = urlParams.get('name');
const gameId = urlParams.get('join') || generateId();

// Make sure that reloading the page leads to the current painting, instead of creating another one.
// If a history entry should be created, use pushState() instead.
if (!urlParams.get('join') && window.history.replaceState) {
	const newURL = new URL(window.location.href);
	const nameUrl = encodeURIComponent(playerName);
	newURL.search = `?join=${gameId}&name=${nameUrl}`;
	window.history.replaceState({ path: newURL.href }, '', newURL.href);
}


// const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
// const backendUrl = isLocal ?
// 	`${window.location.protocol}//${window.location.hostname}:42023` :
// 	`${window.location.protocol}//backend.${window.location.host}`;
// console.log('Connecting to backend', backendUrl);
// let socket = io(backendUrl);
let socket = io();

let drawCanvas, drawCtx;
let paletteCanvas, paletteCtx;

let prevPt; // prevPt === path[LAST]
let path = [];
let color = [255, 0, 0];
let clearColor = [255, 255, 255];
//let colorCss = 'rgb(255,0,0)';

// let drawing = {
// 	prevPt: undefined,
// 	color: [255, 0, 0],
// 	path: []
// };
let drawnLocal = [];
let drawnLocalIndex = 0;
let drawnServer = [];

function cssRGB(rgb, g, b) {
	if (typeof rgb === 'number') {
		rgb = [rgb, g, b];
	}
	return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function drawPath(pathObj) {
	const path = pathObj.path;
	drawCtx.strokeStyle = cssRGB(pathObj.color);
	if (path.length > 1) {
		drawCtx.beginPath();
		drawCtx.moveTo(path[0][0], path[0][1]);
		for (let i = 0; i < path.length; i++) {
			drawCtx.lineTo(path[i][0], path[i][1]);
		}
		drawCtx.stroke();		
	} else if (path.length === 1) {
		drawDot(path[0]);
	}
}

function drawAll() {
	//drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
	drawCtx.fillStyle = cssRGB(clearColor);
	drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

	for (let p of drawnServer) {
		drawPath(p);
	}
	for (let p of drawnLocal) {
		drawPath(p);
	}
	if (path.length > 0) {
		drawPath({ color, path });
	}
	// Reset color
	drawCtx.strokeStyle = cssRGB(color);
}

function onPicture(paths, clearColorIn) {
	clearColor = clearColorIn;
	for (let pathObj of paths) {
		if (pathObj.client === clientId) {
			drawnLocal = drawnLocal.filter(el => el.i !== pathObj.i);
		}
	}
	drawnServer = paths;
	drawAll();
}

function draw(pt) {
	drawCtx.beginPath();
	drawCtx.moveTo(prevPt[0], prevPt[1]);
	drawCtx.lineTo(pt[0], pt[1]);
	drawCtx.stroke();
}

function drawDot(pt) {
	drawCtx.beginPath();
	drawCtx.moveTo(pt[0] - 0.5, pt[1] - 0.5);
	drawCtx.lineTo(pt[0] - 0.5, pt[1] - 0.5);
	drawCtx.lineTo(pt[0] - 0.5, pt[1] + 0.5);
	drawCtx.lineTo(pt[0] + 0.5, pt[1] + 0.5);
	drawCtx.lineTo(pt[0] + 0.5, pt[1] - 0.5);
	drawCtx.lineTo(pt[0] - 0.5, pt[1] - 0.5);
	drawCtx.stroke();
}

function scaledOffsetXY(e, canvas) {
	//console.log('offset', e.offsetX, e.offsetY);
	if (e.offsetX !== undefined && e.offsetY !== undefined) {
		// mouse
		return [
			e.offsetX * canvas.width / canvas.clientWidth,
			e.offsetY * canvas.height / canvas.clientHeight
		];
	} else if (e.targetTouches && e.targetTouches[0]) {
		// touch: https://stackoverflow.com/questions/17130940/retrieve-the-same-offsetx-on-touch-like-mouse-event
		const rect = e.target.getBoundingClientRect();
		return [
			(e.targetTouches[0].pageX - rect.left) * canvas.width / canvas.clientWidth,
			(e.targetTouches[0].pageY - rect.top) * canvas.height / canvas.clientHeight
		]
	} else {
		console.assert(false, 'Error: neither a valid mouse nor touch event!');
		console.error(e);
		return [Number.NaN, Number.NaN];
	}
}

function onMouseDown(e) {
	drawCanvas.onmousemove = onMouseDrag;
	drawCanvas.ontouchmove = onMouseDrag;

	//console.log('mousedown', e);

	// If canvas is not scaled:
	//prevPt = [e.offsetX, e.offsetY];
	// var canvasX = mouseX * canvas.width / canvas.clientWidth;
	prevPt = scaledOffsetXY(e, drawCanvas);

	path = [prevPt];
	drawDot(prevPt);
}
function onMouseUp(e) {
	drawCanvas.onmousemove = undefined;
	drawCanvas.ontouchmove = undefined;
	//console.log('mouseup', e);
	//const pt = [e.offsetX, e.offsetY];
	//draw(pt);
	if (path.length > 0) {
		const thisDraw = {
			gameId,
			client: clientId,
			i: drawnLocalIndex,
			color,
			path
		};
		drawnLocal.push(thisDraw);
		drawnLocalIndex++;
		console.log('EMIT: draw', thisDraw);
		socket.emit('draw', thisDraw);
	}

	prevPt = undefined;
	path = [];
	color = [color[0], color[1], color[2]]; // copy
}
function onMouseDrag(e) {
	//console.log('mousemove (drag)', e);
	const pt = scaledOffsetXY(e, drawCanvas);// [e.offsetX, e.offsetY];
	draw(pt);
	prevPt = pt;
	path.push(pt);
}

function chooseColor(e) {
	const xy = scaledOffsetXY(e, paletteCanvas);
	const x = xy[0]; //e.offsetX;
	const y = xy[1]; //e.offsetY;
	color = paletteCtx.getImageData(x, y, 1, 1).data;
	const colorCss = cssRGB(color);
	drawCtx.strokeStyle = colorCss;
	console.log('Set color @', x, y, '| color:', colorCss);

	const colorElem = document.getElementById('current-color');
	colorElem.style.backgroundColor = colorCss;
}

function onClear(msg) {
	clearColor = msg.color;

	drawnLocal = [];
	drawnServer = [];
	drawAll();
}
function newPainting(mode) {
	const c = mode === 0 ? color : (mode === 1 ? [255,255,255] : [0,0,0]);
	socket.emit('clear', {
		gameId,
		clientId,
		color: c
	});
}

function getGradient(w, darken, brighten) {
	const d = darken;
	const b = brighten;
	const gradient = paletteCtx.createLinearGradient(0, 0, w, 0);
	gradient.addColorStop(0, cssRGB(b, b, 255 - d));
	gradient.addColorStop(0.1, cssRGB(b, 255 - d, 255 - d));
	gradient.addColorStop(0.2, cssRGB(b, 255 - d, 255 - d));
	gradient.addColorStop(0.3, cssRGB(b, 255 - d, b));
	gradient.addColorStop(0.4, cssRGB(255 - d, 255 - d, b));
	gradient.addColorStop(0.5, cssRGB(255 - d, 255 - d, b));
	gradient.addColorStop(0.6, cssRGB(255 - d, b, b));
	gradient.addColorStop(0.69, cssRGB(255 - d, b, b));
	gradient.addColorStop(0.695, 'black');
	gradient.addColorStop(0.7, 'black');
	gradient.addColorStop(0.95, 'white');
	gradient.addColorStop(1.0, 'white');
	return gradient;
}

function onResize() {
	const w = window.innerWidth - 16;
	const h = window.innerHeight - 16;
	console.log('onResize', w, h);

	const hButtons = 35;
	const hRem = Math.max(1, Math.round(h - paletteCanvas.clientHeight - hButtons));
	if (w / hRem > drawCanvas.width / drawCanvas.height) {
		// screen is wider than canvas -> reduce canvas width
		const wTarget = Math.round(drawCanvas.width / drawCanvas.height * hRem);
		drawCanvas.style.width = `${wTarget}px`;
		drawCanvas.style.height = `${hRem}px`;
	} else {
		// screen is taller than canvas -> reduce canvas height
		const hTarget = Math.round(drawCanvas.height / drawCanvas.width * w);
		drawCanvas.style.width = `${w}px`;
		drawCanvas.style.height = `${hTarget}px`;
	}

	//drawCanvas
	//paletteCanvas
}

window.onload = function onload() {
	socket.emit('join', {
		gameId,
		clientId,
		name: playerName
	});
	socket.on('clear', onClear);
	socket.on('picture', function(msg) {
		console.log('ON picture', msg);
		onPicture(msg.picture, msg.clearColor);
	});

	drawCanvas = document.getElementById('canvas');
	drawCtx = drawCanvas.getContext('2d');
	drawCtx.strokeStyle = cssRGB(color);
	drawCtx.lineWidth = 3.0;
	drawCanvas.onmousedown  = onMouseDown;
	drawCanvas.ontouchstart = onMouseDown;
	// drawCanvas.onmouseup = onMouseUp;
	window.onmouseup  = onMouseUp;
	window.ontouchend = onMouseUp;

	paletteCanvas = document.getElementById('palette');
	paletteCtx = paletteCanvas.getContext('2d');
	paletteCanvas.onmousedown  = chooseColor;
	paletteCanvas.ontouchstart = chooseColor;
	const w = paletteCanvas.width; //.clientWidth;
	const h = paletteCanvas.height; //clientHeight;
	paletteCtx.fillStyle = getGradient(w, 100, 0); //darken
	paletteCtx.fillRect(0, 0*h/3, w, h/3);
	paletteCtx.fillStyle = getGradient(w, 0, 0); //normal
	paletteCtx.fillRect(0, 1*h/3, w, h/3);
	paletteCtx.fillStyle = getGradient(w, 0, 150); //brighten
	paletteCtx.fillRect(0, 2*h/3, w, h/3);

	window.onresize = onResize;
	onResize();
};
