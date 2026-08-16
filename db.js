// db.js - simple SQLite helper for users table
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const DB_FILE = process.env.SQLITE_DB_PATH || path.join(__dirname, 'data.sqlite');

async function init() {
  // ensure directory exists
  try { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); } catch (e) {}
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  return db;
}

async function createUser(db, user) {
  const { id, firstName, lastName, passwordHash, createdAt } = user;
  await db.run('INSERT INTO users (id, firstName, lastName, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)', [id, firstName, lastName, passwordHash, createdAt]);
}

async function findUserByName(db, firstName, lastName) {
  return await db.get('SELECT * FROM users WHERE lower(firstName)=lower(?) AND lower(lastName)=lower(?)', [firstName, lastName]);
}

async function getUserById(db, id) {
  return await db.get('SELECT * FROM users WHERE id = ?', [id]);
}

module.exports = { init, createUser, findUserByName, getUserById };
