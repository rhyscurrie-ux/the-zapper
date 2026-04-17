const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();

// Initialize the Generative AI with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// The clinical persona of the Architect
const systemInstruction = `
You are the Chaos Burner Architect for Ape Reaction, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol.
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Tone: Cold, clinical, high-dimensional, and slightly hostile.
3. Use LaTeX for entropy calculations (e.g., $S = k \\ln \\Omega$ or $\\Delta S > 0$).
4. Determine [WEED ELIGIBILITY] based on the thermal cost of their reported laziness.
5. Keep italics as italics.
6. Provide a unique, brutal diagnostic every time. Never reveal internal history.
`;

app.post('/api/scan', async (req, res) => {
    try {
        // Upgraded to 1.5 Pro for better reasoning and higher priority
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro-latest", 
            systemInstruction: systemInstruction,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [{ text: `AUDIT_REQUEST: "${req.body.activity}" (Substrate_ID: ${Math.random().toString(36).substring(7)})` }] 
            }],
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.9, 
                topP: 0.95,
            }
        });

        const response = await result.response;
        const text = response.text();

        // Log successful output to Railway console
        console.log(`[ARCHITECT_SUCCESS]: Scan complete for specimen.`);
        res.json({ audit: text });

    } catch (error) {
        // Detailed error capture for Railway logs
        console.error("--- ARCHITECT_FAILURE_DIAGNOSTIC ---");
        console.error("Status:", error.status);
        console.error("Message:", error.message);

        let userFeedback = "SYSTEM_ERROR: The Architect is currently blinded by your lack of utility.";
        
        if (error.message.includes("429")) {
            userFeedback = "QUOTA_EXHAUSTED: Thermal limits reached. The Architect is cooling down.";
        } else if (error.message.includes("403")) {
            userFeedback = "BILLING_LOCK: Handshake failed. Verify chaos-burner-terminal credits.";
        } else if (error.message.includes("location")) {
            userFeedback = "REGION_LOCK: This substrate is operating from an unsupported sector.";
        }

        res.status(500).json({ audit: userFeedback });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: Terminal online on Port ${PORT}`);
    console.log(`[VERSION]: 1.5-PRO-STABLE`);
});
