# Build multi-etapes : "npm" lui-meme embarque ses propres dependances
# internes (tar, brace-expansion...) pour son usage propre, sans rapport avec
# ce que l'app charge au runtime. Un scan Trivy en CI les a signalees en
# HIGH/CRITICAL alors que `npm ls` cote app renvoie 0 vulnerabilite : elles
# vivent dans /usr/local/lib/node_modules/npm/node_modules, jamais dans
# node_modules/ de l'app. node server.js n'a jamais besoin de npm au runtime,
# donc l'etape finale ne le contient pas — le probleme disparait avec sa
# cause plutot que d'ignorer des CVE une par une.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# npm ci + un lockfile committe : un build reproductible plutot que
# "quoi qu'il y ait de nouveau sur npm au moment du build".
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app

# Paquets systeme Alpine a jour : la version d'openssl embarquee dans l'image
# de base a accumule des CVE HIGH entre deux versions du tag node:20-alpine.
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js .
COPY index.html ./public/
COPY issues.html ./public/
COPY about.html ./public/
COPY css/ ./public/css/
COPY js/ ./public/js/
# assets/ n'est pas copie : c'est un repertoire vide, jamais suivi par git
# (git ne suit pas les repertoires vides). Le build local reussissait car il
# existait sur le disque de ce serveur ; la CI, elle, part d'un clone frais du
# depot et echoue sur "assets: not found" — exactement ce que la CI est censee
# attraper.

# Le serveur ne fait que lire ses fichiers et ecoute sur 3000 : aucun besoin
# de root. L'image node fournit l'utilisateur non privilegie "node" (uid 1000).
USER node

EXPOSE 3000

# node plutot que curl/wget : garanti present dans l'image de base, aucune
# dependance supplementaire a ajouter juste pour la sonde.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
