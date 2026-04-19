import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { promptText } from './prompt.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('public'));

// CRITICAL: Ensure 'API_KEY' is set in your Railway Environment Variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/api/scan', async (req, res) => {
    try {
        // UNIVERSAL INTAKE: Handles 'input' (index.html) or 'activity' (script.js)
        const userInput = req.body.input || req.body.activity; 
        
        if (!userInput) {
            return res.status(400).json({ audit: "[SYSTEM_ERROR]: No signal detected." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: promptText }] },
                { role: "model", parts: [{ text: "[WP: 0] [THERMAL_STATUS: SOLVENT] Architect Online. Substrate initialized." }] },
            ],
        });

        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        const text = response.text();

        res.json({ audit: text });
        
    } catch (error) {
        console.error("AUDIT_FAILURE:", error);
        res.status(500).json({ audit: "[CONNECTION_SEVERED]: Substrate collapse. Verify your API_KEY in Railway Variables." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[ARCHITECT ONLINE]: v11.5.0 on port ${PORT}`));
