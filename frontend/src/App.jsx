import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const API_URL = 'https://h2otracker.onrender.com/api';

function App() {
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayEntries, setTodayEntries] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [settings, setSettings] = useState({ minLimit: 2000, maxLimit: 4000 });
  const [showSettings, setShowSettings] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [todayRes, weeklyRes, monthlyRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/water/today`),
        axios.get(`${API_URL}/water/weekly`),
        axios.get(`${API_URL}/water/monthly`),
        axios.get(`${API_URL}/settings`)
      ]);
      setTodayTotal(todayRes.data.total);
      setTodayEntries(todayRes.data.entries);
      setWeeklyStats(weeklyRes.data);
      setMonthlyStats(monthlyRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount = 250) => {
    try {
      await axios.post(`${API_URL}/water/add`, { amount });
      fetchAllData();
      setCustomAmount('');
      setShowCustom(false);
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const updateSettings = async () => {
    try {
      await axios.post(`${API_URL}/settings`, settings);
      setShowSettings(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const getRemainingWater = () => {
    const remaining = settings.minLimit - todayTotal;
    return remaining > 0 ? remaining : 0;
  };

  const getProgressPercentage = () => {
    return Math.min((todayTotal / settings.minLimit) * 100, 100);
  };

  // Prepare chart data
  const weeklyChartData = weeklyStats ? Object.entries(weeklyStats.dailyTotals).map(([date, total]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
    total: total / 1000,
  })) : [];

  const monthlyChartData = monthlyStats ? Object.entries(monthlyStats.dailyTotals)
    .slice(-30)
    .map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      total: total / 1000,
    })) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-white">💧 H2O Tracker</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustom(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              🎯 Custom Amount
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              ⚙️ Edit Limits
            </button>
          </div>
        </div>

        {/* Custom Amount Modal */}
        {showCustom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h2 className="text-2xl font-bold mb-4">Add Custom Amount</h2>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount in ml"
                className="w-full border rounded-lg px-3 py-2 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => addWater(parseInt(customAmount))}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal - User can edit min/max limits */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h2 className="text-2xl font-bold mb-4">⚙️ Water Limits Settings</h2>
              <p className="text-gray-600 mb-4 text-sm">Set your daily water intake goals</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Daily Target (ml)</label>
                  <input
                    type="number"
                    value={settings.minLimit}
                    onChange={(e) => setSettings({ ...settings, minLimit: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 2000-3000ml</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Daily Limit (ml)</label>
                  <input
                    type="number"
                    value={settings.maxLimit}
                    onChange={(e) => setSettings({ ...settings, maxLimit: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 4000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum safe limit</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Aim for {Math.round(settings.minLimit/1000)}L to {Math.round(settings.maxLimit/1000)}L of water daily
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={updateSettings}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {['daily', 'weekly', 'monthly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === tab 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab === 'daily' && '📅 Daily'}
              {tab === 'weekly' && '📊 Weekly'}
              {tab === 'monthly' && '📈 Monthly'}
            </button>
          ))}
        </div>

        {/* Daily View */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Add Water Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">💧 Quick Add</h2>
                <button
                  onClick={() => addWater(250)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-4xl font-bold py-8 rounded-xl transition transform hover:scale-105"
                >
                  + 250 ml
                </button>
                <p className="text-center text-gray-600 mt-4">
                  Click each time you drink 250ml from your bottle
                </p>
              </div>

              {/* Today's Progress */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Today's Progress</h2>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {todayTotal} / {settings.minLimit} ml
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                {getRemainingWater() > 0 ? (
                  <p className="text-gray-600">🎯 {getRemainingWater()} ml more to reach minimum</p>
                ) : (
                  <p className="text-green-600 font-semibold">✅ You've reached your daily minimum! 🎉</p>
                )}
                {todayTotal > settings.maxLimit && (
                  <p className="text-orange-500 mt-2">⚠️ You've exceeded your maximum limit! ({settings.maxLimit}ml)</p>
                )}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Today's entries: {todayEntries.length} drinks
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Entries History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">⏱️ Today's Drinking History</h2>
              {todayEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No entries yet today. Start drinking! 💧</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todayEntries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b py-2">
                      <span className="text-gray-600">
                        {new Date(entry.date).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold text-blue-600">
                        +{entry.amount} ml
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly View */}
        {activeTab === 'weekly' && weeklyStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Weekly Overview</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Week Total</p>
                    <p className="text-2xl font-bold text-blue-600">{(weeklyStats.weeklyTotal / 1000).toFixed(1)} L</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Daily Average</p>
                    <p className="text-2xl font-bold text-green-600">{(weeklyStats.weeklyAverage / 1000).toFixed(1)} L</p>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Target vs Actual</p>
                  <p className="text-lg font-semibold">
                    {weeklyStats.weeklyAverage >= weeklyStats.minLimit ? '✅' : '⚠️'} 
                    {' '}{Math.abs(weeklyStats.weeklyAverage - weeklyStats.minLimit).toFixed(0)}ml {weeklyStats.weeklyAverage >= weeklyStats.minLimit ? 'above' : 'below'} daily target
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📅 Daily Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(weeklyStats.dailyTotals).map(([date, total]) => {
                    const isBelowMin = total < weeklyStats.minLimit;
                    const isAboveMax = total > weeklyStats.maxLimit;
                    return (
                      <div key={date} className="flex justify-between items-center border-b py-2">
                        <span className="text-gray-600">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long' })}</span>
                        <div className="text-right">
                          <span className={`font-semibold ${isBelowMin ? 'text-red-500' : isAboveMax ? 'text-orange-500' : 'text-green-500'}`}>
                            {(total / 1000).toFixed(1)} L
                          </span>
                          {isBelowMin && <span className="text-xs text-red-500 ml-2">↓ Below min</span>}
                          {isAboveMax && <span className="text-xs text-orange-500 ml-2">↑ Above max</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📈 Weekly Water Intake Chart</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3B82F6" name="Water Intake (L)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly View */}
        {activeTab === 'monthly' && monthlyStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Monthly Summary</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Intake</p>
                    <p className="text-2xl font-bold text-blue-600">{(monthlyStats.monthlyTotal / 1000).toFixed(1)} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Daily Average</p>
                    <p className="text-2xl font-bold text-green-600">{(monthlyStats.monthlyAverage / 1000).toFixed(1)} L</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">⚠️ Limit Violations</h2>
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Below Minimum ({monthlyStats.minLimit}ml)</p>
                    <p className="text-2xl font-bold text-red-600">{monthlyStats.belowMinCount} days</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Above Maximum ({monthlyStats.maxLimit}ml)</p>
                    <p className="text-2xl font-bold text-orange-600">{monthlyStats.aboveMaxCount} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📉 Days Below Target</h2>
                {monthlyStats.belowMinDates.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {monthlyStats.belowMinDates.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                        <span>{item.date}</span>
                        <span className="text-red-500">{(item.total / 1000).toFixed(1)} L</span>
                      </div>
                    ))}
                    {monthlyStats.belowMinDates.length > 10 && (
                      <p className="text-xs text-gray-500 text-center">+{monthlyStats.belowMinDates.length - 10} more days</p>
                    )}
                  </div>
                ) : (
                  <p className="text-green-600 text-center py-4">🎉 Great job! No days below target this month!</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📈 Monthly Water Intake Trend</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Daily Intake (L)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Average Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-2">💪 Your Daily Average</h2>
              <p className="text-4xl font-bold mb-2">{(monthlyStats.monthlyAverage / 1000).toFixed(1)} Liters</p>
              <p className="text-blue-100">per day this month</p>
              <div className="mt-4 pt-4 border-t border-blue-400">
                <p className="text-sm">
                  {monthlyStats.monthlyAverage >= monthlyStats.minLimit 
                    ? `✅ You're meeting your daily target of ${monthlyStats.minLimit}ml!` 
                    : `⚠️ You need to drink ${(monthlyStats.minLimit - monthlyStats.monthlyAverage).toFixed(0)}ml more per day to reach your target`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;