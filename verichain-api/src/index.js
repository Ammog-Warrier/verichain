require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/assets', assetRoutes);

app.get('/', (req, res) => {
    res.send('VeriChain API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
