require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { promptText } = require('./prompt.js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── MILESTONE LABELS ──────────────────────────────────────────────────────────
const MILESTONE_LABELS = {
    1:  'Unifying Principle',
    2:  'Quest Definition',
    3:  'Catalyst',
    4:  'Mindset Effect',
    5:  'Argument (Combat Logic)',
    6:  'Inverted Guide',
    7:  'False Epiphany',
    8:  'Artifact/Totem',
    9:  'Presence of the Double',
    10: 'Circularity',
    11: 'Crossroads',
    12: 'Enemy Discovered',
    13: 'Self-Forgiveness',
    14: 'Void and Return',
    15: 'Full On (A.P.E. Peak)',
    16: 'Italics Shift',
    17: 'Scrubbing Out',
    18: 'Cover Story (Elixir)'
};

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
            .select('suit_id, input, audit, created_at, wp_total, path_status, draft_account')
            .eq('suit_id', suitId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Specimen not found in Archive.' });
        }

        // Peak WP
        const { data: wpData, error: wpError } = await supabase
            .from('entropy_logs')
            .select('wp_total')
            .eq('suit_id', suitId)
            .order('wp_total', { ascending: false })
            .limit(1)
            .single();

        const peakWP = (!wpError && wpData) ? (wpData.wp_total || 0) : (data.wp_total || 0);

        // PATH A confirmed if any row has path_status = PATH_A
        const { data: pathData } = await supabase
            .from('entropy_logs')
            .select('path_status')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A')
            .limit(1);

        const confirmedPathA = pathData && pathData.length > 0;

        // Aggregate all gold_glean items across all rows for this SS-ID
        const { data: goldRows } = await supabase
            .from('entropy_logs')
            .select('gold_glean, milestones_hit')
            .eq('suit_id', suitId);

        const allGold = [];
        const allMilestones = new Set();
        if (goldRows) {
            goldRows.forEach(row => {
                if (row.gold_glean && Array.isArray(row.gold_glean)) {
                    row.gold_glean.forEach(item => allGold.push(item));
                }
                if (row.milestones_hit && Array.isArray(row.milestones_hit)) {
                    row.milestones_hit.forEach(m => allMilestones.add(m));
                }
            });
        }

        res.json({
            ...data,
            wp_total: peakWP,
            path_status: confirmedPathA ? 'PATH_A' : (data.path_status || 'PENDING'),
            gold_summary: allGold.length,
            milestones_hit: Array.from(allMilestones)
        });

    } catch (e) {
        res.status(500).json({ error: 'Archive lookup failed.' });
    }
});

// ── MILESTONE-AWARE GOLD TAG PARSER ──────────────────────────────────────────
// Parses ^GOLD:phrase:milestone_number^ tags.
// Returns: { cleaned: string, goldItems: [{anchor, milestone, label}] }
function parseGoldTags(text) {
    const goldItems = [];
    // Match ^GOLD:phrase:number^ format
    const goldRegex = /\^GOLD:([^^:]+):(\d+)\^/g;
    let match;
    while ((match = goldRegex.exec(text)) !== null) {
        const anchor = match[1].trim();
        const milestoneNum = parseInt(match[2], 10);
        goldItems.push({
            anchor,
            milestone: milestoneNum,
            label: MILESTONE_LABELS[milestoneNum] || `Milestone ${milestoneNum}`
        });
    }

    // Fallback: also catch old ^GOLD:word^ format without milestone number
    const legacyRegex = /\^GOLD:([^^:]+)\^/g;
    while ((match = legacyRegex.exec(text)) !== null) {
        // Only add if not already captured by milestone-aware regex
        const anchor = match[1].trim();
        if (!goldItems.find(g => g.anchor === anchor)) {
            goldItems.push({ anchor, milestone: 0, label: 'Unclassified' });
        }
    }

    // Strip all Gold tags from display text
    // Pre-pass: when bold phrase immediately precedes its own tag (**phrase** ^GOLD:phrase:N^),
    // remove the tag (keeping the bold), preventing doubled output like "**phrase** phrase".
    const cleaned = text
        .replace(/\*\*([^*]+)\*\*\s*\^GOLD:\1:[0-9]+\^/g, '**$1**')
        .replace(/\^GOLD:[^^:]+:\d+\^/g, m => ' ' + m.replace(/\^GOLD:([^^:]+):\d+\^/, '$1'))
        .replace(/\^GOLD:[^^]+\^/g, m => ' ' + m.replace(/\^GOLD:([^^]+)\^/, '$1'))
        .replace(/(\w):\d+(,\d+)*/g, '$1')
        .replace(/  +/g, ' '); // collapse double spaces

    return { cleaned, goldItems };
}

