const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const client = require('prom-client');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// Prometheus Metrics Setup
// ============================================================================
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom Tamagotchi metrics
const hungerGauge = new client.Gauge({
  name: 'tamagotchi_hunger_level',
  help: 'Current hunger level of each creature (0=full, 100=starving)',
  labelNames: ['creature_id', 'creature_name', 'creature_type'],
  registers: [register],
});

const happinessGauge = new client.Gauge({
  name: 'tamagotchi_happiness_score',
  help: 'Current happiness score of each creature (0=miserable, 100=ecstatic)',
  labelNames: ['creature_id', 'creature_name', 'creature_type'],
  registers: [register],
});

const energyGauge = new client.Gauge({
  name: 'tamagotchi_energy_level',
  help: 'Current energy level of each creature (0=exhausted, 100=hyperactive)',
  labelNames: ['creature_id', 'creature_name', 'creature_type'],
  registers: [register],
});

const aliveGauge = new client.Gauge({
  name: 'tamagotchi_creatures_alive_total',
  help: 'Total number of creatures currently alive',
  registers: [register],
});

const deadGauge = new client.Gauge({
  name: 'tamagotchi_creatures_dead_total',
  help: 'Total number of creatures that have died',
  registers: [register],
});

const feedCounter = new client.Counter({
  name: 'tamagotchi_feed_actions_total',
  help: 'Total number of feed actions performed',
  labelNames: ['creature_type'],
  registers: [register],
});

const playCounter = new client.Counter({
  name: 'tamagotchi_play_actions_total',
  help: 'Total number of play actions performed',
  labelNames: ['creature_type'],
  registers: [register],
});

const sleepCounter = new client.Counter({
  name: 'tamagotchi_sleep_actions_total',
  help: 'Total number of sleep actions performed',
  labelNames: ['creature_type'],
  registers: [register],
});

const killCounter = new client.Counter({
  name: 'tamagotchi_kill_actions_total',
  help: 'Total number of creatures deliberately killed (Chaos Button)',
  labelNames: ['creature_type'],
  registers: [register],
});

