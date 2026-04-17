import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- THE DIAGNOSTIC BRIDGE ---
// This function will tell us exactly what models your key has permission to use.
async function scoutModels() {
    try {
        console.log("[SCOUTING_FREQUENCIES...]");
        // We fetch the model list directly from the API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("--- VALID_MODELS_FOUND ---");
            data.models.forEach(m => {
                // We only care about models that support 'generateContent'
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`> ALLOWED_TARGET: ${m.name.replace('models/', '')}`);
                }
            });
            console.log("--------------------------");
        } else {
            console.log("[SCOUT_FAIL]: No models returned. Check API Key permissions.");
        }
    } catch (e) {
        console.log(`[SCOUT_CRASH]: ${e.message}`);
    }
}
scoutModels();

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    try {
        // We'll use a generic 'gemini-pro' as a fallback while we scout
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userInput);
        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        // This sends the error back to your terminal so you can see it
        res.status(500).json({ audit: `[CORE_CRASH]: Frequency Mismatch. ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
