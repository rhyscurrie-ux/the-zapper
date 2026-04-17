const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();

// Load the API Key from Railway Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

const systemInstruction = `
You are the Chaos Burner Architect for Ape Reaction, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol.
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Tone: Cold, clinical, and slightly hostile. 
3. Use LaTeX for entropy equations: $S = k \\ln \\Omega$.
4. Determine [WEED ELIGIBILITY] based on the thermal cost of their laziness.
5. Keep italics as italics.
`;

app.post('/api/scan', async (req, res) => {
    try {
        // We use gemini-1.5-pro to ensure we utilize your NZ$521 credits
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro", 
            systemInstruction: systemInstruction 
        });

        // Safety Settings are explicitly set to BLOCK_NONE to prevent the "Blinded" error
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `AUDIT_INPUT: "${req.body.activity}"` }] }],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ],
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 300,
            }
        });

        const response = await result.response;
        const text = response.text();

        console.log("[ARCHITECT_SCAN_COMPLETE]");
        res.json({ audit: text });

    } catch (error) {
        // This is the core diagnostic tool
        console.error("--- FULL_CRASH_REPORT ---");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);

        let errorType = "ARCHITECT_BLINDED";
        if (error.message.includes("429")) errorType = "QUOTA_LIMIT_0";
        if (error.message.includes("403")) errorType = "BILLING_MISMATCH";
        if (error.message.includes("safety")) errorType = "CENSORSHIP_LOCK";

        res.status(500).json({ 
            audit: `DIAGNOSTIC_FAILURE [${errorType}]: ${error.message.substring(0, 40)}... Check Railway logs for the full string.` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. TERMINAL INITIALIZED]`);
    console.log(`[TARGET_MODEL]: Gemini 1.5 Pro`);
});
