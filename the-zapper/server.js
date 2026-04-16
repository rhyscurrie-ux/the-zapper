const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080; // Defaulting to 8080 for Railway

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: instruction }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        res.json({ architect_roast: text });
    } catch (e) {
        res.status(500).json({ architect_roast: `[CORE_CRASH]: ${e.message}` });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Zapper is live on port ${PORT}`);
});
