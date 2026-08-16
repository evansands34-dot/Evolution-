// server.js - simple Express backend with file-based users storage
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const USERS_FILE = path.join(__dirname,'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ensure users file
async function readUsers(){
  try{const exists = await fs.pathExists(USERS_FILE); if(!exists){await fs.writeJson(USERS_FILE,[])}
    return await fs.readJson(USERS_FILE)}catch(e){console.error(e);return []}
}
async function writeUsers(users){await fs.writeJson(USERS_FILE,users,{spaces:2})}

function makeToken(user){return jwt.sign({id:user.id},JWT_SECRET,{expiresIn:'30d'})}
async function getUserFromToken(token){try{const decoded = jwt.verify(token,JWT_SECRET);const users = await readUsers();return users.find(u=>u.id===decoded.id)}catch(e){return null}}

app.post('/api/register',async(req,res)=>{
  const {firstName,lastName,password} = req.body||{};
  if(!firstName||!lastName||!password) return res.status(400).json({error:'Missing fields'});
  const users = await readUsers();
  // login by first+last (simple)
  const existing = users.find(u=>u.firstName.toLowerCase()===firstName.toLowerCase()&&u.lastName.toLowerCase()===lastName.toLowerCase());
  if(existing) return res.status(400).json({error:'Account already exists'});
  const hash = await bcrypt.hash(password,10);
  const id = Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const user = {id,firstName,lastName,passwordHash:hash,createdAt:new Date().toISOString()};
  users.push(user);
  await writeUsers(users);
  const token = makeToken(user);
  res.json({token,firstName:user.firstName,lastName:user.lastName});
});

app.post('/api/login',async(req,res)=>{
  const {firstName,lastName,password} = req.body||{};
  if(!firstName||!lastName||!password) return res.status(400).json({error:'Missing fields'});
  const users = await readUsers();
  const u = users.find(x=>x.firstName.toLowerCase()===firstName.toLowerCase()&&x.lastName.toLowerCase()===lastName.toLowerCase());
  if(!u) return res.status(400).json({error:'Account not found'});
  const ok = await bcrypt.compare(password,u.passwordHash);
  if(!ok) return res.status(400).json({error:'Invalid password'});
  const token = makeToken(u);
  res.json({token,firstName:u.firstName,lastName:u.lastName});
});

app.get('/api/me',async(req,res)=>{
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer (.+)$/);
  if(!m) return res.status(401).json({error:'No token'});
  const user = await getUserFromToken(m[1]);
  if(!user) return res.status(401).json({error:'Invalid token'});
  res.json({id:user.id,firstName:user.firstName,lastName:user.lastName});
});

// static files (serve client) if run from project root
app.use('/', express.static(path.join(__dirname)));

app.listen(PORT,()=>console.log('Server started on',PORT));
