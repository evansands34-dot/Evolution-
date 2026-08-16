// server.js - Express backend with file-based users storage, Evo AI, caching and rate limiting
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');

const USERS_FILE = path.join(__dirname,'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Basic rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', apiLimiter);

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

// Simple in-memory cache for evoai responses
const evoCache = new Map();
function cacheSet(key, value, ttlMs=5*60*1000){
  const expires = Date.now() + ttlMs;
  evoCache.set(key, { value, expires });
}
function cacheGet(key){
  const r = evoCache.get(key);
  if(!r) return null;
  if(Date.now() > r.expires){ evoCache.delete(key); return null; }
  return r.value;
}

// Evo AI endpoint: uses OpenAI if OPENAI_API_KEY is set, otherwise fallback to local product data
app.post('/api/evoai', async (req, res) => {
  try {
    const { query, productId } = req.body || {};
    if(!query) return res.status(400).json({ error: 'Missing query' });

    const cacheKey = `evoai::${query}::${productId||''}`;
    const cached = cacheGet(cacheKey);
    if(cached){ return res.json({ answer: cached, cached: true }); }

    // load products from local file (products.js is client-side; we'll attempt to parse it)
    let products = [];
    try{
      const prodFile = path.join(__dirname,'products.js');
      if(await fs.pathExists(prodFile)){
        const txt = await fs.readFile(prodFile,'utf8');
        const m = txt.match(/window\.products\s*=\s*(\[[\s\S]*?\]);/);
        if(m){
          const arrText = m[1];
          // convert simple JS object literal to JSON-ish string
          const jsonText = arrText.replace(/(\w+):/g,'"$1":').replace(/'([^']*)'/g,'"$1"');
          products = JSON.parse(jsonText);
        }
      }
    }catch(e){console.warn('Could not load products for evoai fallback',e)}

    const context = productId ? products.find(p=>p.id===Number(productId)) : null;

    if(OPENAI_KEY){
      // call OpenAI Chat Completions
      const messages = [];
      messages.push({role:'system',content:'You are Evo AI, a helpful shopping assistant for the Evolution store. Keep answers concise, include product suggestions where relevant, and when a product context is provided, use the product details to answer.'});
      if(context){
        messages.push({role:'system',content:`Context product: name=${context.name}, description=${context.description}, price=${context.price}, category=${context.category}`});
      }
      messages.push({role:'user',content:query});

      const payload = {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 400,
        temperature: 0.2
      };

      const resp = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+OPENAI_KEY},
        body: JSON.stringify(payload)
      });
      if(!resp.ok){
        const txt = await resp.text();
        console.error('OpenAI error',resp.status,txt);
        return res.status(502).json({error:'OpenAI error', detail:txt});
      }
      const data = await resp.json();
      const answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : 'No answer';
      cacheSet(cacheKey, answer, 5*60*1000); // cache 5 minutes
      return res.json({answer});
    }

    // fallback rule-based response using local products
    let answer='I could not find additional information.';
    if(context){
      answer = `Product: ${context.name}\nDescription: ${context.description}\nPrice: $${context.price.toFixed(2)}\nIf you'd like, you can view the item here: /product.html?id=${context.id}`;
    } else {
      const q = (query||'').toLowerCase();
      const match = products.find(p=>p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      if(match){
        answer = `I found this product: ${match.name} - ${match.description} - $${match.price.toFixed(2)}. View: /product.html?id=${match.id}`;
      } else {
        answer = `I couldn't find a direct product match for "${query}". Try searching for broader categories like 'shoes', 'hoodies', or specific item names. You can also visit the shop page: /shop.html`;
      }
    }
    cacheSet(cacheKey, answer, 60*1000); // cache fallback responses 1 minute
    res.json({answer});
  } catch (err) {
    console.error('EvoAI error',err);
    res.status(500).json({error:'Internal error'});
  }
});

// static files (serve client) if run from project root
app.use('/', express.static(path.join(__dirname)));

app.listen(PORT,()=>console.log('Server started on',PORT));
