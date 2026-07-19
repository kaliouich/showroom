FROM node:20-alpine

WORKDIR /app

# `npm ci` suit strictement le lockfile : builds reproductibles, contrairement
# à `npm install` qui peut ramener des versions différentes d'un build à l'autre.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js .
COPY index.html issues.html about.html ./public/
COPY css/ ./public/css/
COPY js/ ./public/js/

# L'image node fournit un utilisateur `node` non-privilégié : sans ce USER,
# le process tourne en root dans le conteneur.
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