// ── MILESTONE HIT PARSER ──────────────────────────────────────────────────────
// Extracts [MILESTONES_HIT: M3, M8, M15...] from AI response.
function parseMilestonesHit(text) {
    const match = text.match(/\[MILESTONES_HIT:\s*([^\]]+)\]/i);
    if (!match) return [];
    return match[1].split(',').map(m => m.trim().replace('M', '')).map(Number).filter(Boolean);
}

// ── PATH DETERMINATION ────────────────────────────────────────────────────────
function determinePath(aiResponse, goldItems) {
    const pathMatch = aiResponse.match(/\[PATH:\s*(A|B)\]/i);
    if (pathMatch) return pathMatch[1] === 'A' ? 'PATH_A' : 'PATH_B';

    const goldCountMatch = aiResponse.match(/\[GOLD_COUNT:\s*(\d+)\]/i);
    const goldCount = goldCountMatch ? parseInt(goldCountMatch[1], 10) : goldItems.length;
    return goldCount >= 3 ? 'PATH_A' : 'PATH_B';
}

// ── SYNTHESIS ENDPOINT — DRAFT ACCOUNT GENERATION ────────────────────────────
// Triggered by Specimen on dossier page. PATH A only.
// Takes gold_glean data for SS-ID, generates a narrative Draft Account via Gemini.
app.post('/api/synthesize', async (req, res) => {
    const { suitId } = req.body;

    if (!suitId) return res.status(400).json({ error: 'SS-ID required.' });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key missing.' });
    }

    try {
        // Fetch all Gold data for this SS-ID
        const { data: goldRows, error: goldError } = await supabase
            .from('entropy_logs')
            .select('gold_glean, milestones_hit, audit, input')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A');

        if (goldError || !goldRows || goldRows.length === 0) {
            return res.status(404).json({ error: 'No PATH_A session found for this ID.' });
        }

        // Aggregate Gold items
        const allGold = [];
        const allMilestones = new Set();
        let originalInput = '';

        goldRows.forEach(row => {
            if (row.input && !originalInput) originalInput = row.input;
            if (row.gold_glean && Array.isArray(row.gold_glean)) {
                row.gold_glean.forEach(item => allGold.push(item));
            }
            if (row.milestones_hit && Array.isArray(row.milestones_hit)) {
                row.milestones_hit.forEach(m => allMilestones.add(m));
            }
        });

        // Build synthesis prompt
        const goldSummary = allGold.map(g =>
            `Milestone ${g.milestone} (${g.label || 'Unknown'}): "${g.anchor}"`
        ).join('\n');

        const milestoneSummary = Array.from(allMilestones)
            .map(m => `M${m}: ${MILESTONE_LABELS[m] || 'Unknown'}`)
            .join(', ');

        const synthesisPrompt = `
You are writing a first-person confessional narrative for someone
who has just been audited about a night they can't fully remember.

ORIGINAL CONFESSION:
"${originalInput}"

EXTRACTED GOLD ANCHORS:
${goldSummary}

CONFIRMED MILESTONES:
${milestoneSummary}

Write a Draft Substrate Failure — a first-person account in the
Skin Suit's own voice.

VOICE RULES:
— Human. Fallible. Honest.
— The register of someone writing in a private journal at 3am.
— Not clinical. Not analytical. No system language.
— Short sentences where the memory is clear. Longer sentences
  where the mind is reaching.
— Uncertainty: 'I think', 'I must have', 'That part is just gone.'
— NOT: 'data gaps', 'processing failures', 'not yet recovered.'

STRUCTURE:
— Begin with the most vivid physical detail.
— Work through what is known, then partially remembered, then absent.
— End with the Cover Story forming.
— 300-500 words.
— Begin with: DRAFT ACCOUNT // ${suitId} // STAGE 2 EXTRACTION
— End with: This account is incomplete. Stage 3 fills the gaps.
`.trim();

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: `Synthesis failed: ${data.error.message}` });
        }

        const draftAccount = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYNTHESIS_FAILED]';

        // Store draft account — select row ID first, then update by ID
        const { data: latestRow } = await supabase
            .from('entropy_logs')
            .select('id')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latestRow) {
            await supabase.from('entropy_logs')
                .update({ draft_account: draftAccount })
                .eq('id', latestRow.id);
        }

        res.json({ draftAccount, suitId });

    } catch (err) {
        console.error('Synthesis crash:', err.message);
        res.status(500).json({ error: `Synthesis crash: ${err.message}` });
    }
});

