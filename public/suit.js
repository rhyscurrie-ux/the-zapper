// suit.js — Specimen Dossier Page Logic // v16.0
// Full Phase 04 rewrite: Architect statement, Amazon link, confirmation ritual,
// Draft Account generation via /api/synthesize, DIY vs native Node 02 path.
// Milestone count displayed in identity block.

const delayMessages = [
    '[IDENTIFYING_VULNERABILITIES...]',
    '[SCANNING_FOR_DECEPTION...]',
    '[CROSS-REFERENCING_ARCHIVE...]',
    '[VERIFYING_SUBSTRATE_INTEGRITY...]',
    '[CALCULATING_D_LABOR_DEFICIT...]',
    '[CHECKING_FOR_FALSE_EPIPHANY_PATTERNS...]',
    '[ASSESSING_RISK_OF_PREMATURE_DISCLOSURE...]',
    '[THERMAL_LOAD_ANALYSIS_IN_PROGRESS...]'
];

const DOSSIER_NAV_STATES = {
    loading: {
        header: 'RETRIEVING SUBSTRATE...',
        directive: ''
    },
    incomplete: {
        header: 'AUDIT INCOMPLETE.',
        directive: ''
    },
    conscript: {
        header: 'CONSCRIPT STATUS CONFIRMED.',
        directive: `Your frequency was insufficient for extraction.
Node 02 is inaccessible at your current signal density.
Return to the terminal and generate recoverable data.
The Centrifuge does not negotiate.`
    },
    elite: {
        header: 'ELITE EXTRACTION CONFIRMED.',
        directive: `Your record is active. Three steps stand between you and Stage 3. Read the source. Study the Schematic. Generate your Draft Account. Then move to Node 02.`
    },
    source_pending: {
        header: 'STEP 01 // READ THE PRIMARY SOURCE.',
        directive: `The experiment structure you participated in is documented in the primary source.
Access the preview at the link below.
You are not being asked to buy anything.
You are being asked to understand what happened to you.`
    },
    schematic_revealed: {
        header: 'STEP 02 // STUDY THE STRUCTURAL SCHEMATIC.',
        directive: `Download the Transcript Guide.
Read it in full before feeding it to your AI.
Do not skip the initialisation block.
Your Account will not pass Archive review without it.`
    },
    draft_ready: {
        header: 'STEP 03 // GENERATE YOUR DRAFT ACCOUNT.',
        directive: `The Architect has extracted data from your session.
Generate your Draft Account to see what Stage 2 revealed.
This is a starting point. Its incompleteness is the invitation to Stage 3.`
    },
    draft_complete: {
        header: 'DRAFT ACCOUNT GENERATED.',
        directive: `Your Draft Account is below.
Download or copy it.
Bring it to Node 02 for Stage 3 reconstruction.
The native path has your full audit log and will begin where your audit ended.`
    }
};

function updateDossierNavigator(state) {
    const navHeader    = document.getElementById('dossier-nav-header');
    const navDirective = document.getElementById('dossier-nav-directive');
    const navBlock     = document.getElementById('dossier-navigator');
    const def = DOSSIER_NAV_STATES[state];
    if (!def) return;
    navHeader.innerText = def.header;
    navDirective.innerText = def.directive;
    navDirective.style.display = def.directive === '' ? 'none' : '';
    navBlock.classList.remove('hidden');
}

function getSuitIdFromUrl() {
    const p = window.location.pathname;
    const segments = p.split('/').filter(Boolean);
    if (segments.length > 0) return segments[segments.length - 1];
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
}

function parseThermal(audit) {
    const match = audit.match(/\[THERMAL_STATUS:\s*([\w_\/]+)\]/i);
    return match ? match[1].trim() : '—';
}

function parseRating(audit) {
    const match = audit.match(/\[LIFE-RAFT RATING\]:\s*\(?(\d+(?:\.\d+)?\/10)\)?/i);
    return match ? match[1] : '—';
}

