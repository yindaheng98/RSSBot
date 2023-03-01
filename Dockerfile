FROM node:14-alpine AS builder
ADD . /app
WORKDIR /app
RUN apk add --no-cache git && npm install
FROM node:14-alpine
COPY --from=builder /app /app
WORKDIR /app
CMD ["npm", "run", "start"]