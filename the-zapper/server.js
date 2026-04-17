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

// DIAGNOSTIC BOOT: This will print all available models to your Railway Logs
async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("--- AVAILABLE MODELS ---");
        data.models?.forEach(m => console.log(`> Found: ${m.name}`));
        console.log("------------------------");
    } catch (e) {
        console.log("[DIAGNOSTIC_FAIL]: Could not list models.");
    }
}
listModels();

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    try {
        // We'll try the most standard 'gemini-pro' as a fallback
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(userInput);
        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