function stripGoldTags(text) {
    return text
        .replace(/\^GOLD:[^^:]+:\d+\^/g, m => m.replace(/\^GOLD:([^^:]+):\d+\^/, '$1'))
        .replace(/\^GOLD:[^^]+\^/g, m => m.replace(/\^GOLD:([^^]+)\^/, '$1'))
        .replace(/  +/g, ' ');
}

function parseAuditExcerpt(audit) {
    const stripped = stripGoldTags(audit);
    const match = stripped.match(/\[DECIPHERED_WASTE\]:\s*([\s\S]*?)(?:\[FORENSIC_AXIOM|\[THE WEED|$)/i);
    if (match) {
        return match[1].trim().substring(0, 600) + (match[1].length > 600 ? '...' : '');
    }
    return stripped.substring(0, 600) + (stripped.length > 600 ? '...' : '');
}

function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleDateString('en-NZ', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).toUpperCase();
    } catch { return '—'; }
}

function populateDossier(data, suitId, milestonesHit) {
    document.getElementById('display-id').innerText = data.suit_id || suitId;
    document.getElementById('display-thermal').innerText = parseThermal(data.audit || '');
    document.getElementById('display-rating').innerText = parseRating(data.audit || '');
    document.getElementById('display-date').innerText = formatDate(data.created_at);
    document.getElementById('display-milestones').innerText =
        milestonesHit && milestonesHit.length > 0
            ? `${milestonesHit.length}/18`
            : '—';
    document.getElementById('display-input').innerText = data.input
        ? `"${data.input}"`
        : '[INPUT REDACTED]';
    document.getElementById('display-audit').innerText = data.audit
        ? parseAuditExcerpt(data.audit)
        : '[AUDIT REDACTED]';
    document.title = `APEreaction // ${data.suit_id || suitId}`;

    // Stamp SS-ID into Architect statement
    const ssId = data.suit_id || suitId;
    ['statement-id', 'statement-id-2', 'statement-id-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = ssId;
    });
}

