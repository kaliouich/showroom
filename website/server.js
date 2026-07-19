const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Config ----
const SA_DIR = '/var/run/secrets/kubernetes.io/serviceaccount';
const PROMETHEUS_URL = process.env.PROMETHEUS_URL
  || 'http://kube-prometheus-kube-prome-prometheus.monitoring.svc.cluster.local:9090';

// Le ServiceAccount a un ClusterRole en lecture seule sur tout le cluster, mais
// l'endpoint /api/infra est public : on ne divulgue que les namespaces de la
// vitrine. Sans ce filtre, n'importe quel visiteur obtient la topologie complète
// du cluster (quels outils tournent, où) — une carte utile pour un attaquant.
const PUBLIC_NAMESPACES = (process.env.PUBLIC_NAMESPACES || 'showcase,tamagotchi')
  .split(',').map(s => s.trim()).filter(Boolean);

// Le CA du cluster est monté dans le pod : on valide la chaîne au lieu de
// désactiver la vérification TLS.
let clusterCA = null;
try {
  clusterCA = fs.readFileSync(`${SA_DIR}/ca.crt`);
} catch (e) {
  console.warn('CA du cluster introuvable — hors cluster, mode dégradé');
}

// Les tokens projetés expirent (1h par défaut) : relire à chaque appel plutôt
// qu'une seule fois au démarrage, sinon /api/infra part en 401 après une heure.
function readToken() {
  try {
    return fs.readFileSync(`${SA_DIR}/token`, 'utf8').trim();
  } catch (e) {
    return null;
  }
}

function k8sRequest(apiPath) {
  return new Promise((resolve, reject) => {
    const token = readToken();
    if (!token) return resolve(null);

    const req = https.request({
      hostname: 'kubernetes.default.svc',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      ca: clusterCA,
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`K8s ${res.statusCode} sur ${apiPath}`));
        }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timeout K8s sur ${apiPath}`)));
    req.on('error', reject);
    req.end();
  });
}

// ---- Prometheus ----
function promQuery(query) {
  return new Promise((resolve) => {
    const url = new URL('/api/v1/query', PROMETHEUS_URL);
    url.searchParams.set('query', query);

    const client = url.protocol === 'https:' ? https : require('http');
    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const v = parsed?.data?.result?.[0]?.value?.[1];
          resolve(v !== undefined ? Number(v) : null);
        } catch (e) { resolve(null); }
      });
    });
    // Une métrique absente ne doit jamais casser la page : on renvoie null et
    // le frontend affiche "n/a".
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

const GB = 1024 ** 3;
const fmtGB = (bytes) => (bytes / GB).toFixed(1);

app.get('/api/infra', async (req, res) => {
  try {
    const [podsRes, nsRes, svcRes] = await Promise.all([
      k8sRequest('/api/v1/pods'),
      k8sRequest('/api/v1/namespaces'),
      k8sRequest('/api/v1/services')
    ]);

    if (!podsRes || !podsRes.items) {
      return res.status(503).json({ error: 'API Kubernetes injoignable' });
    }

    const pods = podsRes.items
      .filter(p => PUBLIC_NAMESPACES.includes(p.metadata.namespace))
      .map(p => {
        const statuses = p.status.containerStatuses || [];
        return {
          name: p.metadata.name,
          ns: p.metadata.namespace,
          status: p.status.phase,
          restarts: statuses.reduce((n, c) => n + (c.restartCount || 0), 0),
          ready: `${statuses.filter(c => c.ready).length}/${p.spec.containers?.length || 0}`
        };
      })
      .sort((a, b) => a.ns.localeCompare(b.ns) || a.name.localeCompare(b.name));

    // Métriques réelles issues de Prometheus (auparavant codées en dur).
    const [cpuPct, memTotal, memAvail, diskTotal, diskAvail] = await Promise.all([
      promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
      promQuery('sum(node_memory_MemTotal_bytes)'),
      promQuery('sum(node_memory_MemAvailable_bytes)'),
      promQuery('sum(node_filesystem_size_bytes{mountpoint="/"})'),
      promQuery('sum(node_filesystem_avail_bytes{mountpoint="/"})')
    ]);

    res.json({
      cpu: cpuPct !== null ? `${cpuPct.toFixed(1)}%` : 'n/a',
      ram: (memTotal && memAvail !== null)
        ? `${fmtGB(memTotal - memAvail)} / ${fmtGB(memTotal)} GB` : 'n/a',
      disk: (diskTotal && diskAvail !== null)
        ? `${fmtGB(diskTotal - diskAvail)} / ${fmtGB(diskTotal)} GB` : 'n/a',
      podCount: pods.length,
      nsCount: nsRes?.items?.length ?? null,
      svcCount: svcRes?.items?.length ?? null,
      pods
    });
  } catch (err) {
    console.error('/api/infra:', err.message);
    res.status(500).json({ error: 'Récupération des métriques impossible' });
  }
});

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Showcase backend à l'écoute sur le port ${port}`);
  console.log(`Namespaces exposés : ${PUBLIC_NAMESPACES.join(', ')}`);
});
