FROM node:alpine-14 AS builder
COPY . /app

WORKDIR /app/frontend
RUN npm ci --production

RUN mkdir -p /build/frontend/node_modules/
RUN cp -r node_modules/socket.io-client /build/frontend/node_modules/
RUN cp -r node_modules/timeago.js /build/frontend/node_modules/
# DEBUG
RUN find /build/frontend/

WORKDIR /app/backend
RUN npm ci --production

WORKDIR /
RUN mv /app/backend /build/backend

############################################

FROM node:alpine-14

COPY --from=builder /build /app

EXPOSE 42024
WORKDIR /app/backend
CMD ["npm", "start"]