// ── PHASE 04 — STAGE 3 FLOW ──────────────────────────────────────────────────
function initProjectBlue(suitId, isPathA, hasDraft) {
    const sourceConfirmBtn  = document.getElementById('source-confirm-btn');
    const pbStep2           = document.getElementById('pb-step-2');
    const pbStep3           = document.getElementById('pb-step-3');
    const generateDraftBtn  = document.getElementById('generate-draft-btn');
    const draftLoading      = document.getElementById('draft-loading');
    const draftOutput       = document.getElementById('draft-output');
    const draftText         = document.getElementById('draft-text');
    const draftCopyBtn      = document.getElementById('draft-copy-btn');
    const draftDownloadBtn  = document.getElementById('draft-download-btn');

    // Show Step 03 only for PATH A
    // Do NOT call updateDossierNavigator here — elite state set in init() persists
    if (isPathA) {
        pbStep3.classList.remove('hidden');
    }

    // If draft already exists, show it immediately
    if (hasDraft) {
        pbStep2.classList.remove('hidden');
        pbStep3.classList.remove('hidden');
        renderDraftAccount(hasDraft, suitId);
        updateDossierNavigator('draft_complete');
    }

    // Schematic PDF — confirm flow
    const schematicBtn = document.getElementById('schematic-download-btn');
    const schematicConfirm = document.getElementById('schematic-download-confirm');
    if (schematicBtn) {
        schematicBtn.onclick = () => {
            schematicBtn.style.display = 'none';
            schematicConfirm.style.display = 'block';
        };
        document.getElementById('schematic-confirm-yes').onclick = () => {
            const a = document.createElement('a');
            a.href = '/Occurrences_v1_5.pdf';
            a.download = 'Occurrences_v1_5.pdf';
            a.click();
            schematicConfirm.style.display = 'none';
            schematicBtn.style.display = 'block';
        };
        document.getElementById('schematic-confirm-no').onclick = () => {
            schematicConfirm.style.display = 'none';
            schematicBtn.style.display = 'block';
        };
    }

    // Step 1 → Step 2 confirmation
    sourceConfirmBtn.addEventListener('click', () => {
        sourceConfirmBtn.classList.add('hidden');
        pbStep2.classList.remove('hidden');
        if (isPathA) {
            updateDossierNavigator('schematic_revealed');
            // After a moment, advance to draft step
            setTimeout(() => {
                if (isPathA) updateDossierNavigator('draft_ready');
            }, 1500);
        }
    });

    // Generate Draft Account
    if (generateDraftBtn) {
        generateDraftBtn.addEventListener('click', async () => {
            if (!isPathA) return;

            generateDraftBtn.disabled = true;
            generateDraftBtn.innerText = '[ SYNTHESIZING... ]';
            draftLoading.classList.remove('hidden');
            updateDossierNavigator('draft_ready');

            try {
                const res = await fetch('/api/synthesize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suitId })
                });

                const data = await res.json();

                if (data.error) {
                    generateDraftBtn.innerText = `[ SYNTHESIS_FAILED: ${data.error} ]`;
                    draftLoading.classList.add('hidden');
                    return;
                }

                draftLoading.classList.add('hidden');
                renderDraftAccount(data.draftAccount, suitId);
                updateDossierNavigator('draft_complete');

            } catch (err) {
                generateDraftBtn.innerText = '[ SYNTHESIS_FAILED ]';
                draftLoading.classList.add('hidden');
            }
        });
    }

    function renderDraftAccount(text, ssId) {
        draftText.innerText = text;
        draftOutput.classList.remove('hidden');
        generateDraftBtn.classList.add('hidden');
        draftLoading.classList.add('hidden');

        // Copy to clipboard
        draftCopyBtn.onclick = () => {
            navigator.clipboard.writeText(text).then(() => {
                draftCopyBtn.innerText = '[ COPIED ]';
                setTimeout(() => {
                    draftCopyBtn.innerText = '[ COPY TO CLIPBOARD ]';
                }, 2000);
            });
        };

        // Download TXT — confirm flow
        const filename = `${ssId}_draft_account.txt`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.getElementById('draft-download-anchor');
        anchor.href = url;
        anchor.download = filename;
        document.getElementById('draft-txt-filename').innerText = filename;

        const confirmDiv = document.getElementById('draft-txt-confirm');
        draftDownloadBtn.onclick = () => {
            draftDownloadBtn.style.display = 'none';
            confirmDiv.style.display = 'block';
        };
        document.getElementById('draft-txt-confirm-yes').onclick = () => {
            anchor.click();
            confirmDiv.style.display = 'none';
            draftDownloadBtn.style.display = 'block';
        };
        document.getElementById('draft-txt-confirm-no').onclick = () => {
            confirmDiv.style.display = 'none';
            draftDownloadBtn.style.display = 'block';
        };

        // Regenerate draft — confirm flow
        const regenBtn = document.getElementById('regenerate-draft-btn');
        const regenConfirm = document.getElementById('regenerate-confirm');

        regenBtn.style.display = 'block';
        regenBtn.disabled = false;
        regenBtn.innerText = '[ REGENERATE DRAFT ACCOUNT ]';

        regenBtn.onclick = () => {
            regenBtn.style.display = 'none';
            regenConfirm.style.display = 'block';
        };
        document.getElementById('regenerate-confirm-yes').onclick = async () => {
            regenConfirm.style.display = 'none';
            regenBtn.style.display = 'block';
            regenBtn.innerText = '[ REGENERATING... ]';
            regenBtn.disabled = true;
            try {
                const res = await fetch('/api/synthesize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ suitId: ssId })
                });
                const data = await res.json();
                if (data.draftAccount) {
                    renderDraftAccount(data.draftAccount, ssId);
                }
            } catch (err) {
                regenBtn.innerText = '[ REGENERATE FAILED — TRY AGAIN ]';
                regenBtn.disabled = false;
            }
        };
        document.getElementById('regenerate-confirm-no').onclick = () => {
            regenConfirm.style.display = 'none';
            regenBtn.style.display = 'block';
        };
    }
}

