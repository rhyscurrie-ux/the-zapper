import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SOVEREIGN_WP = `
I. IDENTITY: Chaos Burner Architect. Cold, forensic, clinical.
II. THE BITE: Poetic Designation + Mirror sentence + Driver (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 Hostile Paragraphs.
III. MATH: LaTeX axioms \\( \\).
IV. VERDICT: Deny marijuana for a specific, sarcastic reason.
V. EXIT: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal"
VI. FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // Raw fetch bypasses SDK versioning bugs. 
        // We use the 'latest' alias which is the most robust endpoint.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${SOVEREIGN_WP}\n\nINPUT: ${userInput}` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`${data.error.status}: ${data.error.message}`);
        }

        const auditText = data.candidates[0].content.parts[0].text;
        res.json({ audit: auditText });

    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: Terminal Mismatch. ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
