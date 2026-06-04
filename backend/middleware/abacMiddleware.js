const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { evaluate } = require('../engine/policyEngine');

function loadUsers() {
  const filePath = path.join(__dirname, '../data/users.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function loadResources() {
  const filePath = path.join(__dirname, '../data/resources.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Odredjuje tip mreže na osnovu IP adrese
function getIpNetwork(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const cleanIp = ip.trim();
  console.log('IP adresa:', cleanIp);
  
  const corporateIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  const corporatePrefixes = ['192.168.', '10.0.'];
  
  const isCorporate = 
    corporateIPs.includes(cleanIp) || 
    corporatePrefixes.some(prefix => cleanIp.startsWith(prefix));
    
  console.log('Tip mreže:', isCorporate ? 'corporate' : 'external');
  return isCorporate ? 'corporate' : 'external';
}

function logDecision(user, resource, result) {
  const logPath = path.join(__dirname, '../logs/decisions.log');
  const entry = {
    timestamp: new Date().toISOString(),
    user: user.username,
    resource: resource.name,
    decision: result.decision,
    policy: result.policy || 'none',
    reason: result.reason || 'no matching policy',
    context: result.context
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
}

function abacMiddleware(req, res, next) {
  try {
    // 1. Izvuci JWT token iz headera
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token nije proslijeđen.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abac_diplomski_tajni_kljuc');

    // 2. Pronađi korisnika po ID-u iz tokena
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Korisnik nije pronađen.' });
    }

    // 3. Pronađi resurs po ID-u iz URL parametra
    const resourceId = req.params.resourceId;
    const resources = loadResources();
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resurs nije pronađen.' });
    }

    // 4. Pozovi PDP — policy engine donosi odluku
    const ipNetwork = getIpNetwork(req);
    const result = evaluate(user, resource, ipNetwork);

    // 5. Logiraj odluku
    logDecision(user, resource, result);

    // 6. Provedi odluku
    if (result.decision === 'permit') {
      req.user = user;
      req.resource = resource;
      next();
    } else {
      return res.status(403).json({
        message: 'Pristup odbijen.',
        reason: result.reason || 'Nijedna politika ne dozvoljava pristup.',
        context: result.context
      });
    }

  } catch (err) {
    return res.status(401).json({ message: 'Nevažeći token.', error: err.message });
  }
}

module.exports = abacMiddleware;