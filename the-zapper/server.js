app.post('/api/scan', async (req, res) => {
    try {
        // Ensure you are using the correct model name for your API access
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT REQUEST: "${req.body.activity}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ audit: text });
    } catch (error) {
        // THIS WILL APPEAR IN YOUR RAILWAY "DEPLOY" LOGS
        console.error("CRITICAL_HANDSHAKE_FAILURE:", error.message);
        
        // This is what the user sees
        res.status(500).json({ 
            audit: "SYSTEM_ERROR: The Architect is currently processing a logic loop. Stability at 4%. Try again shortly." 
        });
    }
});
