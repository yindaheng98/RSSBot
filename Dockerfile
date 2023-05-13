FROM node:18-alpine AS builder
ADD . /app
WORKDIR /app
RUN apk add --no-cache git && npm install
FROM node:18-alpine
COPY --from=builder /app /app
WORKDIR /app
CMD ["npm", "run", "start"]