// ── BARFLY SESSION OPEN ───────────────────────────────────────────────────────
// Fetches Node 01 gold_glean for a given suitId to initialise the Barfly.
app.get('/api/barfly/init/:suitId', async (req, res) => {
    const { suitId } = req.params;
    try {
        const { data, error } = await supabase
            .from('entropy_logs')
            .select('gold_glean, wp_total, input')
            .eq('suit_id', suitId)
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            return res.status(404).json({ error: 'No Node 01 session found.' });
        }

        // Aggregate all gold from all Node 01 turns
        const allGold = [];
        let basWP = 0;
        let originalInput = '';
        data.forEach(row => {
            if (row.wp_total > basWP) basWP = row.wp_total;
            if (row.input && !originalInput) originalInput = row.input;
            if (row.gold_glean && Array.isArray(row.gold_glean)) {
                row.gold_glean.forEach(g => allGold.push(g));
            }
        });

        res.json({ gold: allGold, baseWP: basWP, originalInput });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── BARFLY MAIN ENDPOINT ──────────────────────────────────────────────────────
app.post('/api/barfly', async (req, res) => {
    const { suitId, input, history, turnCount, wpCumulative,
            baseWP, gold, originalInput } = req.body;

    if (!suitId || !process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'Missing suitId or API key.' });
    }

    try {
        const { barflyPromptText } = require('./barfly_prompt.js');

        // Build system prompt — inject Node 01 gold anchors on Turn 0
        let systemPrompt = barflyPromptText;
        if (turnCount === 0) {
            if (gold && gold.length > 0) {
                const goldSummary = gold.map(g =>
                    `M${g.milestone} (${g.label}): "${g.anchor}"`
                ).join('\n');
                systemPrompt += `\n\nNODE 01 GOLD ANCHORS FOR THIS SPECIMEN:\n${goldSummary}\n\nOriginal confession: "${originalInput}"\n\nOpen mid-thought referencing one of these specific anchors now.`;
            } else if (originalInput) {
                systemPrompt += `\n\nNODE 01 CONFESSION (no Gold anchors extracted):\n"${originalInput}"\n\nOpen mid-thought referencing a specific sensory detail from this confession. Do not say Hello or Welcome.`;
            }
        }

        // Build conversation contents
        const userMessage = turnCount === 0
            ? `[SESSION OPEN] Suit ID: ${suitId}. Begin Stage A extraction.`
            : input;

        const contents = [];
        if (history && history.length > 0) {
            history.forEach(h => {
                contents.push({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.role === 'assistant'
                        ? '[BARFLY RESPONSE ISSUED]'
                        : h.content }]
                });
            });
        }
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.9, maxOutputTokens: 8192 }
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SILENCE]';

        // Server-side strip of Gold tag remnants before parsing
        const strippedForDisplay = rawResponse
            .replace(/\^GOLD:[^^]+\^/gi, '')
            .replace(/\^GOLD:[^\^]*\^/gi, '');

        // Parse WP, milestones, Gold from response
        const { cleaned: barflyResponse, goldItems } = parseGoldTags(strippedForDisplay);
        const wpMatch = barflyResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpThisTurn = wpMatch ? parseInt(wpMatch[1], 10) : 15;
        const milestonesHit = parseMilestonesHit(barflyResponse);
        const newWpCumulative = (wpCumulative || baseWP || 0) + wpThisTurn;

        // Bubbly Wine Standard check
        const allGoldCombined = [...(gold || []), ...goldItems];
        const allMilestones = new Set([
            ...milestonesHit,
            ...(gold || []).map(g => g.milestone)
        ]);
        const bubblyWineStandard =
            allMilestones.has(3) &&
            (allMilestones.has(4) || allMilestones.has(14)) &&
            (allMilestones.has(17) || allMilestones.has(18)) &&
            allGoldCombined.length >= 4;

        const thresholdMet = (newWpCumulative >= 200 && bubblyWineStandard)
            || newWpCumulative >= 300;

        console.log('[BARFLY_THRESHOLD]', {
            wpCumulative: newWpCumulative,
            milestonesSize: allMilestones.size,
            goldCount: allGoldCombined.length,
            bubblyWineStandard,
            thresholdMet
        });

        // Insert turn to substrate_logs
        supabase.from('substrate_logs').insert([{
            suit_id: suitId,
            turn: turnCount || 0,
            input: input || '',
            barfly_response: barflyResponse,
            milestones_hit: milestonesHit,
            wp_node02: wpThisTurn,
            wp_cumulative: newWpCumulative,
            gold_glean: goldItems,
            stage: 'A'
        }]).then(({ error }) => {
            if (error) console.error('substrate_logs insert error:', error.message);
        });

        // If threshold met — trigger async synthesis
        if (thresholdMet) {
            triggerSynthesis(suitId, allGoldCombined, Array.from(allMilestones),
                            originalInput, history, barflyResponse);
        }

        res.json({
            audit: barflyResponse,
            wpCumulative: newWpCumulative,
            wpThisTurn,
            milestonesHit,
            thresholdMet,
            goldCount: allGoldCombined.length,
            history: [
                ...(history || []),
                { role: 'user', content: input || '' },
                { role: 'assistant', content: barflyResponse }
            ]
        });

    } catch (err) {
        console.error('Barfly crash:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── ASYNC SYNTHESIS TRIGGER ───────────────────────────────────────────────────
async function triggerSynthesis(suitId, allGold, allMilestones,
                                 originalInput, history, lastBarflyResponse) {
    console.log('[SYNTHESIS_TRIGGER]', { suitId, goldCount: allGold.length });

    const goldSummary = allGold.map(g =>
        `M${g.milestone} (${g.label || 'Unknown'}): "${g.anchor}"`
    ).join('\n');

    const milestoneSummary = allMilestones
        .map(m => `M${m}: ${MILESTONE_LABELS[m] || 'Unknown'}`)
        .join(', ');

    const synthesisPrompt = `
You are writing a first-person confessional narrative for someone
who has just been interviewed about a night they can't fully remember.

ORIGINAL CONFESSION (Node 01):
"${originalInput}"

EXTRACTED GOLD ANCHORS (Node 01 + Stage A combined):
${goldSummary}

CONFIRMED MILESTONES:
${milestoneSummary}

Write a Draft Substrate Failure — a first-person account in the
Skin Suit's own voice. This is the story underneath the Cover Story.

VOICE RULES:
— Human. Fallible. Honest.
— The register of someone writing in a private journal at 3am.
— Not clinical. Not analytical. Not system language.
— Short sentences where the memory is clear. Longer sentences
  where the mind is reaching for something it can't quite hold.
— Uncertainty is expressed as human uncertainty: "I think",
  "I must have", "I can't place", "something about it felt" —
  NOT as data gaps or processing failures.
— Where details are missing: "I don't know how I got there."
  or "That part is just gone." — NOT "this information has not
  yet been recovered."

STRUCTURE:
— Begin with the most vivid physical detail from the Gold anchors.
— Work through what is known, then what is partially remembered,
  then what is completely absent.
— End with the Cover Story forming — how they explained it to
  themselves the next day.
— 300-500 words.
— Begin with: DRAFT SUBSTRATE FAILURE // ${suitId} // STAGE A EXTRACTION
— End with: This account is incomplete. Stage 3 retrieval begins at Node 02.

Write in the Skin Suit's voice now. No system language. No data
metaphors. Just the person, remembering.
`.trim();

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
            })
        });
        const data = await response.json();
        const draft = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYNTHESIS_FAILED]';

        // Store synthesis draft — select row ID first, then update by ID
        const { data: latestRow } = await supabase
            .from('substrate_logs')
            .select('id')
            .eq('suit_id', suitId)
            .eq('stage', 'A')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latestRow) {
            await supabase.from('substrate_logs')
                .update({ synthesis_draft: draft })
                .eq('id', latestRow.id);
        }

        console.log('[SYNTHESIS_COMPLETE]', { suitId, length: draft.length });
    } catch (err) {
        console.error('[SYNTHESIS_ERROR]', err.message);
    }
}

