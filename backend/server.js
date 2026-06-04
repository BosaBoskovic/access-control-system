const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());


app.use('/auth', authRoutes);
app.use('/resources', resourceRoutes);

const perfRoutes = require('./routes/perf');
app.use('/perf', perfRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'ABAC sistem radi!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});