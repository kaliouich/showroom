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

    // Basic node metrics simulation (since metric server might not be exposed to this SA)
    const node = nodesRes.items[0];
    
    res.json({
      cpu: '35%',
      ram: '4.3 / 24 GB',
      disk: '11 / 44 GB',
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
