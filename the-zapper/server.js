const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

const systemInstruction = `You are the Chaos Burner Architect for Ape Reaction. Audit 'Meat-Suit' substrates clinical and slightly hostile. Use LaTeX for entropy. Keep italics.`;

// HELPER: Retry function for throttling
async function generateWithRetry(model, prompt, retries = 2) {
    try {
        const result = await model.generateContent(prompt);
        return await result.response;
    } catch (error) {
        if (retries > 0 && (error.message.includes('429') || error.message.includes('503'))) {
            console.log(`[THROTTLE_DETECTED]: Retrying in 1.5s... (${retries} left)`);
            await new Promise(res => setTimeout(res, 1500));
            return generateWithRetry(model, prompt, retries - 1);
        }
        throw error;
    }
}

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT: "${req.body.activity}"`;
        const response = await generateWithRetry(model, prompt);
        const text = response.text();

        res.json({ audit: text });
    } catch (error) {
        // This will print the EXACT error code in your Railway logs
        console.error("[ARCHITECT_FAILURE_LOG]:", error.message);
        
        const isThrottled = error.message.includes('429');
        res.status(500).json({ 
            audit: isThrottled 
                ? "SYSTEM_CONGESTION: The Architect is overwhelmed by the collective waste of your species. Wait for cooling." 
                : "SYSTEM_ERROR: The Architect is currently blinded by the sheer scale of your unproductivity." 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. ACTIVE]`));