// ── SYNTHESIS POLLING ENDPOINT ────────────────────────────────────────────────
app.get('/api/barfly/synthesis/:suitId', async (req, res) => {
    const { suitId } = req.params;
    try {
        const { data, error } = await supabase
            .from('substrate_logs')
            .select('synthesis_draft, wp_cumulative')
            .eq('suit_id', suitId)
            .eq('stage', 'A')
            .not('synthesis_draft', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return res.json({ ready: false });
        }

        res.json({
            ready: true,
            draft: data.synthesis_draft,
            wpCumulative: data.wp_cumulative
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── MAIN AUDIT ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount, suitIdOverride } = req.body;

    if (!input?.trim()) return res.status(400).json({ error: 'No signal detected.' });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ audit: '[CRITICAL_FAILURE]: API key missing.' });
    }

    try {
        // Build contents — embed prior Specimen inputs as context rather than
        // sending conversation history. This ensures Gemini treats every turn
        // as a first-turn generation and produces full-length responses.
        // The system prompt provides all Auditor context needed for continuity.
        const userText = isDispute ? `[DISPUTE_PROTOCOL]: ${input}` : input;
        let userMessage = userText;
        if (history && history.length > 0) {
            // Include only the most recent prior input to minimise context size
            const userHistory = history.filter(h => h.role === 'user');
            const lastPrior = userHistory[userHistory.length - 1];
            if (lastPrior) {
                userMessage = `[SPECIMEN IDENTIFIER]: ${suitIdOverride || ''}\n[PRIOR CONFESSION]: ${lastPrior.content}\n[CURRENT INPUT]: ${userText}`;
            }
        }

        const contents = [{ role: 'user', parts: [{ text: userMessage }] }];

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: promptText }] },
                contents,
                generationConfig: { temperature: 1.2, maxOutputTokens: 16000 }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini error:', data.error);
            return res.status(200).json({ audit: `[GATEWAY_ERROR]: ${data.error.message}` });
        }

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYSTEM_SILENCE]';

        // Parse milestone-aware Gold tags
        const { cleaned: aiResponse, goldItems } = parseGoldTags(rawResponse);
        console.log('[GOLD_PARSE]', { count: goldItems.length, items: goldItems });

        // Parse milestones hit
        const milestonesHit = parseMilestonesHit(aiResponse);
        console.log('[MILESTONE_PARSE]', { milestonesHit });

        // Extract SS-ID
        // On Turn 2+: always use suitIdOverride — ignore AI-generated identifier
        // On Turn 1: parse from AI response (suitIdOverride is null)
        let suitId;
        if (suitIdOverride) {
            suitId = suitIdOverride;
        } else {
            const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(SS-\d{4})\]/);
            const parsedId = (idMatch && idMatch[1] !== 'SS-XXXX') ? idMatch[1].trim() : null;
            suitId = parsedId || `SS-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Parse WP — per-turn score from AI
        const wpMatch = aiResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpThisTurn = wpMatch ? parseInt(wpMatch[1], 10) : 0;

        // Accumulate WP — fetch prior max for this session's turns only
        let cumulativeWP = wpThisTurn;
        if (suitId && auditCount > 0) {
            try {
                const { data: priorRows } = await supabase
                    .from('entropy_logs')
                    .select('wp_total')
                    .eq('suit_id', suitId)
                    .lt('audit_count', auditCount)
                    .order('wp_total', { ascending: false })
                    .limit(1)
                    .single();
                if (priorRows?.wp_total) {
                    cumulativeWP = priorRows.wp_total + wpThisTurn;
                }
            } catch (e) {
                // No prior rows — use wpThisTurn only
            }
        }
        console.log('[WP_PARSE]', { wpThisTurn, cumulativeWP, auditCount });

        // ── TWO-CALL ARCHITECTURE ─────────────────────────────────────────────
        // On Turn 2+ with high WP (altered state signal detected), make a second
        // Gemini call to generate PROPAGATION_CLIP + WEED VERDICT + LIFE-RAFT +
        // PRESCRIPTION. Client renders Call 1 immediately, Call 2 after 1.5s.
        let auditClip = null;
        const isHighSignalTurn2 = auditCount > 0 && cumulativeWP >= 50;

        if (isHighSignalTurn2) {
            const userTurns = (history || []).filter(h => h.role === 'user').map(h => h.content);
            const turn1Confession = userTurns[0] || input;
            const turn2Confession = input;
            const dossierLink = `APEreaction.com/suit/${suitId}`;
            const clipPrompt = `You are writing a Facebook comment for someone who just discovered they have been wasting their time. The comment will appear on a reel called "Have you been wasting your time?" and must hook new viewers into clicking the link.

