require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { promptText } = require('./prompt.js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── SPECIMEN COUNT ────────────────────────────────────────────────────────────
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
            .select('suit_id, input, audit, created_at, wp_total, path_status')
            .eq('suit_id', suitId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Specimen not found in Archive.' });
        }

        // Peak WP across all sessions
        const { data: wpData, error: wpError } = await supabase
            .from('entropy_logs')
            .select('wp_total')
            .eq('suit_id', suitId)
            .order('wp_total', { ascending: false })
            .limit(1)
            .single();

        const peakWP = (!wpError && wpData) ? (wpData.wp_total || 0) : (data.wp_total || 0);

        // PATH A confirmed if any row for this SS-ID has path_status = PATH_A
        const { data: pathData } = await supabase
            .from('entropy_logs')
            .select('path_status')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A')
            .limit(1);

        const confirmedPathA = pathData && pathData.length > 0;

        res.json({
            ...data,
            wp_total: peakWP,
            path_status: confirmedPathA ? 'PATH_A' : (data.path_status || 'PENDING')
        });

    } catch (e) {
        res.status(500).json({ error: 'Archive lookup failed.' });
    }
});

// ── GOLD TAG PARSER ───────────────────────────────────────────────────────────
// Extracts ^GOLD:word^ tags from AI response.
// Returns: { cleaned: string, goldItems: string[] }
function parseGoldTags(text) {
    const goldItems = [];
    const goldRegex = /\^GOLD:([^^]+)\^/g;
    let match;
    while ((match = goldRegex.exec(text)) !== null) {
        goldItems.push(match[1].trim());
    }
    // Strip tags from display text
    const cleaned = text.replace(/\^GOLD:[^^]+\^/g, (m) => {
        // Replace tag with just the word for display
        return m.replace(/\^GOLD:([^^]+)\^/, '$1');
    });
    return { cleaned, goldItems };
}

// ── PATH DETERMINATION ────────────────────────────────────────────────────────
// Determines PATH_A or PATH_B based on gold count at Centrifuge.
function determinePath(aiResponse, goldItems) {
    const centrifugeMatch = aiResponse.match(/\[CENTRIFUGE_STATUS\]/i);
    const pathMatch = aiResponse.match(/\[PATH:\s*(A|B)\]/i);
    const goldCountMatch = aiResponse.match(/\[GOLD_COUNT:\s*(\d+)\]/i);

    if (!centrifugeMatch && !pathMatch) return 'PENDING';

    // Trust AI's own PATH determination if present
    if (pathMatch) {
        return pathMatch[1] === 'A' ? 'PATH_A' : 'PATH_B';
    }

    // Fallback: determine from gold count
    const goldCount = goldCountMatch
        ? parseInt(goldCountMatch[1], 10)
        : goldItems.length;

    return goldCount >= 3 ? 'PATH_A' : 'PATH_B';
}

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

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYSTEM_SILENCE]';

        // ── GOLD EXTRACTION ───────────────────────────────────────────────────
        const { cleaned: aiResponse, goldItems } = parseGoldTags(rawResponse);
        console.log('[GOLD_PARSE]', { goldItems, count: goldItems.length });

        // ── IDENTIFIER EXTRACTION ─────────────────────────────────────────────
        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch
            ? idMatch[1].trim().replace(/\s+/g, '-')
            : `SS-${Date.now()}`;

        // ── WP EXTRACTION ─────────────────────────────────────────────────────
        const wpMatch = aiResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpTotal = wpMatch ? parseInt(wpMatch[1], 10) : 0;
        console.log('[WP_PARSE]', { wpMatch: wpMatch?.[1], wpTotal });

        // ── PATH DETERMINATION ────────────────────────────────────────────────
        const pathStatus = determinePath(aiResponse, goldItems);
        console.log('[PATH_PARSE]', { pathStatus, goldCount: goldItems.length });

        // ── SUPABASE INSERT ───────────────────────────────────────────────────
        supabase.from('entropy_logs')
            .insert([{
                suit_id: suitId,
                input: input,
                audit: aiResponse,          // cleaned — no Gold tags
                audit_count: auditCount || 0,
                is_dispute: isDispute || false,
                wp_total: wpTotal,
                gold_glean: goldItems,      // JSONB array — Architect-only
                path_status: pathStatus
            }])
            .then(({ error }) => {
                if (error) console.error('Supabase insert error:', error.message);
            });

        res.json({
            audit: aiResponse,
            suitId,
            wpTotal,
            pathStatus,
            goldCount: goldItems.length,
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
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. ENGINE v15.0 ONLINE] Port: ${PORT}`));
