FROM node:14-alpine
ADD . /app
WORKDIR /app
RUN npm install && npm run prepare
CMD ["npm", "run", "start"]