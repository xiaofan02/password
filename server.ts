import express from 'express';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import path from 'path';

const app = express();
const db = new sqlite3.Database('vault.db');
const JWT_SECRET = 'your-super-secret-key'; // Change this!

app.use(cors());
app.use(express.json());

// Initialize DB
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY, site TEXT, username TEXT, password TEXT, notes TEXT, category TEXT, visibility TEXT, owner_id INTEGER)");
});

// Auth
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const hash = bcrypt.hashSync(password, 8);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
    if (err) return res.status(400).json({ error: 'User exists' });
    res.json({ message: 'User created' });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user: any) => {
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token });
  });
});

// Passwords
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

app.get('/api/passwords', authenticate, (req: any, res) => {
  db.all("SELECT * FROM passwords WHERE visibility = 'shared' OR owner_id = ?", [req.userId], (err, rows) => {
    res.json(rows);
  });
});

app.post('/api/passwords', authenticate, (req: any, res) => {
  const { site, username, password, notes, category, visibility } = req.body;
  db.run("INSERT INTO passwords (site, username, password, notes, category, visibility, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [site, username, password, notes, category, visibility, req.userId], (err) => {
      res.json({ message: 'Added' });
    });
});

app.delete('/api/passwords/:id', authenticate, (req: any, res) => {
  db.run("DELETE FROM passwords WHERE id = ? AND owner_id = ?", [req.params.id, req.userId], (err) => {
    res.json({ message: 'Deleted' });
  });
});

// Serve static files
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));

app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
