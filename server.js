require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { promptText } = require('./prompt.js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── SPECIMEN COUNT (social proof display) ─────────────────────────────────────
app.get('/api/count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('entropy_logs')
            .select('id', { count: 'exact', head: true });
        if (error) throw error;
        res.json({ count: count || 847 });
    } catch (e) {
        console.error('Count error:', e.message);
        res.json({ count: 847 });
    }
});

// ── ID PAGE LOOKUP ────────────────────────────────────────────────────────────
app.get('/api/suit/:id', async (req, res) => {
    try {
        const suitId = req.params.id;

        const { data, error } = await supabase
            .from('entropy_logs')
            .select('suit_id, input, audit, created_at, wp_total')
            .eq('suit_id', suitId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Specimen not found in Archive.' });
        }

        const { data: wpData, error: wpError } = await supabase
            .from('entropy_logs')
            .select('wp_total')
            .eq('suit_id', suitId)
            .order('wp_total', { ascending: false })
            .limit(1)
            .single();

        const peakWP = (!wpError && wpData) ? (wpData.wp_total || 0) : (data.wp_total || 0);

        res.json({ ...data, wp_total: peakWP });

    } catch (e) {
        res.status(500).json({ error: 'Archive lookup failed.' });
    }
});

// ── MAIN AUDIT ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;

    if (!input?.trim()) {
        return res.status(400).json({ error: 'No signal detected.' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ audit: '[CRITICAL_FAILURE]: API key missing from environment.' });
    }

    try {
        const contents = (history || []).map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        const userText = isDispute
            ? `[DISPUTE_PROTOCOL]: ${input}`
            : input;

        contents.push({ role: 'user', parts: [{ text: userText }] });

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: promptText }] },
                contents,
                generationConfig: {
                    temperature: 1.2,
                    maxOutputTokens: 2048
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini error:', data.error);
            return res.status(200).json({ audit: `[GATEWAY_ERROR]: ${data.error.message}` });
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYSTEM_SILENCE]';

        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch
            ? idMatch[1].trim().replace(/\s+/g, '-')
            : `SS-${Date.now()}`;

        const wpMatch = aiResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpTotal = wpMatch ? parseInt(wpMatch[1], 10) : 0;
        console.log('[WP_PARSE]', { wpMatch: wpMatch?.[1], wpTotal });

        supabase.from('entropy_logs')
            .insert([{
                suit_id: suitId,
                input: input,
                audit: aiResponse,
                audit_count: auditCount || 0,
                is_dispute: isDispute || false,
                wp_total: wpTotal
            }])
            .then(({ error }) => {
                if (error) console.error('Supabase insert error:', error.message);
            });

        res.json({
            audit: aiResponse,
            suitId,
            wpTotal,
            history: [
                ...(history || []),
                { role: 'user', content: input },
                { role: 'assistant', content: aiResponse }
            ]
        });

    } catch (err) {
        console.error('Handler crash:', err.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${err.message}` });
    }
});

// ── DOSSIER ROUTE ─────────────────────────────────────────────────────────────
// Uses /suit/:id to avoid Railway CDN intercepting /SS-:id paths.
// Logs the resolved file path so we can confirm which file is being sent.
app.get('/suit/:id', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'suit.html');
    console.log('[DOSSIER_ROUTE] hit:', req.params.id, '| sending:', filePath);
    res.sendFile(filePath);
});

// ── ROOT ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── FALLBACK ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE] Port: ${PORT}`));