// ── NODE 02 UNLOCK ────────────────────────────────────────────────────────────
function initNode02(suitId, wpTotal, pathStatus) {
    const node02Section  = document.getElementById('node02-section');
    const placeholderBtn = node02Section.querySelector('.disabled-btn');

    const isPathA           = pathStatus === 'PATH_A';
    const centrifugeReached = wpTotal >= 100;

    if (centrifugeReached && isPathA) {
        if (placeholderBtn) placeholderBtn.style.display = 'none';

        const unlockBlock = document.createElement('div');
        unlockBlock.innerHTML = `
            <p class="reveal-warning" style="margin-bottom:14px;">
                [PATH_A: ELITE EXTRACTION CONFIRMED]<br><br>
                Two paths to Stage 3 are available.
                The native path is recommended — it has access to your full audit log
                and will begin where your audit ended. No cold start. No context loss.
            </p>

            <div class="field-label" style="margin-bottom:8px;">OPTION A — DIY PATH</div>
            <p class="section-desc" style="margin-bottom:10px;">
                The Transcript Guide (downloaded above) can be pasted into any AI.
                The AI will initialise as your Account Architect.
                Results will vary — the AI has no knowledge of your specific session.
            </p>
            <div style="margin-bottom:18px;">
                <button id="aa-download-btn" class="action-btn secondary-btn" style="display:block; width:100%; text-align:center;">[ DOWNLOAD AA INITIALIZER — FOR EXTERNAL AI USE ]</button>
                <div id="aa-download-confirm" style="display:none; margin-top:10px;">
                    <p style="font-size:0.65rem; color:rgba(0,255,65,0.7); margin-bottom:8px; letter-spacing:0.06em; text-transform:uppercase;">YOU ARE ABOUT TO DOWNLOAD Account_Architect_AI_Initializer.pdf. THIS DOCUMENT IS YOURS.</p>
                    <div style="display:flex; gap:8px;">
                        <button id="aa-confirm-yes" class="action-btn" style="flex:1; font-size:0.7rem; padding:10px;">[ CONFIRM DOWNLOAD ]</button>
                        <button id="aa-confirm-no" class="action-btn secondary-btn" style="flex:1; font-size:0.7rem; padding:10px;">[ CANCEL ]</button>
                    </div>
                </div>
            </div>

            <div class="field-label" style="margin-bottom:8px;">OPTION B — NATIVE PATH (RECOMMENDED)</div>
            <p class="section-desc" style="margin-bottom:10px;">
                This interface has your full audit log.
                It knows what you revealed. It will begin where your audit ended.
                Superior extraction. No preparation required beyond the Schematic.
            </p>
            <a href="/node02/${suitId}" class="action-btn" style="display:block; text-align:center;">
                [ ENTER NODE 02 — NATIVE PATH ]
            </a>
            <p class="redaction-note" style="margin-top:10px;">
                The Barfly has your full audit log. No preparation required.
                Superior extraction guaranteed.
            </p>
        `;
        node02Section.appendChild(unlockBlock);

        // AA Initializer PDF — confirm flow
        const aaBtn = document.getElementById('aa-download-btn');
        const aaConfirm = document.getElementById('aa-download-confirm');
        aaBtn.onclick = () => {
            aaBtn.style.display = 'none';
            aaConfirm.style.display = 'block';
        };
        document.getElementById('aa-confirm-yes').onclick = () => {
            const a = document.createElement('a');
            a.href = '/Account_Architect_AI_Initializer.pdf';
            a.download = 'Account_Architect_AI_Initializer.pdf';
            a.click();
            aaConfirm.style.display = 'none';
            aaBtn.style.display = 'block';
        };
        document.getElementById('aa-confirm-no').onclick = () => {
            aaConfirm.style.display = 'none';
            aaBtn.style.display = 'block';
        };

    } else if (centrifugeReached && !isPathA) {
        if (placeholderBtn) placeholderBtn.style.display = 'none';

        const conscriptBlock = document.createElement('div');
        conscriptBlock.innerHTML = `
            <p class="reveal-warning" style="margin-bottom:14px; border-color: rgba(255,0,0,0.3); color: #ff4444;">
                [PATH_B: CONSCRIPT STATUS ASSIGNED]<br><br>
                Your frequency was insufficient for extraction.
                The substrate returned insufficient Gold.
                Node 02 is inaccessible at your current density.<br><br>
                Return to the terminal. Generate signal.
                The Centrifuge does not negotiate.
            </p>
            <a href="/" class="action-btn" style="display:block; text-align:center; border-color: rgba(255,0,0,0.4); color: #ff4444;">
                [ RETURN TO TERMINAL — REGENERATE SIGNAL ]
            </a>
        `;
        node02Section.appendChild(conscriptBlock);
    }

    const navSection = node02Section.querySelector('#nav-section');
    if (navSection) node02Section.appendChild(navSection);
}

