import pg from 'pg';
import { hashPassword } from './auth.js';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'baker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'Pastry',
  pic TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT true,
  base_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  base_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '19:00',
  available BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  branch_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  when_text TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  subtotal INTEGER NOT NULL,
  fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL
);
`;

// name, description, price, category, pic, base_rating, base_count
const PRODUCTS = [
  ['Chocolate Cake', 'A cake that has a chocolate flavor in it', 400, 'Pastry', '/images/ChocolateCake.jpg', 4.5, 20],
  ['Ensaymada', 'A filipino bread with sugar and butter as its flavor', 25, 'Pastry', '/images/Ensaymada.jpg', 4.2, 35],
  ['Pandesal', 'A filipino popular breakfast, best when dipped in coffee', 5, 'Pastry', '/images/Pandesal.jpg', 4.8, 50],
  ['Coke', 'A very satisfying drink for your craves', 25, 'Beverage', '/images/Coke.jpg', 4.0, 15],
];

// name, address, phone, lat, lng, open, close, available
const BRANCHES = [
  ['Dreamy Bites - Santa Cruz', 'Santa Cruz, Laguna', '0917 000 0001', 14.2813, 121.4164, '08:00', '19:00', true],
  ['Dreamy Bites - Calamba', 'Calamba, Laguna', '0917 000 0002', 14.2117, 121.1653, '07:00', '20:00', true],
  ['Dreamy Bites - Santa Rosa', 'Santa Rosa, Laguna', '0917 000 0003', 14.3122, 121.1114, '09:00', '18:00', false],
];

export async function initDb() {
  await query(SCHEMA);

  // baker account comes from .env (only created if it doesn't exist yet)
  const { BAKER_EMAIL, BAKER_PASSWORD } = process.env;
  if (BAKER_EMAIL && BAKER_PASSWORD) {
    await query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'baker')
       ON CONFLICT (email) DO NOTHING`,
      [BAKER_EMAIL.trim().toLowerCase(), await hashPassword(BAKER_PASSWORD)]
    );
  }

  const products = await query('SELECT COUNT(*)::int AS n FROM products');
  if (products.rows[0].n === 0) {
    for (const p of PRODUCTS) {
      await query(
        `INSERT INTO products (name, description, price, category, pic, base_rating, base_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        p
      );
    }
  }

  const branches = await query('SELECT COUNT(*)::int AS n FROM branches');
  if (branches.rows[0].n === 0) {
    for (const b of BRANCHES) {
      await query(
        `INSERT INTO branches (name, address, phone, lat, lng, open_time, close_time, available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        b
      );
    }
  }
}