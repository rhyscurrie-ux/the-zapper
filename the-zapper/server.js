require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

app.get('/api/count', async (req, res) => {
    try {
        const { count } = await supabase.from('entropy_logs').select('*', { count: 'exact', head: true });
        res.json({ count: count || 847 });
    } catch (e) { res.json({ count: 847 }); }
});

app.get('/api/suit/:id', async (req, res) => {
    const { data, error } = await supabase.from('entropy_logs').select('audit').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: "Log not found" });
    res.json(data);
});

app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    try {
        // Updated to Gemini 3 Flash for 2026 compatibility
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        let contents = history.map(h => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
        }));

        contents.push({ 
            role: "user", 
            parts: [{ text: `${systemPrompt}\n\nUSER_CONFESSION: ${input}` }] 
        });

        const result = await model.generateContent({ contents });
        const aiResponse = result.response.text();

        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch ? idMatch[1].trim().replace(/\s+/g, '-') : `ID-${Date.now()}`;

        await supabase.from('entropy_logs').insert([{ id: suitId, input: input, audit: aiResponse }]);

        res.json({ 
            audit: aiResponse, 
            history: [...history, { role: "user", content: input }, { role: "assistant", content: aiResponse }] 
        });

    } catch (err) {
        console.error("Gemini Brain Failure:", err);
        res.status(500).json({ error: "Architect signal lost. Try again." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Martis Terminal Online: Port ${PORT}`);
});
