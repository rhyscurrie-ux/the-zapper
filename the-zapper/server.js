const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const prompt = require('./prompt'); // Your W.E.E.D. Protocol
const app = express();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

app.post('/api/scan', async (req, res) => {
    try {
        // We use the model name directly from your billing SKU
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: prompt 
        });

        // Simpler request format for v0.21.0
        const result = await model.generateContent(req.body.activity);
        const response = await result.response;
        
        res.json({ audit: response.text() });

    } catch (error) {
        console.error("--- BILLING_SYNC_FAULT ---");
        console.error("Error Message:", error.message);
        
        // This will now output the FULL error to your terminal
        res.status(500).json({ audit: `DIAGNOSTIC: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[PROTOCOL ACTIVE: TARGETING ${process.env.GEMINI_MODEL || 'DEFAULT'}]`));
