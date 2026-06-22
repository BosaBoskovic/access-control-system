const fs = require('fs');
const path = require('path');

const POLICIES_PATH = path.join(__dirname, '../policies/policies.json');

// Keš politika u memoriji. Umjesto čitanja JSON fajla sa diska pri
// SVAKOM zahtjevu, politike se učitavaju jednom i čuvaju u memoriji.
// Keš se osvježava samo kada se promijeni vrijeme zadnje izmjene (mtime)
// fajla policies.json - čime se i dalje čuva osobina dinamičkog
// učitavanja bez restartovanja servera (opisana u 5.7), ali bez
// nepotrebnog I/O overheada pri svakoj evaluaciji.
let policiesCache = null;
let cachedMtimeMs = null;

//Ucitavanje politika iz JSONa, sa keširanjem
function loadPolicies(){
    const stats = fs.statSync(POLICIES_PATH);

    if (policiesCache !== null && stats.mtimeMs === cachedMtimeMs) {
      return policiesCache;
    }

    // Fajl je promijenjen (ili je prvo učitavanje) - čitamo ponovo sa diska
    const data = fs.readFileSync(POLICIES_PATH, 'utf-8');
    policiesCache = JSON.parse(data);
    cachedMtimeMs = stats.mtimeMs;
    return policiesCache;
}

// Mock GeoIP - u produkciji bi se ovo dohvatalo iz GeoIP servisa (npr. MaxMind)
// na osnovu stvarne IP adrese. Za potrebe diplomskog, lokacija se izvodi
// iz tipa mreže: korporativne IP adrese mapiraju se na sjedište kompanije.
function getGeoLocation(ipNetwork) {
  return ipNetwork === 'corporate' ? 'RS' : 'unknown';
}

//izracunavanje kontekstualnih atributa
function getContextAttributes(ipNetwork = 'external') {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  return {
    time_of_day: (hour >= 8 && hour < 17) ? 'working_hours' : 'off_hours',
    day_of_week: (day >= 1 && day <= 5) ? 'weekday' : 'weekend',
    ip_network: ipNetwork,
    geo_location: getGeoLocation(ipNetwork)
  };
}


//provera 1 uslova politike
function evaluateCondition(conditionKey, conditionValue, user, resource, context){
    const parts = conditionKey.split('.');
    const group = parts[0];
    const attribute = parts[1];

    if (typeof conditionValue === 'string' && conditionValue.startsWith('{{')){
        const refAttribute = conditionValue.replace('{{resource.','').replace('}}','');
        conditionValue = resource[refAttribute];
    }

    if(group === 'user') return user[attribute] === conditionValue;
    if(group === 'resource') return resource[attribute] === conditionValue;
    if(group === 'context') return context[attribute] === conditionValue;

    return false;
}

  // Centralna evaluacijska logika - radi nad proizvoljnim skupom politika.
  // Izdvojena iz evaluate() da bi se mogla koristiti i sa custom skupom politika
  // (npr. u testu performansi pri različitom broju uslova po politici).
  function evaluatePolicies(policies, user, resource, context) {
    // Sortira po prioritetu (veći broj = viši prioritet)
    const sorted = [...policies].sort((a, b) => b.priority - a.priority);

    let finalDecision = 'deny';

    for (const policy of sorted) {
      const conditions = policy.conditions;
      const allMatch = Object.entries(conditions).every(([key, value]) =>
        evaluateCondition(key, value, user, resource, context)
      );

      if (allMatch) {
        // Deny - ako ijedna politika kaže deny, odbijam
        if (policy.effect === 'deny') {
          return {
            decision: 'deny',
            policy: policy.id,
            reason: policy.name,
            context
          };
        }
        finalDecision = 'permit';
      }
    }

    return {
      decision: finalDecision,
      context
    };
  }

  function evaluate(user, resource, ipNetwork = 'external') {
    const policies = loadPolicies();
    const context = getContextAttributes(ipNetwork);
    return evaluatePolicies(policies, user, resource, context);
  }

  module.exports = { evaluate, evaluatePolicies, getContextAttributes };