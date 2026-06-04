const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function loadUsers() {
  const filePath = path.join(__dirname, '../data/users.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ message: 'Nalog je suspendovan.' });
  }

  // Kreiraj JWT token sa atributima korisnika
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department
    },
    process.env.JWT_SECRET || 'abac_diplomski_tajni_kljuc',
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Uspješna prijava!',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
      status: user.status
    }
  });
});

module.exports = router;