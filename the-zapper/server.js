const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const systemInstruction = require('./prompt'); // Import the full soul
const app = express();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            systemInstruction: systemInstruction 
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `AUDIT_INPUT: "${req.body.activity}"` }] }],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }
            ],
            generationConfig: { 
                temperature: 0.95, 
                maxOutputTokens: 1024 // Room for the full 6-section output
            }
        });

        const response = await result.response;
        res.json({ audit: response.text() });

    } catch (error) {
        console.error("V5_CRASH:", error.message);
        res.status(500).json({ audit: `SYSTEM_ERROR: ${error.message.substring(0, 50)}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. SOVEREIGN ACTIVE]`));
