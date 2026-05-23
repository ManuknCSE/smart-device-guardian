const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const callMLPredict = (temperature, current, voltage, usageHours) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/predict.py');
    const pythonProcess = spawn('python', [pythonScript, temperature, current, voltage, usageHours]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(dataString);
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result);
        }
      } catch (err) {
        reject('Error parsing ML response: ' + err.message);
      }
    });
  });
};

// @route   POST /api/ai/predict
// @desc    Call Python ML model directly
// @access  Public or Private (leaving public for easy testing, but can use protect)
router.post('/predict', async (req, res) => {
  try {
    const { temperature, current, voltage, usageHours } = req.body;
    const result = await callMLPredict(temperature, current, voltage, usageHours);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// @route   POST /api/ai/suggest
// @desc    Generate simple rule-based AI suggestions
// @access  Public or Private
router.post('/suggest', (req, res) => {
  const { temperature, current, healthScore, risk } = req.body;
  const suggestions = [];

  if (temperature > 75) {
    suggestions.push("Device overheating, consider shutdown.");
  } else if (temperature > 60) {
    suggestions.push("Temperature is running high, monitor closely.");
  }

  if (current > 8) {
    suggestions.push("Current increasing rapidly, possible internal wear.");
  }

  if (healthScore < 60) {
    suggestions.push("Device health low, maintenance recommended immediately.");
  } else if (healthScore < 80) {
    suggestions.push("Device health moderate, schedule preventative maintenance.");
  }

  if (risk === 'high') {
    suggestions.push("Risk of failure is HIGH. Replacement or critical maintenance required.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Device is operating optimally. No action required.");
  }

  res.json({ suggestions });
});

const { GoogleGenerativeAI } = require('@google/generative-ai');

// @route   POST /api/ai/chat
// @desc    Chat with Gemini as an IoT Assistant
// @access  Public or Private
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({ error: "Gemini API Key is missing. Please add it to backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `You are a Smart Device Guardian AI assistant. 
You analyze IoT devices for health, temperature, current, voltage, and predict failures.
Current Device Context: ${JSON.stringify(context)}
Be helpful, concise, and provide actionable maintenance advice based on the data.`,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to communicate with Gemini API: " + error.message });
  }
});

module.exports = router;
