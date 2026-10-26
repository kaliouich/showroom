// Consumer du topic tamagotchi.events. Il garde les derniers evenements en
// memoire et les diffuse en SSE ; le site vitrine le relaie aux visiteurs.
// Le topic reste la source de verite : ce service est jetable, un redemarrage
// reprend simplement au dernier offset commite de son consumer group.
const fs = require('fs');
const express = require('express');
const { Kafka, logLevel } = require('kafkajs');
const client = require('prom-client');

const BROKERS = (process.env.KAFKA_BROKERS || 'showroom-kafka-bootstrap.kafka.svc:9093').split(',');
const TOPIC = process.env.KAFKA_TOPIC || 'tamagotchi.events';
const GROUP_ID = process.env.KAFKA_GROUP_ID || 'event-feed';
const BUFFER_SIZE = 50;
const MAX_CLIENTS = 100;

client.collectDefaultMetrics();
const messagesTotal = new client.Counter({
  name: 'event_feed_messages_total',
  help: 'Evenements consommes depuis Kafka',
  labelNames: ['type'],
});
const e2eLatency = new client.Histogram({
  name: 'event_feed_end_to_end_seconds',
  help: 'Delai entre la production de l evenement par l API et sa consommation',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 15],
});
const connectedGauge = new client.Gauge({
  name: 'event_feed_consumer_connected',
  help: '1 si le consumer est connecte au groupe, 0 sinon',
});
const sseClients = new client.Gauge({
  name: 'event_feed_sse_clients',
  help: 'Visiteurs connectes au flux SSE',
});

const recent = [];
const clients = new Set();

function broadcast(evt) {
  const data = `data: ${JSON.stringify(evt)}\n\n`;
  for (const res of clients) res.write(data);
}

const kafka = new Kafka({
  clientId: 'event-feed',
  brokers: BROKERS,
  logLevel: logLevel.WARN,
  ssl: { ca: [fs.readFileSync(process.env.KAFKA_CA_FILE || '/etc/kafka/ca.crt', 'utf8')] },
  sasl: {
    mechanism: 'scram-sha-512',
    username: process.env.KAFKA_USER,
    password: process.env.KAFKA_PASSWORD,
  },
});
const consumer = kafka.consumer({ groupId: GROUP_ID });
consumer.on(consumer.events.GROUP_JOIN, () => connectedGauge.set(1));
consumer.on(consumer.events.STOP, () => connectedGauge.set(0));
consumer.on(consumer.events.CRASH, () => connectedGauge.set(0));

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message, partition }) => {
      let evt;
      try {
        evt = JSON.parse(message.value.toString());
      } catch {
        return; // message illisible : on ne bloque pas la partition
      }
      evt.partition = partition;
      evt.offset = message.offset;
      messagesTotal.inc({ type: evt.type || 'unknown' });
      if (evt.ts) e2eLatency.observe(Math.max(0, (Date.now() - evt.ts) / 1000));
      recent.unshift(evt);
      if (recent.length > BUFFER_SIZE) recent.pop();
      broadcast(evt);
    },
  });
}

const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
app.get('/recent', (req, res) => res.json(recent));
app.get('/stream', (req, res) => {
  if (clients.size >= MAX_CLIENTS) return res.status(503).end();
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': connected\n\n');
  clients.add(res);
  sseClients.set(clients.size);
  // Battement nomme : un commentaire SSE (": ping") est invisible pour le navigateur, alors qu'un
  // evenement nomme permet au site de detecter un flux silencieusement coupe.
  const ping = setInterval(() => res.write('event: ping\ndata: {}\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
    sseClients.set(clients.size);
  });
});

app.listen(8080, '0.0.0.0', () => console.log('event-feed listening on 8080'));
run().catch((err) => {
  console.error('consumer failed:', err.message);
  process.exit(1); // Kubernetes redemarre le pod, le groupe reprend ou il en etait
});