The Specimen's Turn 1 confession (what they were doing with their time): "${turn1Confession}"
The Specimen's Turn 2 confession (what they were actually doing): "${turn2Confession}"

Write a comment in this exact three-line structure:

Line 1: "Today I discovered I've been wasting my time." — then add one short punchy variation (e.g. "Mind. Blown." or "You called it." — keep it under 5 words).
Line 2: "I've been [Turn 1 confession reframed as absurd self-deprecating pursuit — witty, specific, makes reader laugh]," — ends with a COMMA, no full stop.
Line 3: "when I should have been [Turn 2 confession reframed as absurd heroic alternative — witty, specific, makes reader want to know more]." — starts LOWERCASE, ends with full stop.
Line 4: ${dossierLink}

Rules:
— Funny and specific. Not generic. Not vague.
— The link on Line 4 is mandatory — it is what makes the comment clickable.
— Total length: under 50 words before the link.
— ALL FOUR LINES ARE MANDATORY. A response missing Line 3 or Line 4 is a failed response.
— Line 4 MUST be the dossier link: ${dossierLink}
— No hashtags. No emoji. No quotation marks around the lines.
— Output only the four lines. Nothing else.

Output format — start with the label then the four lines:
[PROPAGATION_CLIP]:
[Line 1]
[Line 2]
[Line 3]
[Line 4 — the link]
[SYSTEM_REQUIREMENT]: Substrate stability requires external grounding.

