FROM node:20-alpine
LABEL org.opencontainers.image.source="http://git.88.96.58.76.nip.io/khalil/tamagotchi-service"
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
