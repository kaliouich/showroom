'use strict';
// Tue un broker Kafka sur demande, avec des garde-fous. C'est le seul composant
// autorise a supprimer des pods dans le namespace kafka, et seulement les trois
// brokers (RBAC par nom). Le site vitrine, lui, reste en lecture seule : il
// appelle ce service, qui decide.
const http = require('http');
const https = require('https');
const fs = require('fs');

const NS = process.env.NAMESPACE || 'kafka';
const BROKERS = (process.env.BROKERS || 'showroom-dual-role-0,showroom-dual-role-1,showroom-dual-role-2').split(',');
const PROM = process.env.PROM_URL || 'http://kube-prometheus-kube-prome-prometheus.monitoring.svc.cluster.local:9090';
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS || 10 * 60 * 1000);
const SA = '/var/run/secrets/kubernetes.io/serviceaccount';
const CA = fs.readFileSync(`${SA}/ca.crt`);

let lastKillAt = 0;

function kube(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: process.env.KUBERNETES_SERVICE_HOST, port: process.env.KUBERNETES_SERVICE_PORT,
      path, method, ca: CA, timeout: 5000,
      headers: {
        Authorization: `Bearer ${fs.readFileSync(`${SA}/token`, 'utf8').trim()}`,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 300) return reject(new Error(`kube ${method} ${path}: ${res.statusCode}`));
        try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('kube timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

function promScalar(query) {
  return new Promise((resolve, reject) => {
    http.get(`${PROM}/api/v1/query?query=${encodeURIComponent(query)}`, { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const r = JSON.parse(data).data.result;
          resolve(r.length ? Number(r[0].value[1]) : 0);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const isReady = (pod) => (pod.status.conditions || []).some(c => c.type === 'Ready' && c.status === 'True');

async function killOne() {
  const now = Date.now();
  if (now - lastKillAt < COOLDOWN_MS) {
    return { code: 429, body: { error: 'cooldown', retryAfterMs: COOLDOWN_MS - (now - lastKillAt) } };
  }
  // Reserve le creneau avant tout await : deux clics simultanes ne passent pas ensemble.
  const previous = lastKillAt;
  lastKillAt = now;
  const release = (resp) => { lastKillAt = previous; return resp; };
  try {
    const pods = (await kube('GET', `/api/v1/namespaces/${NS}/pods?labelSelector=strimzi.io/cluster%3Dshowroom,strimzi.io/kind%3DKafka`)).items || [];
    const brokers = pods.filter(p => BROKERS.includes(p.metadata.name));
    if (brokers.length !== BROKERS.length || !brokers.every(isReady)) {
      return release({ code: 409, body: { error: 'cluster_degraded' } });
    }
    // min.insync.replicas = 2 : un seul broker peut tomber sans perdre d'ecriture.
    // Si des partitions ne sont deja plus completement repliquees, on n'en tue pas un deuxieme.
    if ((await promScalar('sum(kafka_server_replicamanager_underreplicatedpartitions)')) > 0) {
      return release({ code: 409, body: { error: 'cluster_degraded' } });
    }
    const victim = BROKERS[Math.floor(Math.random() * BROKERS.length)];
    // gracePeriodSeconds 0 : arret brutal, comme un processus tue, sans arret propre.
    await kube('DELETE', `/api/v1/namespaces/${NS}/pods/${victim}`, { gracePeriodSeconds: 0 });
    console.log(`[chaos] broker ${victim} supprime`);
    return { code: 200, body: { killed: victim, timestamp: now } };
  } catch (e) {
    console.error('[chaos] echec:', e.message);
    return release({ code: 502, body: { error: 'unavailable' } });
  }
}

http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.method === 'GET' && req.url === '/healthz') return send(200, { ok: true });
  if (req.method === 'POST' && req.url === '/kill') { const r = await killOne(); return send(r.code, r.body); }
  send(404, { error: 'not_found' });
}).listen(8080, () => console.log('broker-chaos sur 8080'));
