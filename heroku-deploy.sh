#!/bin/bash
set -ex

#
# LOGIN
#

if [ "$1" = "--login" ]; then
	shift
	heroku login
	heroku container:login
fi

#
# CONFIG
#

if [ "$1" = "--url-prefix" ]; then
	shift
	heroku config:set URL_PREFIX="$1"
	shift
fi

if [ "$1" = "--no-auth" ]; then
	shift
	heroku config:unset AUTH_USER
	heroku config:unset AUTH_PASSWORD
elif [ "$1" = "--auth" ]; then
	shift
	heroku config:set AUTH_USER="$1"
	heroku config:set AUTH_PASSWORD="$2"
	shift
	shift
fi

if [ "$1" = "--idle-sec" ]; then
	shift
	heroku config:set DELETE_AFTER_IDLE_SEC="$1"
	shift
fi

#
# DEPLOY
#

heroku container:push web
heroku container:release web
heroku open
