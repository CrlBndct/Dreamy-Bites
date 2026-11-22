import http from 'node:http';
import { pool, query, initDb } from './db.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js';

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim());

const DELIVERY_FEE = 50;
const FREE_DELIVERY_OVER = 500;
const ORDER_TYPES = ['Pickup', 'Delivery', 'Dine-in'];
const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ======================= tiny framework ======================= */

const routes = [];

// auth: null (public) | 'user' (any logged-in user) | 'baker'
function route(method, path, auth, handler) {
  const keys = [];
  const pattern = path.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ method, regex: new RegExp(`^${pattern}/?$`), keys, auth, handler });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) tooLarge = true;
      else chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new HttpError(413, 'Request too large.'));
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new HttpError(400, 'Invalid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

const idParam = (ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new HttpError(400, 'Invalid id.');
  return id;
};

const server = http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    let matched = null;
    let pathExists = false;
    const params = {};

    for (const r of routes) {
      const m = url.pathname.match(r.regex);
      if (!m) continue;
      pathExists = true;
      if (r.method !== req.method) continue;
      matched = r;
      r.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1])));
      break;
    }
    if (!matched) {
      throw new HttpError(pathExists ? 405 : 404, pathExists ? 'Method not allowed.' : 'Not found.');
    }

    const ctx = { req, url, params, status: 200, user: null, body: {} };

    if (matched.auth) {
      const header = req.headers.authorization || '';
      const payload = header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
      if (!payload) throw new HttpError(401, 'Please log in.');
      if (matched.auth === 'baker' && payload.role !== 'baker') {
        throw new HttpError(403, 'Baker access only.');
      }
      ctx.user = payload;
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) ctx.body = await readBody(req);

    const data = await matched.handler(ctx);
    send(res, ctx.status, data ?? { ok: true });
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: 'Something went wrong on the server.' });
  }
});

/* ======================= helpers ======================= */

const session = (u) => ({
  token: signToken({ id: u.id, email: u.email, role: u.role }),
  user: { id: u.id, email: u.email, role: u.role },
});