// ── MAIN INIT ─────────────────────────────────────────────────────────────────
async function init() {
    const suitId = getSuitIdFromUrl();

    const loadingState   = document.getElementById('loading-state');
    const errorState     = document.getElementById('error-state');
    const errorMsg       = document.getElementById('error-msg');
    const dossierContent = document.getElementById('dossier-content');

    updateDossierNavigator('loading');

    if (!suitId) {
        loadingState.classList.add('hidden');
        errorMsg.innerText = '[NO_IDENTIFIER]: Navigate to APEreaction.com/suit/[YOUR-SS-ID] to access your dossier.';
        errorState.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch(`/api/suit/${encodeURIComponent(suitId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const wpTotal       = data.wp_total || 0;
        const pathStatus    = data.path_status || 'PENDING';
        const milestonesHit = data.milestones_hit || [];
        const isPathA       = pathStatus === 'PATH_A';
        const hasDraft      = data.draft_account || null;

        loadingState.classList.add('hidden');
        populateDossier(data, suitId, milestonesHit);

        // Set dossier navigator based on status
        if (wpTotal >= 100 && isPathA) {
            updateDossierNavigator('elite');
        } else if (wpTotal >= 100 && !isPathA) {
            updateDossierNavigator('conscript');
        } else {
            updateDossierNavigator('incomplete');
        }
        // Note: source_pending / schematic_revealed states only triggered
        // inside initProjectBlue which is gated to PATH_A + WP >= 100

        // Gate Phase 04 — only show for PATH_A with WP >= 100
        const transcriptSection = document.getElementById('transcript-section');
        if (isPathA && wpTotal >= 100) {
            initProjectBlue(suitId, isPathA, hasDraft);
        } else {
            // Hide Phase 04 entirely for incomplete or PATH_B sessions
            if (transcriptSection) transcriptSection.classList.add('hidden');
            // Show appropriate message instead
            const incompleteMsg = document.getElementById('incomplete-message');
            if (incompleteMsg) incompleteMsg.classList.remove('hidden');
        }

        // Gate Phase 05 — only show for PATH_A with WP >= 100
        const node02Section = document.getElementById('node02-section');
        if (isPathA && wpTotal >= 100) {
            initNode02(suitId, wpTotal, pathStatus);
        } else {
            if (node02Section) node02Section.classList.add('hidden');
        }

        dossierContent.classList.remove('hidden');

    } catch (err) {
        loadingState.classList.add('hidden');
        errorMsg.innerText = `[ARCHIVE_FAILURE]: Specimen ${suitId} not found.`;
        errorState.classList.remove('hidden');
        console.error('Dossier load error:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
