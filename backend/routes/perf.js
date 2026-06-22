const express = require('express');
const router = express.Router();

const testUser = {
  id: "u2", username: "marko.manager",
  role: "manager", department: "finance",
  seniority: "senior", status: "active"
};

const testResource = {
  id: "r1", name: "Finansijski izvještaj Q1",
  type: "report", department: "finance",
  confidentiality: "high", owner: "u2"
};

// Generiše sintetičku politiku sa zadatim brojem uslova.
// Uslovi su namjerno postavljeni tako da svi budu tačni (permit),
// kako bi se mjerilo isključivo vrijeme evaluacije, a ne efekat skraćenog kruga.
function makePolicyWithConditions(conditionCount) {
  const allConditions = {
    "user.role": "manager",
    "user.department": "finance",
    "user.status": "active",
    "user.seniority": "senior",
    "resource.type": "report",
    "resource.department": "finance",
    "resource.confidentiality": "high",
    "context.time_of_day": "working_hours",
    "context.day_of_week": "weekday",
    "context.ip_network": "corporate"
  };
  const keys = Object.keys(allConditions).slice(0, conditionCount);
  const conditions = {};
  keys.forEach(k => { conditions[k] = allConditions[k]; });

  return {
    id: `POL-SYNTH-${conditionCount}`,
    name: `Sintetička politika sa ${conditionCount} uslova`,
    effect: "permit",
    priority: 1,
    conditions
  };
}

// Generiše N sintetičkih politika koje se ne podudaraju (radi mjerenja
// uticaja broja politika na vrijeme linearnog pretraživanja).
function makePolicySet(count) {
  const policies = [];
  for (let i = 0; i < count; i++) {
    policies.push({
      id: `POL-LOAD-${i}`,
      name: `Politika opterećenja ${i}`,
      effect: "permit",
      priority: i,
      conditions: { "user.department": `nepostojece_odjeljenje_${i}` }
    });
  }
  // Na kraju dodajemo jednu politiku koja se stvarno podudara,
  // da evaluacija mora proći kroz sve prethodne (worst-case linearno pretraživanje)
  policies.push(makePolicyWithConditions(3));
  return policies;
}

router.get('/test', (req, res) => {
  const { evaluate } = require('../engine/policyEngine');

  const results = [];
  const iterations = [1, 10, 50, 100, 500, 1000];

  for (const count of iterations) {
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      evaluate(testUser, testResource, 'corporate');
    }
    const end = performance.now();

    results.push({
      iteracija: count,
      ukupnoMs: parseFloat((end - start).toFixed(3)),
      prosjekMs: parseFloat(((end - start) / count).toFixed(4))
    });
  }

  res.json({
    poruka: "Test performansi završen",
    brojPolitika: require('../policies/policies.json').length,
    rezultati: results
  });
});

// Test uticaja BROJA USLOVA po politici na vrijeme evaluacije.
// Mentor (5.3 / 6.3) eksplicitno traži ovo mjerenje, odvojeno od broja politika.
router.get('/test-conditions', (req, res) => {
  const { evaluatePolicies, getContextAttributes } = require('../engine/policyEngine');
  const context = getContextAttributes('corporate');

  const conditionCounts = [1, 2, 3, 5, 7, 10];
  const ITERATIONS = 1000;
  const results = [];

  for (const condCount of conditionCounts) {
    const policy = makePolicyWithConditions(condCount);
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      evaluatePolicies([policy], testUser, testResource, context);
    }
    const end = performance.now();

    results.push({
      brojUslova: condCount,
      ukupnoMs: parseFloat((end - start).toFixed(3)),
      prosjekMs: parseFloat(((end - start) / ITERATIONS).toFixed(4))
    });
  }

  res.json({
    poruka: "Test uticaja broja uslova po politici završen",
    iteracijaPoMjerenju: ITERATIONS,
    rezultati: results
  });
});

// Test uticaja BROJA POLITIKA u sistemu na vrijeme evaluacije
// (linearno pretraživanje - svaka politika koja se ne podudara
// i dalje mora biti provjerena prije nego se dođe do one koja se podudara).
router.get('/test-policies', (req, res) => {
  const { evaluatePolicies, getContextAttributes } = require('../engine/policyEngine');
  const context = getContextAttributes('corporate');

  const policyCounts = [5, 50, 100, 500, 1000];
  const ITERATIONS = 1000;
  const results = [];

  for (const count of policyCounts) {
    const policySet = makePolicySet(count);
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      evaluatePolicies(policySet, testUser, testResource, context);
    }
    const end = performance.now();

    results.push({
      brojPolitika: count + 1,
      ukupnoMs: parseFloat((end - start).toFixed(3)),
      prosjekMs: parseFloat(((end - start) / ITERATIONS).toFixed(4))
    });
  }

  res.json({
    poruka: "Test uticaja broja politika na vrijeme evaluacije završen",
    iteracijaPoMjerenju: ITERATIONS,
    rezultati: results
  });
});

module.exports = router;