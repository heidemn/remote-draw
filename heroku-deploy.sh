#!/bin/bash
set -ex

if [ "$1" = "--login" ]; then
	heroku container:login
fi

heroku container:push web
heroku container:release web
heroku open
