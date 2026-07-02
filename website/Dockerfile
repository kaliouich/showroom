FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js .
COPY index.html ./public/
COPY issues.html ./public/
COPY about.html ./public/
COPY diy.html ./public/
COPY css/ ./public/css/
COPY js/ ./public/js/
COPY assets/ ./public/assets/

EXPOSE 3000

CMD ["node", "server.js"]
