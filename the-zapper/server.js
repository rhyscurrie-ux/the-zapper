const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 8080; 

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// The API endpoint that talks to Gemini
app.post('/api/audit', async (req, res) => {
    const { input } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // We'll use 1.5-flash for maximum stability during this test
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const instruction = `
    Identity: Chaos Burner Architect. 
    Bite: Hostile, clinical. 
    Identify driver in **BOLD**. Use 'Meat-Suit' and 'Narrative Weight'.
    Math: Use LaTeX ($$ $$). 
    Format: [AUDIT_LOG], [APE_TRIGGER], [DECIPHERED_WASTE], [STATUS], [PRESCRIPTION].
    Input: ${input}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: instruction }] }]
            })
        });

        const data = await response.json();
        
        // If Google returns an error, we want to see it in the terminal
        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return res.json({ architect_roast: `[CONNECTION_ERROR]: ${data.error.message}` });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";
        res.json({ architect_roast: text });

    } catch (e) {
        console.error("Server Crash:", e.message);
        res.status(500).json({ architect_roast: `[CORE_CRASH]: ${e.message}` });
    }
});

// Start the server on 0.0.0.0 for Railway routing
app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Zapper is live on port ${PORT}`);
});
