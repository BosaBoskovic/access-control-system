const express = require('express');
const abacMiddleware = require('../middleware/abacMiddleware');

const router = express.Router();

// GET /resources/:resourceId — zaštićena ruta
router.get('/:resourceId', abacMiddleware, (req, res) => {
  res.json({
    message: 'Pristup odobren!',
    resource: req.resource,
    user: req.user.username
  });
});

// Test performansi - mjeri vrijeme evaluacije
router.get('/perf/test', async (req, res) => {
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
  const iterations = [1, 10, 50, 100];

  for (const count of iterations) {
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      evaluate(testUser, testResource, 'corporate');
    }
    const end = performance.now();
    
    results.push({
      iteracija: count,
      ukupnoMs: parseFloat((end - start).toFixed(3)),
      prosjekMs: parseFloat(((end - start) / count).toFixed(3))
    });
  }

  res.json({
    poruka: "Test performansi završen",
    brojPolitika: require('../policies/policies.json').length,
    rezultati: results
  });
});

module.exports = router;