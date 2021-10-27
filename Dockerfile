FROM node:16-alpine AS builder

COPY backend/package* /app/backend/
RUN cd /app/backend && npm ci --production

COPY frontend/package* /app/frontend/
RUN cd /app/frontend && npm ci --production

COPY . /app

# Delete unused stuff:
WORKDIR /app/frontend
RUN mv node_modules node_modules0
RUN mkdir node_modules
RUN mv node_modules0/socket.io-client node_modules/socket.io-client
RUN mv node_modules0/timeago.js       node_modules/timeago.js
RUN rm -r node_modules0

############################################

FROM node:16-alpine

COPY --from=builder /app /app

EXPOSE 42024
WORKDIR /app/backend
CMD ["npm", "start"]
