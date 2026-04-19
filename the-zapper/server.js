import express from 'express';
import { GoogleGenerativeAI } from '@google/genai';
import dotenv from 'dotenv';
import promptText from './prompt.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/api/scan', async (req, res) => {
    try {
        // UNIVERSAL INTAKE: Handles 'input' from index.html OR 'activity' from script.js
        const userInput = req.body.input || req.body.activity; 
        
        if (!userInput) {
            return res.status(400).json({ audit: "[SYSTEM_ERROR]: No signal detected." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: promptText }] }],
        });

        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        const text = response.text();

        // Sends back to data.audit (script.js) or result.audit (index.html)
        res.json({ audit: text });
        
    } catch (error) {
        console.error("AUDIT_FAILURE:", error);
        res.status(500).json({ audit: "[CONNECTION_SEVERED]: Substrate collapse." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[ARCHITECT ONLINE]: Port ${PORT}`));