const cleanEmail = (value) => {
  const email = String(value ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Enter a valid email.');
  return email;
};

const productOut = (r) => ({
  foodId: r.id,
  foodName: r.name,
  foodDes: r.description,
  price: r.price,
  category: r.category,
  pic: r.pic,
  available: r.available,
  rating: Math.round(r.rating * 100) / 100,
  ratingCount: r.rating_count,
});

const branchOut = (r) => ({
  id: r.id,
  name: r.name,
  address: r.address,
  phone: r.phone,
  lat: r.lat,
  lng: r.lng,
  open: r.open_time,
  close: r.close_time,
  available: r.available,
});

// builds "col = $1, col2 = $2" from a fixed whitelist (never from user input)
function buildUpdate(fields, body) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(fields)) {
    if (key in body) {
      values.push(body[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (!sets.length) throw new HttpError(400, 'Nothing to update.');
  return { sets: sets.join(', '), values };
}

/* ======================= auth ======================= */

route('POST', '/api/register', null, async (ctx) => {
  const email = cleanEmail(ctx.body.email);
  const password = String(ctx.body.password ?? '');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');

  const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount) throw new HttpError(409, 'That email is already registered.');

  const { rows } = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
    [email, await hashPassword(password)]
  );
  ctx.status = 201;
  return session(rows[0]);
});

route('POST', '/api/login', null, async (ctx) => {
  const email = String(ctx.body.email ?? '').trim().toLowerCase();
  const password = String(ctx.body.password ?? '');

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  return session(user);
});

route('GET', '/api/me', 'user', (ctx) => ({
  id: ctx.user.id,
  email: ctx.user.email,
  role: ctx.user.role,
}));

/* ======================= products ======================= */

const PRODUCT_FIELDS = {
  foodName: 'name',
  foodDes: 'description',
  price: 'price',
  category: 'category',
  pic: 'pic',
  available: 'available',
};

function checkProduct(b, requireAll) {
  if (requireAll || 'foodName' in b) {
    if (!String(b.foodName ?? '').trim()) throw new HttpError(400, 'Name is required.');
  }
  if (requireAll || 'price' in b) {
    const price = Number(b.price);
    if (!Number.isInteger(price) || price < 0) {
      throw new HttpError(400, 'Price must be a whole number.');
    }
  }
}

route('GET', '/api/products', null, async () => {
  const { rows } = await query(`
    SELECT p.id, p.name, p.description, p.price, p.category, p.pic, p.available,
      CASE WHEN p.base_count + COUNT(r.stars) = 0 THEN 0
           ELSE (p.base_rating * p.base_count + COALESCE(SUM(r.stars), 0))
                / (p.base_count + COUNT(r.stars)) END AS rating,
      (p.base_count + COUNT(r.stars))::int AS rating_count
    FROM products p
    LEFT JOIN ratings r ON r.product_id = p.id
    GROUP BY p.id
    ORDER BY p.id
  `);
  return rows.map(productOut);
});

route('POST', '/api/products', 'baker', async (ctx) => {
  const b = ctx.body;
  checkProduct(b, true);
  const { rows } = await query(
    `INSERT INTO products (name, description, price, category, pic)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [String(b.foodName).trim(), String(b.foodDes ?? ''), Number(b.price), b.category || 'Pastry', String(b.pic ?? '')]
  );
  ctx.status = 201;
  return { foodId: rows[0].id };
});

route('PUT', '/api/products/:id', 'baker', async (ctx) => {
  const id = idParam(ctx);
  checkProduct(ctx.body, false);
  const { sets, values } = buildUpdate(PRODUCT_FIELDS, ctx.body);
  values.push(id);
  const result = await query(`UPDATE products SET ${sets} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, 'Product not found.');
});

route('DELETE', '/api/products/:id', 'baker', async (ctx) => {
  const result = await query('DELETE FROM products WHERE id = $1', [idParam(ctx)]);
  if (!result.rowCount) throw new HttpError(404, 'Product not found.');
});

/* ======================= ratings ======================= */

route('POST', '/api/products/:id/rating', 'user', async (ctx) => {
  const id = idParam(ctx);
  const stars = Number(ctx.body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new HttpError(400, 'Rating must be 1 to 5.');
  }
  const exists = await query('SELECT 1 FROM products WHERE id = $1', [id]);
  if (!exists.rowCount) throw new HttpError(404, 'Product not found.');

  await query(
    `INSERT INTO ratings (user_id, product_id, stars) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET stars = EXCLUDED.stars`,
    [ctx.user.id, id, stars]
  );
});

route('GET', '/api/ratings/mine', 'user', async (ctx) => {
  const { rows } = await query('SELECT product_id, stars FROM ratings WHERE user_id = $1', [ctx.user.id]);
  return Object.fromEntries(rows.map((r) => [r.product_id, r.stars]));
});

/* ======================= branches ======================= */

const BRANCH_FIELDS = {
  name: 'name',
  address: 'address',
  phone: 'phone',
  lat: 'lat',
  lng: 'lng',
  open: 'open_time',
  close: 'close_time',
  available: 'available',
};

function checkBranch(b, requireAll) {
  if (requireAll || 'name' in b) {
    if (!String(b.name ?? '').trim()) throw new HttpError(400, 'Branch name is required.');
  }
  for (const key of ['lat', 'lng']) {
    if (requireAll || key in b) {
      if (b[key] === '' || b[key] === null || !Number.isFinite(Number(b[key]))) {
        throw new HttpError(400, 'Latitude and longitude must be numbers.');
      }
    }
  }
  for (const key of ['open', 'close']) {
    if ((requireAll || key in b) && !/^\d{2}:\d{2}$/.test(String(b[key] ?? ''))) {
      throw new HttpError(400, 'Hours must look like 08:00.');
    }
  }
}

route('GET', '/api/branches', null, async () => {
  const { rows } = await query('SELECT * FROM branches ORDER BY id');
  return rows.map(branchOut);
});

route('POST', '/api/branches', 'baker', async (ctx) => {
  const b = ctx.body;
  checkBranch(b, true);
  const { rows } = await query(
    `INSERT INTO branches (name, address, phone, lat, lng, open_time, close_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [String(b.name).trim(), String(b.address ?? ''), String(b.phone ?? ''), Number(b.lat), Number(b.lng), b.open, b.close]
  );
  ctx.status = 201;
  return { id: rows[0].id };
});

route('PUT', '/api/branches/:id', 'baker', async (ctx) => {
  const id = idParam(ctx);
  checkBranch(ctx.body, false);
  const body = { ...ctx.body };
  if ('lat' in body) body.lat = Number(body.lat);
  if ('lng' in body) body.lng = Number(body.lng);
  const { sets, values } = buildUpdate(BRANCH_FIELDS, body);
  values.push(id);
  const result = await query(`UPDATE branches SET ${sets} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, 'Branch not found.');
});

route('DELETE', '/api/branches/:id', 'baker', async (ctx) => {
  const result = await query('DELETE FROM branches WHERE id = $1', [idParam(ctx)]);
  if (!result.rowCount) throw new HttpError(404, 'Branch not found.');
});

/* ======================= orders ======================= */

route('GET', '/api/orders', 'user', async (ctx) => {
  const isBaker = ctx.user.role === 'baker';
  const { rows } = await query(
    `SELECT * FROM orders ${isBaker ? '' : 'WHERE user_id = $1'} ORDER BY created_at DESC`,
    isBaker ? [] : [ctx.user.id]
  );

  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? (await query(
        'SELECT order_id, name, qty, price FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id',
        [ids]
      )).rows
    : [];

  return rows.map((o) => ({
    id: o.id,
    customer: o.customer,
    name: o.name,
    phone: o.phone,
    type: o.type,
    branchName: o.branch_name,
    address: o.address,
    when: o.when_text,
    payment: o.payment,
    notes: o.notes,
    subtotal: o.subtotal,
    fee: o.fee,
    total: o.total,
    status: o.status,
    createdAt: o.created_at,
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
  }));
});

route('POST', '/api/orders', 'user', async (ctx) => {
  const b = ctx.body;

  if (!ORDER_TYPES.includes(b.type)) throw new HttpError(400, 'Choose pickup, delivery or dine-in.');
  if (!String(b.name ?? '').trim() || !String(b.phone ?? '').trim()) {
    throw new HttpError(400, 'Name and phone are required.');
  }
  const isDelivery = b.type === 'Delivery';
  if (isDelivery && !String(b.address ?? '').trim()) throw new HttpError(400, 'Delivery address is required.');
  if (!isDelivery && !String(b.branchName ?? '').trim()) throw new HttpError(400, 'Please choose a branch.');

  const wanted = Array.isArray(b.items) ? b.items : [];
  if (!wanted.length) throw new HttpError(400, 'Your basket is empty.');

  // prices come from the database, never from the browser
  const ids = wanted.map((i) => Number(i.foodId)).filter(Number.isInteger);
  const { rows } = await query(
    'SELECT id, name, price, available FROM products WHERE id = ANY($1::int[])',
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  let subtotal = 0;
  const lines = [];
  for (const item of wanted) {
    const product = byId.get(Number(item.foodId));
    const qty = Math.floor(Number(item.quantity));
    if (!product) throw new HttpError(400, 'A product in your basket no longer exists.');
    if (!product.available) throw new HttpError(400, `${product.name} is sold out.`);
    if (!(qty >= 1 && qty <= 99)) throw new HttpError(400, 'Invalid quantity.');
    subtotal += product.price * qty;
    lines.push({ name: product.name, qty, price: product.price });
  }

  const fee = isDelivery && subtotal < FREE_DELIVERY_OVER ? DELIVERY_FEE : 0;
  const total = subtotal + fee;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = await client.query(
      `INSERT INTO orders
        (user_id, customer, name, phone, type, branch_name, address, when_text,
         payment, notes, subtotal, fee, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        ctx.user.id, ctx.user.email, String(b.name).trim(), String(b.phone).trim(), b.type,
        isDelivery ? '' : String(b.branchName), isDelivery ? String(b.address).trim() : '',
        String(b.when ?? ''), String(b.payment ?? ''), String(b.notes ?? ''),
        subtotal, fee, total,
      ]
    );
    for (const l of lines) {
      await client.query(
        'INSERT INTO order_items (order_id, name, qty, price) VALUES ($1, $2, $3, $4)',
        [order.rows[0].id, l.name, l.qty, l.price]
      );
    }
    await client.query('COMMIT');
    ctx.status = 201;
    return { id: order.rows[0].id, total };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

route('PATCH', '/api/orders/:id', 'baker', async (ctx) => {
  const id = idParam(ctx);
  if (!STATUSES.includes(ctx.body.status)) throw new HttpError(400, 'Invalid status.');
  const result = await query('UPDATE orders SET status = $1 WHERE id = $2', [ctx.body.status, id]);
  if (!result.rowCount) throw new HttpError(404, 'Order not found.');
});

route('DELETE', '/api/orders/:id', 'baker', async (ctx) => {
  const result = await query('DELETE FROM orders WHERE id = $1', [idParam(ctx)]);
  if (!result.rowCount) throw new HttpError(404, 'Order not found.');
});

/* ======================= start ======================= */

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('Missing DATABASE_URL or JWT_SECRET. Check server/.env');
  process.exit(1);
}

try {
  await initDb();
} catch (err) {
  console.error('Could not connect to PostgreSQL. Is it running, and is DATABASE_URL correct?');
  console.error(err.message);
  process.exit(1);
}

server.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));