const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// K8s API config
const K8S_HOST = 'https://kubernetes.default.svc';
let token = '';
try {
  token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
} catch (e) {
  console.log('Not running inside K8s, API calls will fail or use mock data');
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false // In-cluster K8s certs are self-signed
});

async function k8sGet(path) {
  if (!token) return null;
  const res = await fetch(`${K8S_HOST}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    agent: httpsAgent // note: node 18+ native fetch doesn't use agent easily, wait
  });
  return res.json();
}

// Fallback for Node 18+ native fetch with custom agent
const fetchWithAgent = require('https').request;
function k8sRequest(apiPath) {
  return new Promise((resolve, reject) => {
    if (!token) return resolve(null);
    const options = {
      hostname: 'kubernetes.default.svc',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      rejectUnauthorized: false
    };
    const req = fetchWithAgent(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Prometheus (node-exporter) is the only honest source for node metrics here:
// the node reports ephemeral-storage as 44Gi while the root filesystem is 183Gi,
// so kubelet capacity cannot be used for the disk gauge.
const PROM = process.env.PROM_URL
  || 'http://kube-prometheus-kube-prome-prometheus.monitoring.svc.cluster.local:9090';

function promQuery(query) {
  return new Promise((resolve) => {
    const url = `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`;
    const req = require('http').get(url, { timeout: 4000 }, (r) => {
      let data = '';
      r.on('data', chunk => data += chunk);
      r.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const result = parsed.data && parsed.data.result;
          resolve(result && result.length ? parseFloat(result[0].value[1]) : null);
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

const GB = 1024 ** 3;
const gauge = (pct, label) =>
  pct === null ? { pct: null, label: '—' } : { pct: Math.round(pct * 10) / 10, label };

async function nodeMetrics() {
  const [cpu, memTotal, memAvail, fsTotal, fsAvail] = await Promise.all([
    promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    promQuery('node_memory_MemTotal_bytes'),
    promQuery('node_memory_MemAvailable_bytes'),
    promQuery('node_filesystem_size_bytes{mountpoint="/"}'),
    promQuery('node_filesystem_avail_bytes{mountpoint="/"}')
  ]);

  const ramOk = memTotal !== null && memAvail !== null;
  const ramUsed = ramOk ? memTotal - memAvail : null;
  const diskOk = fsTotal !== null && fsAvail !== null;
  const diskUsed = diskOk ? fsTotal - fsAvail : null;

  return {
    cpu: gauge(cpu, cpu === null ? null : `${Math.round(cpu)}%`),
    ram: gauge(ramOk ? (ramUsed / memTotal) * 100 : null,
      ramOk ? `${(ramUsed / GB).toFixed(1)} / ${(memTotal / GB).toFixed(1)} GB` : null),
    disk: gauge(diskOk ? (diskUsed / fsTotal) * 100 : null,
      diskOk ? `${Math.round(diskUsed / GB)} / ${Math.round(fsTotal / GB)} GB` : null)
  };
}

app.get('/api/infra', async (req, res) => {
  try {
    const [podsRes, nodesRes, nsRes, svcRes] = await Promise.all([
      k8sRequest('/api/v1/pods'),
      k8sRequest('/api/v1/nodes'),
      k8sRequest('/api/v1/namespaces'),
      k8sRequest('/api/v1/services')
    ]);

    if (!podsRes || !podsRes.items) {
      return res.json({ error: 'No data (mock mode)' });
    }

    const pods = podsRes.items.map(p => {
      const containerStatuses = p.status.containerStatuses || [];
      const readyContainers = containerStatuses.filter(c => c.ready).length;
      const totalContainers = p.spec.containers ? p.spec.containers.length : 0;
      return {
        name: p.metadata.name,
        ns: p.metadata.namespace,
        status: p.status.phase,
        ready: `${readyContainers}/${totalContainers}`
      };
    }).sort((a, b) => a.ns.localeCompare(b.ns) || a.name.localeCompare(b.name));

    const metrics = await nodeMetrics();

    res.json({
      cpu: metrics.cpu,
      ram: metrics.ram,
      disk: metrics.disk,
      podCount: pods.length,
      nsCount: nsRes.items.length,
      svcCount: svcRes.items.length,
      pods: pods
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Showcase backend listening on port ${port}`);
});
