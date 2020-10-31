#!/bin/sh
set -e

if [ -z "$1" ]; then
	echo "ERROR: Required argument: hostname"
	exit 1
fi

echo "Starting backend + frontend servers..."
cd backend
npm start &
cd ..

echo "Starting proxy..."
cd proxy
sudo sh -c "HOST=$1 caddy run"
cd ..

wait
