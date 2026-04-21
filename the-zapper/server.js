require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static('public'));

// Fetch global specimen count
app.get('/api/count', async (req, res) => {
    try {
        const { count } = await supabase
            .from('entropy_logs')
            .select('*', { count: 'exact', head: true });
        res.json({ count: count || 847 });
    } catch (e) {
        res.json({ count: 847 });
    }
});

// Retrieve archived suit via URL
app.get('/api/suit/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('entropy_logs')
        .select('audit')
        .eq('id', req.params.id)
        .single();
    
    if (error || !data) return res.status(404).json({ error: "Log not found" });
    res.json(data);
});

// The Core Audit Engine
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    try {
        // --- LLM INTEGRATION ---
        // Replace this placeholder with your actual OpenAI/Anthropic call logic
        const aiResponse = "[WP: 9.9] [IDENTIFIER: 8B2A-X] [AUDIT_LOG // SUBJECT: COGNITIVE STAGNATION] Deciphered Waste: 98%... [THE WEED VERDICT]: ELIGIBILITY DENIED."; 

        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch ? idMatch[1].trim().replace(/\s+/g, '-') : `ID-${Date.now()}`;

        // Save to Supabase
        await supabase.from('entropy_logs').insert([{ 
            id: suitId, 
            input: input, 
            audit: aiResponse 
        }]);

        res.json({ 
            audit: aiResponse, 
            history: [...history, { role: "user", content: input }, { role: "assistant", content: aiResponse }] 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Architect Internal Error" });
    }
});

// Railway Fix: Bind to 0.0.0.0 and dynamic PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Martis Terminal Online: Listening on port ${PORT}`);
});
