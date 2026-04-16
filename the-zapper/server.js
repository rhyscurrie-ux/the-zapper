const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
// Railway provides the PORT, or we default to 3000
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// The API endpoint for the Architect's Audit
app.post('/api/audit', async (req, res) => {
    const { input } = req.body;

    const instruction = `
    Identity: Chaos Burner Architect. 
    Bite: Hostile, clinical. 
    Identify driver in **BOLD**. Use 'Meat-Suit' and 'Narrative Weight'.
    Math: Use LaTeX ($$ $$). 
    Format: [AUDIT_LOG], [APE_TRIGGER], [DECIPHERED_WASTE], [STATUS], [PRESCRIPTION].
    Input: ${input}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: instruction }] }],
                generationConfig: { temperature: 1.0, maxOutputTokens: 1000 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        res.json({ architect_roast: text });
    } catch (e) {
        res.status(500).json({ architect_roast: `[CORE_CRASH]: ${e.message}` });
    }
});

// The '0.0.0.0' allows Railway to route external traffic to your app
app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Zapper is live on port ${PORT}`);
});
