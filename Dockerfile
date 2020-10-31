FROM node:14-alpine AS builder
COPY . /app

WORKDIR /app/frontend
RUN npm ci --production

# Delete unused stuff:
RUN mv node_modules node_modules0
RUN mkdir node_modules
RUN mv node_modules0/socket.io-client node_modules/socket.io-client
RUN mv node_modules0/timeago.js       node_modules/timeago.js
RUN rm -r node_modules0

WORKDIR /app/backend
RUN npm ci --production

############################################

FROM node:14-alpine

COPY --from=builder /app /app

EXPOSE 42024
WORKDIR /app/backend
CMD ["npm", "start"]
