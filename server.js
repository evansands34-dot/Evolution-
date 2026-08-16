// server.js - Express backend with SQLite users, optional Redis caching, Evo AI, caching and rate limiting
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { init: initDb, createUser, findUserByName, getUserById } = require('./db');
let dbInstance = null;

const IORedis = (() => { try { return require('ioredis'); } catch (e) { return null } })();
let redisClient = null;

const EVO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for LLM
const EVO_FALLBACK_TTL = 60 * 1000; // 1 minute for fallback

const SQLITE_FALLBACK_USERS = path.join(__dirname,'users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
const REDIS_URL = process.env.REDIS_URL || null;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Basic rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each key to 30 requests per windowMs
  keyGenerator: (req) => {
    try {
      const auth = req.headers.authorization || '';
      const m = auth.match(/^Bearer (.+)$/);
      if(m){
        try{
          const decoded = jwt.decode(m[1]); // not verifying here, just extracting id for rate-limiting key
          if(decoded && decoded.id) return `user:${decoded.id}`;
        }catch(e){}
      }
    } catch(e){}
    // fallback to IP
    return req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', apiLimiter);

// in-memory cache as fallback if Redis not configured
const localCache = new Map();
function cacheSet(key, value, ttlMs=EVO_CACHE_TTL){
  if(redisClient){
    return redisClient.set(key, JSON.stringify({v:value}), 'PX', ttlMs).catch(()=>{});
  }
  const expires = Date.now() + ttlMs;
  localCache.set(key, { value, expires });
}
function cacheGet(key){
  if(redisClient){
    return redisClient.get(key).then(res=>{ if(!res) return null; try{const parsed=JSON.parse(res); return parsed.v;}catch(e){return null}}).catch(()=>null);
  }
  const r = localCache.get(key);
  if(!r) return null;
  if(Date.now() > r.expires){ localCache.delete(key); return null; }
  return r.value;
}

// Initialize DB and optional Redis
(async ()=>{
  try{
    dbInstance = await initDb();
    console.log('SQLite DB initialized at', process.env.SQLITE_DB_PATH || path.join(__dirname,'data.sqlite'));
  }catch(e){
    console.warn('SQLite init failed, falling back to file-based users.json', e);
    dbInstance = null;
  }

  if(REDIS_URL && IORedis){
    try{
      redisClient = new IORedis(REDIS_URL);
      redisClient.on('error', (err)=> console.warn('Redis error', err));
      console.log('Connected to Redis');
    }catch(e){
      console.warn('Redis connection failed, using in-memory cache', e);
      redisClient = null;
    }
  }
})();

// helpers for users (DB first, fallback to file)
async function findUser(firstName, lastName){
  if(dbInstance){
    return await findUserByName(dbInstance, firstName, lastName);
  }
  try{const users = await fs.readJson(SQLITE_FALLBACK_USERS);return users.find(u=>u.firstName.toLowerCase()===firstName.toLowerCase()&&u.lastName.toLowerCase()===lastName.toLowerCase())}catch(e){return null}
}

async function persistUser(user){
  if(dbInstance){
    await createUser(dbInstance, user);return;
  }
  try{let users = await fs.readJson(SQLITE_FALLBACK_USERS);users.push(user);await fs.writeJson(SQLITE_FALLBACK_USERS, users, {spaces:2});}catch(e){await fs.writeJson(SQLITE_FALLBACK_USERS, [user], {spaces:2})}
}

async function getUserByIdFn(id){
  if(dbInstance){return await getUserById(dbInstance, id)}
  try{const users = await fs.readJson(SQLITE_FALLBACK_USERS);return users.find(u=>u.id===id)}catch(e){return null}
}

function makeToken(user){return jwt.sign({id:user.id},JWT_SECRET,{expiresIn:'30d'})}
async function getUserFromToken(token){try{const decoded = jwt.verify(token,JWT_SECRET);return await getUserByIdFn(decoded.id)}catch(e){return null}}

// health endpoint
app.get('/health', (req, res)=>{
  res.json({status:'ok', uptime: process.uptime(), openai: !!OPENAI_KEY, redis: !!redisClient});
});

app.post('/api/register',async(req,res)=>{
  const {firstName,lastName,password} = req.body||{};
  if(!firstName||!lastName||!password) return res.status(400).json({error:'Missing fields'});
  const existing = await findUser(firstName, lastName);
  if(existing) return res.status(400).json({error:'Account already exists'});
  const hash = await bcrypt.hash(password,10);
  const id = Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const user = {id,firstName,lastName,passwordHash:hash,createdAt:new Date().toISOString()};
  await persistUser(user);
  const token = makeToken(user);
  res.json({token,firstName:user.firstName,lastName:user.lastName});
});

app.post('/api/login',async(req,res)=>{
  const {firstName,lastName,password} = req.body||{};
  if(!firstName||!lastName||!password) return res.status(400).json({error:'Missing fields'});
  const u = await findUser(firstName, lastName);
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

// Evo AI endpoint
app.post('/api/evoai', async (req, res) => {
  try {
    const { query, productId } = req.body || {};
    if(!query) return res.status(400).json({ error: 'Missing query' });

    const cacheKey = `evoai::${query}::${productId||''}`;
    const cached = await cacheGet(cacheKey);
    if(cached){ return res.json({ answer: cached, cached: true }); }

    // load products from local file
    let products = [];
    try{
      const prodFile = path.join(__dirname,'products.js');
      if(await fs.pathExists(prodFile)){
        const txt = await fs.readFile(prodFile,'utf8');
        const m = txt.match(/window\.products\s*=\s*(\[[\s\S]*?\]);/);
        if(m){
          const arrText = m[1];
          const jsonText = arrText.replace(/(\\w+):/g,'"$1":').replace(/'([^']*)'/g,'"$1"');
          products = JSON.parse(jsonText);
        }
      }
    }catch(e){console.warn('Could not load products for evoai fallback',e)}

    const context = productId ? products.find(p=>p.id===Number(productId)) : null;

    if(OPENAI_KEY){
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
      await cacheSet(cacheKey, answer, EVO_CACHE_TTL);
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
    await cacheSet(cacheKey, answer, EVO_FALLBACK_TTL);
    res.json({answer});
  } catch (err) {
    console.error('EvoAI error',err);
    res.status(500).json({error:'Internal error'});
  }
});

// static files (serve client)
app.use('/', express.static(path.join(__dirname)));

app.listen(PORT,()=>console.log('Server started on',PORT));
