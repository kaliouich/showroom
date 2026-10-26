// Publication des evenements metier du Tamagotchi vers Kafka.
//
// La base PostgreSQL reste la source de verite : publier est du "best effort"
// et ne doit JAMAIS faire echouer une requete HTTP ni ralentir le chemin
// critique (feed, kill, revive...). Si Kafka est indisponible, l'evenement est
// compte comme echec et perdu pour le flux, mais la creature est bien mise a
// jour. Sans KAFKA_BROKERS, le module est un no-op : l'API tourne comme avant.
const fs = require('fs');
const { Kafka, logLevel, CompressionTypes } = require('kafkajs');
const client = require('prom-client');

const BROKERS = process.env.KAFKA_BROKERS;
const TOPIC = process.env.KAFKA_TOPIC || 'tamagotchi.events';

// Pas de registre ici : server.js expose son propre registre, et c'est lui qui
// enregistre ces metriques (events.metrics). Sur le registre par defaut elles
// n'atteignaient jamais Prometheus, donc un echec de publication, silencieux par
// conception, restait invisible.
const publishedTotal = new client.Counter({
  name: 'tamagotchi_events_published_total',
  help: 'Evenements publies vers Kafka',
  labelNames: ['type'],
  registers: [],
});
const failedTotal = new client.Counter({
  name: 'tamagotchi_events_publish_failed_total',
  help: 'Evenements non publies (Kafka indisponible ou erreur d envoi)',
  labelNames: ['type'],
  registers: [],
});
const producerReady = new client.Gauge({
  name: 'tamagotchi_events_producer_ready',
  help: '1 si le producteur Kafka est connecte, 0 sinon (absent quand Kafka est desactive)',
  registers: [],
});

let producer = null;
let ready = false;

async function start() {
  if (!BROKERS) {
    console.log('Kafka desactive (KAFKA_BROKERS non defini)');
    return;
  }
  const kafka = new Kafka({
    clientId: 'tamagotchi-api',
    brokers: BROKERS.split(','),
    logLevel: logLevel.WARN,
    ssl: { ca: [fs.readFileSync(process.env.KAFKA_CA_FILE || '/etc/kafka/ca.crt', 'utf8')] },
    sasl: {
      mechanism: 'scram-sha-512',
      username: process.env.KAFKA_USER,
      password: process.env.KAFKA_PASSWORD,
    },
  });
  producerReady.set(0);
  // idempotent : un retry reseau ne duplique pas l'evenement dans la partition.
  producer = kafka.producer({ idempotent: true, maxInFlightRequests: 1 });
  producer.on(producer.events.CONNECT, () => { ready = true; producerReady.set(1); });
  producer.on(producer.events.DISCONNECT, () => { ready = false; producerReady.set(0); });
  try {
    await producer.connect();
  } catch (err) {
    console.error('Kafka: connexion impossible, on reessaie en tache de fond:', err.message);
    setTimeout(start, 15000);
  }
}

// La cle est l'id de la creature : tous ses evenements tombent dans la meme
// partition, donc restent ordonnes (born -> fed -> died -> revived).
function publish(type, creature, source = 'api') {
  if (!producer) return;
  const evt = {
    id: `${creature.id}-${Date.now()}`,
    type,
    source,
    ts: Date.now(),
    creature: { id: creature.id, name: creature.name, type: creature.type },
  };
  if (!ready) {
    failedTotal.inc({ type });
    return;
  }
  producer
    .send({
      topic: TOPIC,
      acks: -1,
      compression: CompressionTypes.GZIP,
      messages: [{ key: creature.id, value: JSON.stringify(evt) }],
    })
    .then(() => publishedTotal.inc({ type }))
    .catch((err) => {
      failedTotal.inc({ type });
      console.error(`Kafka: echec de publication ${type}:`, err.message);
    });
}

module.exports = { start, publish, metrics: [publishedTotal, failedTotal, producerReady] };
