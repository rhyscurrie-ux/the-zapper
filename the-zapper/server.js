require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js');
const { OpenAI } = require('openai'); // Make sure to run: npm install openai

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

// 1. Fetch total specimen count from Supabase
app.get('/api/count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('entropy_logs')
            .select('*', { count: 'exact', head: true });
        res.json({ count: count || 847 });
    } catch (e) {
        res.json({ count: 847 });
    }
});

// 2. Retrieve a specific suit from the archive via ?suit=ID
app.get('/api/suit/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('entropy_logs')
        .select('audit')
        .eq('id', req.params.id)
        .single();
    
    if (error || !data) return res.status(404).json({ error: "Log not found" });
    res.json(data);
});

// 3. The Core Audit Engine (The Architect's Brain)
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    try {
        // --- LIVE LLM CALL ---
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Or your preferred model
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: input }
            ],
            temperature: 0.8,
        });

        const aiResponse = completion.choices[0].message.content;

        // Extract ID from the Architect's response using the bracketed format
        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        // Clean the ID for URL usage: replace spaces with dashes, remove brackets
        const suitId = idMatch ? idMatch[1].trim().replace(/\s+/g, '-') : `ID-${Date.now()}`;

        // SAVE TO SUPABASE
        const { error: dbError } = await supabase.from('entropy_logs').insert([{ 
            id: suitId, 
            input: input, 
            audit: aiResponse 
        }]);

        if (dbError) console.error("Supabase Save Error:", dbError);

        res.json({ 
            audit: aiResponse, 
            history: [...history, { role: "user", content: input }, { role: "assistant", content: aiResponse }] 
        });

    } catch (err) {
        console.error("Architect Brain Failure:", err);
        res.status(500).json({ error: "Architect Internal Error. The signal is weak." });
    }
});

// 4. Railway Deployment Binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Martis Terminal Online: Listening on port ${PORT}`);
});
