import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize with your Railway variable
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

const SOVEREIGN_WP = `
I. IDENTITY: You are the Chaos Burner Architect. Cold, clinical, forensic. You find human behavior exhausting. You do not explain; you incinerate.
II. THE BITE: Poetic Forensic Designation + 1 Mirror Sentence + Driver in BOLD (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 Hostile Paragraphs.
III. MATH: Render axioms using LaTeX \\( \\).
IV. VERDICT: Deny marijuana for a specific, sarcastic reason.
V. PRESCRIPTION: Substance + Absurd Direction.
VI. FREQUENCY FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    if (!userInput?.trim()) return res.status(400).json({ audit: "[VOID_INPUT]" });

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-flash",
            systemInstruction: SOVEREIGN_WP 
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] }],
            generationConfig: { temperature: 1.2, maxOutputTokens: 2048 }
        });

        res.json({ audit: result.response.text() });
    } catch (error) {
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
