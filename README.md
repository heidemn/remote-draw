# Remote-Draw

Collaborative painting on a canvas over the network, using socket.io.

Mouse + touch supported.  
Legacy browsers not supported.

![Lobby](_docs/1_lobby.png)  
![Drawing session](_docs/2_draw.png)

## Dependencies
* Reverse Proxy: Caddy 2 https://caddyserver.com/
* Backend: Node.js 14 (version 12 probably also works)
* Messaging: https://socket.io/
* Server: https://github.com/expressjs/express
* UI: https://github.com/hustcc/timeago.js

# Usage
## Install dependencies
```sh
$ ./npm-ci.sh
```

## Run locally
Start the backend server (frontend included):

```sh
$ cd backend
backend$ npm start
```

Afterwards, open http://localhost:42024 to enter the "lobby".  
Open the website in multiple tabs to simulate multiple users.

## Deploy on Heroku
Preparations (once):

* Sign up for Heroku free tier.
* Install Heroku CLI.
* Clone this repo.
* `heroku create YOUR_APP_NAME` (once)

(Re-)Deploy:

* `./heroku-deploy.sh --login`  
  (Option `--login` is probably only needed for first run.)  
  (See script source for options to configure the app.)
* Browser should open automatically; if not, open: `https://YOUR_APP_NAME.herokuapp.com/`

## Deploy on a Linux server with HTTPS
If you want to run the app on your "own" server.

* Register your internet domain: `DOMAIN` (e.g. `example.com`).  
  Replace `DOMAIN` with your custom domain everywhere below.
* Start a server, e.g. on EC2.  
  Make sure that ports 80 + 443 are publicly available for requesting an HTTPS certificate using ACME (Let's Encrypt).
* Add `A` and/or `AAAA` DNS records for `DOMAIN` and `*.DOMAIN` (or `backend.DOMAIN`).
* Install Node.js 12.
* Install Caddy 2 (used as reverse proxy): https://caddyserver.com/docs/download  
  (Use one of the package manager options, if available for your distribution.)
* Clone the Git repo on the server.
* `./npm-ci.sh`
* `./run.sh DOMAIN`  
  (Press Ctrl-C to exit.)
* Open the website `https://DOMAIN` in your browser.  
  Authenticate using the dummy credentials `user` and `password`. (To disable authentication, remove the `basicauth` block from `proxy/Caddyfile`.)  
  If you get a TLS error, then probably Let's Encrypt can't access your server. Look at the Caddy console output for details.
