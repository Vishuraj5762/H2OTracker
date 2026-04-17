const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const WaterEntry = require('./models/WaterEntry');
const Settings = require('./models/Settings');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



// Get settings from database
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ minLimit: settings.minLimit, maxLimit: settings.maxLimit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings in database
app.post('/api/settings', async (req, res) => {
  try {
    const { minLimit, maxLimit } = req.body;
    let settings = await Settings.getSettings();
    
    if (minLimit !== undefined) settings.minLimit = minLimit;
    if (maxLimit !== undefined) settings.maxLimit = maxLimit;
    settings.updatedAt = new Date();
    
    await settings.save();
    res.json({ minLimit: settings.minLimit, maxLimit: settings.maxLimit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add water entry (250ml)
app.post('/api/water/add', async (req, res) => {
  try {
    const { amount = 250 } = req.body;
    const entry = new WaterEntry({ amount });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add custom amount
app.post('/api/water/add-custom', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const entry = new WaterEntry({ amount });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's entries
app.get('/api/water/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await WaterEntry.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    res.json({ total, entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly stats
app.get('/api/water/weekly', async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const entries = await WaterEntry.find({
      date: { $gte: startOfWeek }
    });

    const settings = await Settings.getSettings();
    const dailyTotals = {};
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      dailyTotals[dateStr] = 0;
    }

    entries.forEach(entry => {
      const dateStr = new Date(entry.date).toISOString().split('T')[0];
      if (dailyTotals[dateStr] !== undefined) {
        dailyTotals[dateStr] += entry.amount;
      }
    });

    const weeklyTotal = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
    const weeklyAverage = weeklyTotal / 7;

    res.json({ dailyTotals, weeklyTotal, weeklyAverage, minLimit: settings.minLimit, maxLimit: settings.maxLimit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly stats
app.get('/api/water/monthly', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const entries = await WaterEntry.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const settings = await Settings.getSettings();
    const daysInMonth = endOfMonth.getDate();
    const dailyTotals = {};
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      dailyTotals[dateStr] = 0;
    }

    entries.forEach(entry => {
      const dateStr = new Date(entry.date).toISOString().split('T')[0];
      if (dailyTotals[dateStr] !== undefined) {
        dailyTotals[dateStr] += entry.amount;
      }
    });

    const monthlyTotal = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
    const monthlyAverage = monthlyTotal / daysInMonth;
    const belowMinCount = Object.values(dailyTotals).filter(total => total < settings.minLimit).length;
    const aboveMaxCount = Object.values(dailyTotals).filter(total => total > settings.maxLimit).length;
    const belowMinDates = Object.entries(dailyTotals)
      .filter(([_, total]) => total < settings.minLimit)
      .map(([date, total]) => ({ date, total }));

    res.json({ 
      dailyTotals, 
      monthlyTotal, 
      monthlyAverage,
      belowMinCount,
      aboveMaxCount,
      belowMinDates,
      minLimit: settings.minLimit,
      maxLimit: settings.maxLimit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history by date range
app.get('/api/water/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: end };
    }
    
    const entries = await WaterEntry.find(query).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
const dns=require("dns")

dns.setServers([
  '1.1.1.1',
  '8.8.8.1'
])

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.log(err));