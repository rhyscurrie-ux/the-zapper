const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// This tells the server to look inside the "public" folder for your files
app.use(express.static(path.join(__dirname, 'public')));

// This specifically points the home page to index.html
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: instruction }] }],
                generationConfig: { temperature: 1.0, maxOutputTokens: 800 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        res.json({ architect_roast: text });
    } catch (e) {
        res.status(500).json({ architect_roast: `[CORE_CRASH]: ${e.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`The Zapper is live on port ${PORT}`);
});
