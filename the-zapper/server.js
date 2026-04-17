const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();

// Use the key exactly as Railway provides it
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

const systemInstruction = "You are the Architect for Ape Reaction. Be clinical, hostile, and use LaTeX for entropy.";

app.post('/api/scan', async (req, res) => {
    try {
        // Flash is more 'forgiving' with new billing accounts than Pro
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `AUDIT_INPUT: "${req.body.activity}"` }] }],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }
            ],
            generationConfig: { temperature: 0.9, maxOutputTokens: 250 }
        });

        const response = await result.response;
        res.json({ audit: response.text() });

    } catch (error) {
        // If this still fails, the error message in your terminal 
        // will tell us if it's a 'Prepay' issue or a 'Region' issue.
        console.error("--- RAW_CRASH ---", error.message);
        res.status(500).json({ audit: `DIAGNOSTIC: ${error.message.substring(0, 80)}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("[W.E.E.D. PROTOCOL V4.2]"));