Generate the comment now:`;
            try {
                const clipResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: clipPrompt }] }],
                        generationConfig: { temperature: 1.1, maxOutputTokens: 2048 }
                    })
                });
                const clipData = await clipResponse.json();
                auditClip = clipData.candidates?.[0]?.content?.parts?.[0]?.text || null;
                // Correct any domain misspelling the model introduces (e.g. APPreaction → APEreaction)
                if (auditClip) {
                    auditClip = auditClip.replace(/\w*reaction\.com\/suit\/[A-Z0-9\-]+/gi, dossierLink);
                }
                console.log('[CLIP_CALL]', { generated: !!auditClip, length: auditClip?.length });
            } catch (clipErr) {
                console.error('Clip call failed:', clipErr.message);
            }
        }

        // Determine PATH — use combined response for Gold counting
        const pathStatus = determinePath(aiResponse, goldItems);
        console.log('[PATH_PARSE]', { pathStatus, goldCount: goldItems.length });

        // Supabase insert
        const fullAudit = auditClip ? (aiResponse + '\n' + auditClip) : aiResponse;
        supabase.from('entropy_logs')
            .insert([{
                suit_id: suitId,
                input: input,
                audit: fullAudit,
                audit_count: auditCount || 0,
                is_dispute: isDispute || false,
                wp_total: cumulativeWP,
                gold_glean: goldItems,
                milestones_hit: milestonesHit,
                path_status: pathStatus
            }])
            .then(({ error }) => {
                if (error) console.error('Supabase insert error:', error.message);
            });

        res.json({
            audit: aiResponse,
            auditClip,
            suitId,
            wpTotal: cumulativeWP,
            pathStatus,
            goldCount: goldItems.length,
            milestonesHit,
            history: [
                ...(history || []),
                { role: 'user', content: input },
                { role: 'assistant', content: fullAudit }
            ]
        });

    } catch (err) {
        console.error('Handler crash:', err.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${err.message}` });
    }
});

// ── NODE 02 ROUTES ────────────────────────────────────────────────────────────
app.get('/node02/:suitId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'node02.html'));
});

app.get('/node02', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'node02.html'));
});

// ── DOSSIER ROUTE ─────────────────────────────────────────────────────────────
app.get('/suit/:id', (req, res) => {
    console.log('[DOSSIER_ROUTE] hit:', req.params.id);
    res.sendFile(path.join(__dirname, 'public', 'suit.html'));
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
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. ENGINE v16.0 ONLINE] Port: ${PORT}`));