const deleteCounter = new client.Counter({
  name: 'tamagotchi_delete_actions_total',
  help: 'Total number of creatures permanently deleted and reseeded (Chaos Button)',
  labelNames: ['creature_type'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'tamagotchi_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'tamagotchi_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

// ============================================================================
// Database Setup
// ============================================================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tamagotchi',
  user: process.env.DB_USER || 'tamagotchi',
  password: process.env.DB_PASSWORD || '<YOUR_DB_PASSWORD>',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS creatures (
        id UUID PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'egg',
        hunger FLOAT NOT NULL DEFAULT 50,
        happiness FLOAT NOT NULL DEFAULT 70,
        energy FLOAT NOT NULL DEFAULT 80,
        is_alive BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        last_interaction TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Seed some default creatures if table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM creatures');
    if (parseInt(rows[0].count) === 0) {
      const seedCreatures = [
        { name: 'Pixel', type: 'dragon' },
        { name: 'Nimbus', type: 'cat' },
        { name: 'Sprocket', type: 'robot' },
        { name: 'Blossom', type: 'plant' },
        { name: 'Byte', type: 'alien' },
      ];
      for (const c of seedCreatures) {
        await client.query(
          'INSERT INTO creatures (id, name, type, hunger, happiness, energy) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), c.name, c.type, 30 + Math.random() * 40, 50 + Math.random() * 40, 60 + Math.random() * 30]
        );
      }
      console.log('🐣 Seeded 5 default creatures');
    }
  } finally {
    client.release();
  }
}

// ============================================================================
// Creature Decay Loop — Stats decrease over time!
// ============================================================================
const DECAY_INTERVAL_MS = parseInt(process.env.DECAY_INTERVAL_MS || '15000'); // every 15 seconds
const HUNGER_DECAY = parseFloat(process.env.HUNGER_DECAY || '2');   // hunger increases by 2
const HAPPINESS_DECAY = parseFloat(process.env.HAPPINESS_DECAY || '1.5'); // happiness decreases by 1.5
const ENERGY_DECAY = parseFloat(process.env.ENERGY_DECAY || '1');   // energy decreases by 1

setInterval(async () => {
  try {
    const client = await pool.connect();
    try {
      // Increase hunger, decrease happiness and energy for alive creatures
      await client.query(`
        UPDATE creatures
        SET
          hunger = LEAST(100, hunger + $1),
          happiness = GREATEST(0, happiness - $2),
          energy = GREATEST(0, energy - $3),
          is_alive = CASE
            WHEN hunger >= 100 AND happiness <= 0 THEN false
            ELSE is_alive
          END
        WHERE is_alive = true
      `, [HUNGER_DECAY, HAPPINESS_DECAY, ENERGY_DECAY]);

      // Update Prometheus metrics
      const { rows } = await client.query('SELECT * FROM creatures');
      let alive = 0, dead = 0;
      for (const c of rows) {
        const labels = { creature_id: c.id, creature_name: c.name, creature_type: c.type };
        hungerGauge.set(labels, c.hunger);
        happinessGauge.set(labels, c.happiness);
        energyGauge.set(labels, c.energy);
        if (c.is_alive) alive++; else dead++;
      }
      aliveGauge.set(alive);
      deadGauge.set(dead);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Decay loop error:', err.message);
  }
}, DECAY_INTERVAL_MS);

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// GET /creatures — List all creatures
app.get('/api/creatures', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /creatures/:id — Get a specific creature
app.get('/api/creatures/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures — Adopt a new creature
app.post('/api/creatures', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    const allowedTypes = ['dragon', 'cat', 'robot', 'plant', 'alien'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${allowedTypes.join(', ')}` });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO creatures (id, name, type) VALUES ($1, $2, $3)',
      [id, name, type]
    );
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/feed — Feed a creature
app.post('/api/creatures/:id/feed', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    if (!rows[0].is_alive) return res.status(400).json({ error: 'Cannot feed a dead creature 💀' });

    await pool.query(
      'UPDATE creatures SET hunger = GREATEST(0, hunger - 25), happiness = LEAST(100, happiness + 5), last_interaction = NOW() WHERE id = $1',
      [req.params.id]
    );
    feedCounter.inc({ creature_type: rows[0].type });
    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    res.json({ message: `${result.rows[0].name} has been fed! 🍖`, creature: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/play — Play with a creature
app.post('/api/creatures/:id/play', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    if (!rows[0].is_alive) return res.status(400).json({ error: 'Cannot play with a dead creature 💀' });

    await pool.query(
      'UPDATE creatures SET happiness = LEAST(100, happiness + 20), energy = GREATEST(0, energy - 10), hunger = LEAST(100, hunger + 5), last_interaction = NOW() WHERE id = $1',
      [req.params.id]
    );
    playCounter.inc({ creature_type: rows[0].type });
    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    res.json({ message: `${result.rows[0].name} had a great time! 🎮`, creature: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/sleep — Put a creature to sleep
app.post('/api/creatures/:id/sleep', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    if (!rows[0].is_alive) return res.status(400).json({ error: 'This creature is already in eternal sleep 💀' });

    await pool.query(
      'UPDATE creatures SET energy = LEAST(100, energy + 30), hunger = LEAST(100, hunger + 5), last_interaction = NOW() WHERE id = $1',
      [req.params.id]
    );
    sleepCounter.inc({ creature_type: rows[0].type });
    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    res.json({ message: `${result.rows[0].name} is well rested! 💤`, creature: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/revive — Revive a dead creature (admin only concept)
app.post('/api/creatures/:id/revive', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    if (rows[0].is_alive) return res.status(400).json({ error: 'This creature is already alive!' });

    await pool.query(
      'UPDATE creatures SET is_alive = true, hunger = 50, happiness = 50, energy = 50, last_interaction = NOW() WHERE id = $1',
      [req.params.id]
    );
    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    res.json({ message: `${result.rows[0].name} has been revived! ✨`, creature: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/kill — Poison a creature (Chaos Button "meteor" demo).
// Sets is_alive=false directly, the same state a creature reaches through
// natural decay — which is exactly what feeds tamagotchi_creatures_dead_total
// and therefore the real TamagotchiCreatureDied -> Alertmanager -> n8n
// revival chain. This is deliberately NOT a Kubernetes-level action: nothing
// here touches a pod, so the thing that heals it is the business-logic
// automation, not the ReplicaSet controller.
app.post('/api/creatures/:id/kill', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    if (!rows[0].is_alive) return res.status(400).json({ error: 'This creature is already dead 💀' });

    await pool.query(
      'UPDATE creatures SET is_alive = false, last_interaction = NOW() WHERE id = $1',
      [req.params.id]
    );
    killCounter.inc({ creature_type: rows[0].type });
    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    res.json({ message: `${result.rows[0].name} was hit by a meteor and poisoned ☄️💀`, creature: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /creatures/:id/delete — Permanently delete a creature (Chaos Button
// demo). Unlike /kill, this never touches tamagotchi_creatures_dead_total —
// the row is gone, not marked dead — so it does NOT trigger the Prometheus
// alert or n8n. That's intentional: it demonstrates a different resilience
// layer, the app defending its own roster instead of relying on external
// monitoring automation. A public, unauthenticated action that only ever
// shrinks the roster would eventually empty it, so a replacement hatches
// immediately.
app.post('/api/creatures/:id/delete', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM creatures WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Creature not found' });
    const deletedName = rows[0].name;
    deleteCounter.inc({ creature_type: rows[0].type });

    await pool.query('DELETE FROM creatures WHERE id = $1', [req.params.id]);

    const seedNames = ['Pixel', 'Nimbus', 'Sprocket', 'Blossom', 'Byte', 'Echo', 'Flux', 'Glitch'];
    const allowedTypes = ['dragon', 'cat', 'robot', 'plant', 'alien'];
    const newId = uuidv4();
    const newName = seedNames[Math.floor(Math.random() * seedNames.length)];
    const newType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    await pool.query('INSERT INTO creatures (id, name, type) VALUES ($1, $2, $3)', [newId, newName, newType]);

    const result = await pool.query('SELECT * FROM creatures WHERE id = $1', [newId]);
    res.json({
      message: `${deletedName} was deleted permanently. ${newName} the ${newType} hatched to take its place 🥚`,
      creature: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats — Global statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_alive = true) as alive_count,
        COUNT(*) FILTER (WHERE is_alive = false) as dead_count,
        -- FILTER ne s'applique qu'a un agregat : accroche a ROUND, qui n'en
        -- est pas un, PostgreSQL rejette toute la requete. Il doit porter sur
        -- AVG, et l'arrondi vient ensuite.
        ROUND(AVG(hunger) FILTER (WHERE is_alive = true)::numeric, 1) as avg_hunger,
        ROUND(AVG(happiness) FILTER (WHERE is_alive = true)::numeric, 1) as avg_happiness,
        ROUND(AVG(energy) FILTER (WHERE is_alive = true)::numeric, 1) as avg_energy,
        COUNT(*) FILTER (WHERE hunger > 80 AND is_alive = true) as starving_count,
        COUNT(*) FILTER (WHERE happiness < 20 AND is_alive = true) as sad_count
      FROM creatures
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Start Server
// ============================================================================
const PORT = parseInt(process.env.PORT || '8080');

initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🐣 Tamagotchi API running on port ${PORT}`);
      console.log(`📊 Metrics available at /metrics`);
      console.log(`⏱️  Decay interval: ${DECAY_INTERVAL_MS}ms`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
