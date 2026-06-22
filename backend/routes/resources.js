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

module.exports = router;