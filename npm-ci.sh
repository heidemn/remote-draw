#!/bin/sh
set -e

(cd backend  && npm ci)
(cd frontend && npm ci)
