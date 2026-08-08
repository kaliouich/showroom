FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js .
COPY index.html ./public/
COPY issues.html ./public/
COPY about.html ./public/
COPY css/ ./public/css/
COPY js/ ./public/js/
COPY assets/ ./public/assets/

# Le serveur ne fait que lire ses fichiers et ecoute sur 3000 : aucun besoin
# de root. L'image node fournit l'utilisateur non privilegie "node" (uid 1000).
USER node

EXPOSE 3000

CMD ["node", "server.js"]
