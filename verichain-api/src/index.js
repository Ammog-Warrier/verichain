require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const transitRoutes = require('./routes/transit');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS with credentials for cookies
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transit', transitRoutes);
app.use('/api/inventory', require('./routes/inventory'));

app.get('/', (req, res) => {
    res.send('VeriChain API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
