const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  const { evaluate } = require('../engine/policyEngine');
  
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

module.exports = router;