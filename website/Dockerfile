FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# npm ci + un lockfile committe : un build reproductible plutot que
# "quoi qu'il y ait de nouveau sur npm au moment du build".
RUN npm ci --omit=dev && npm cache clean --force

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

# node plutot que curl/wget : garanti present dans l'image de base, aucune
# dependance supplementaire a ajouter juste pour la sonde.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
