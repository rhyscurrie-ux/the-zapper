// script.js — APEreaction v15.3 // W.E.E.D. ENGINE — SLUICE-GATE PROTOCOL
// OIT (One-Instruction-at-a-Time) architecture.
// Gate 2: Input locks at WP 50, 5-second countdown, re-enables after injection.
// Directive drip: Option A — 00+01 after Gate 2, 02+03 at Centrifuge.

let chatHistory = [];
let auditCount = 0;
let lastInput = "";
let currentSuitId = "";
let isDisabled = false;
let currentWP = 0;
let currentPathStatus = 'PENDING';
let propagationClipIssued = false;  // Gate 2 fires once per session
let gate2Complete = false;          // Tracks whether Gate 2 countdown has finished

// ── ARCHITECT IDs — ZERO-LATENCY RENDERING ────────────────────────────────────
const ARCHITECT_IDS = ['SS-0000', 'SS-1111'];

function isArchitectSession() {
    return ARCHITECT_IDS.includes(currentSuitId);
}

// ── REEL URL — UPDATE PER CAMPAIGN ───────────────────────────────────────────
const REEL_URL = 'https://facebook.com/FullyFriedSignal';

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const input           = document.getElementById('user-input');
const output          = document.getElementById('audit-output');
const submitBtn       = document.getElementById('submit-btn');
const tickerText      = document.getElementById('ticker-text');
const tickerLabel     = document.getElementById('ticker-label');
const inputSection    = document.getElementById('input-section');
const decisionBox     = document.getElementById('decision-box');
const skinDisplay     = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const specimenCount   = document.getElementById('specimen-count');

// ── SPECIMEN COUNT ────────────────────────────────────────────────────────────
async function loadCount() {
    try {
        const res = await fetch('/api/count');
        const data = await res.json();
        specimenCount.innerText = `[ ${data.count} SPECIMENS PROCESSED ]`;
    } catch {
        specimenCount.innerText = '[ ARCHIVE ONLINE ]';
    }
}
loadCount();

// ── TICKER ENGINE ─────────────────────────────────────────────────────────────
const samples = [
    '"I spent four hours yesterday scrolling through people I don\'t like, living lives I don\'t want."',
    '"I have spent 15 years \'waiting for the right time\' to start the only project that matters."',
    '"I measure my worth in notifications from an algorithm that doesn\'t know my name."',
    '"I have 42 \'saved\' videos on how to be productive, yet I haven\'t produced anything in months."',
    '"My social mask is so thick I\'ve forgotten which side of the glass I\'m standing on."',
    '"I\'m just a biological placeholder for a version of myself that never arrived."'
];

let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 600);
}, 4000);

// ── TICKER AMBER FLASH ────────────────────────────────────────────────────────
// Standard 3-second amber flash for clipboard confirmation.
function tickerAmberFlash(message, duration = 3000) {
    clearInterval(tickerInterval);
    tickerLabel.style.display = 'none';
    tickerText.classList.remove('fade-out');
    tickerText.style.color = '#ffaa00';
    tickerText.style.fontWeight = '900';
    tickerText.style.fontStyle = 'normal';
    tickerText.innerText = message;

    setTimeout(() => {
        tickerText.style.color = '';
        tickerText.style.fontWeight = '';
        tickerText.style.fontStyle = '';
        tickerLabel.style.display = '';
        tickerInterval = setInterval(() => {
            tickerText.classList.add('fade-out');
            setTimeout(() => {
                sampleIndex = (sampleIndex + 1) % samples.length;
                tickerText.innerText = samples[sampleIndex];
                tickerText.classList.remove('fade-out');
            }, 600);
        }, 4000);
    }, duration);
}

// ── GATE 2 COUNTDOWN ──────────────────────────────────────────────────────────
// 5-second countdown in ticker after payload copy.
// Runs: [SIGNAL_INJECTED... CALIBRATING_SUBSTRATE... 5s] → 4s → 3s → 2s → 1s
// Then unlocks input with Gate 3 placeholder and reveals Directives 00 + 01.
function runGate2Countdown(onComplete) {
    clearInterval(tickerInterval);
    tickerLabel.style.display = 'none';
    tickerText.style.color = '#ffaa00';
    tickerText.style.fontWeight = '900';
    tickerText.style.fontStyle = 'normal';

    let count = 5;
    tickerText.innerText = `[SIGNAL_INJECTED... CALIBRATING_SUBSTRATE... ${count}s]`;

    const countdown = setInterval(() => {
        count--;
        if (count > 0) {
            tickerText.innerText = `[SIGNAL_INJECTED... CALIBRATING_SUBSTRATE... ${count}s]`;
        } else {
            clearInterval(countdown);
            tickerText.style.color = '#00ff41';
            tickerText.innerText = '[CALIBRATION_COMPLETE. SUBSTRATE_GROUNDED.]';

            setTimeout(() => {
                // Reset ticker
                tickerText.style.color = '';
                tickerText.style.fontWeight = '';
                tickerText.style.fontStyle = '';
                tickerLabel.style.display = '';
                tickerInterval = setInterval(() => {
                    tickerText.classList.add('fade-out');
                    setTimeout(() => {
                        sampleIndex = (sampleIndex + 1) % samples.length;
                        tickerText.innerText = samples[sampleIndex];
                        tickerText.classList.remove('fade-out');
                    }, 600);
                }, 4000);

                onComplete();
            }, 1000);
        }
    }, 1000);
}

// ── ELASTIC VOID ──────────────────────────────────────────────────────────────
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// ── DIRECTIVE EXPANSION ───────────────────────────────────────────────────────
document.querySelectorAll('.reward-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        if (e.target.classList.contains('proceed-link')) return;
        const info = this.querySelector('.directive-info');
        if (info) {
            document.querySelectorAll('.directive-info').forEach(d => d.classList.remove('expanded'));
            info.classList.toggle('expanded');
        }
    });
});

// ── SHARE / DIRECTIVE 00 ──────────────────────────────────────────────────────
document.getElementById('invite-btn').addEventListener('click', async () => {
    const id = skinDisplay.innerText || 'UNKNOWN_SPECIMEN';
    const shareData = {
        title: 'MARTIS PROGRAM // PROXIMITY AUDIT',
        text: `I failed my W.E.E.D. audit at APEreaction.com. I have been identified as ${id}. I am sending you this to reverse my ENTROPIC SPIRALLING and offload some shame. The Architect is waiting for you.`,
        url: 'https://apereaction.com'
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            tickerAmberFlash('[INVITATION_COPIED_TO_CLIPBOARD]');
        }
    } catch (err) {
        console.log('Share failed:', err);
    }
});

// ── PROPAGATION CLIP PARSER ───────────────────────────────────────────────────
function parsePropagationClip(auditText) {
    const match = auditText.match(/\[PROPAGATION_CLIP\]:\s*([\s\S]*?)(?=\[|$)/i);
    if (!match) return null;
    return match[1].trim();
}

// ── PROPAGATION CLIP UI — GATE 2 ─────────────────────────────────────────────
// Renders propagation zone. Input stays LOCKED until 5s countdown completes.
// After countdown: input re-enables, Directives 00 + 01 appear (Option A drip).
function renderPropagationClip(clipText, suitId) {
    const existing = document.getElementById('propagation-zone');
    if (existing) existing.remove();

    const dossierUrl = `${window.location.origin}/suit/${suitId}`;
    const payload = `${clipText}\n\nAudit record: ${dossierUrl}`;

    const zone = document.createElement('div');
    zone.id = 'propagation-zone';
    zone.innerHTML = `
        <div class="propagation-header">
            SUBSTRATE PROPAGATION REQUIRED // RE-ENTRY LOOP
        </div>
        <div class="propagation-clip-text">${clipText}</div>
        <button id="propagation-btn" class="propagation-btn">
            [ COPY PAYLOAD + OPEN SOURCE ]
        </button>
    `;

    output.insertAdjacentElement('afterend', zone);

    // Input is already hidden (locked at Gate 2) — stays hidden until countdown ends
    inputSection.classList.add('hidden');

    document.getElementById('propagation-btn').addEventListener('click', () => {
        // Copy to clipboard
        navigator.clipboard.writeText(payload).catch(() => {});

        // Open reel in new tab
        window.open(REEL_URL, '_blank');

        // Disable button immediately to prevent double-click
        document.getElementById('propagation-btn').disabled = true;
        document.getElementById('propagation-btn').innerText = '[ SIGNAL_INJECTED — CALIBRATING... ]';

        // Run 5-second countdown in ticker
        runGate2Countdown(() => {
            // Gate 2 complete — unlock Gate 3
            gate2Complete = true;

            // Re-enable input with Gate 3 placeholder
            input.value = '';
            input.placeholder = 'SIGNAL INJECTION REGISTERED. RESUME AUDIT.';
            input.style.height = '120px';
            inputSection.classList.remove('hidden');

            // Option A: Directives 00 + 01 appear after Gate 2 completes
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');

            // Reset placeholder after first keypress
            input.addEventListener('focus', function resetPlaceholder() {
                input.placeholder = 'PROVIDE EVIDENCE OF YOUR STAGNATION...';
                input.removeEventListener('focus', resetPlaceholder);
            });
        });
    });
}

// ── DECISION BOX — PATH A / PATH B ───────────────────────────────────────────
function renderDecisionBox(suitId, pathStatus) {
    const isPathA = pathStatus === 'PATH_A';

    decisionBox.innerHTML = `
        <p class="decision-header">
            RECORD PERSISTED TO ARCHIVE &nbsp;//&nbsp;
            <span style="color:#fff; font-weight:900;">${suitId}</span>
            &nbsp;//&nbsp;
            <span style="color:${isPathA ? '#00ff41' : '#ff0000'}; font-weight:900;">
                ${isPathA ? 'PATH_A: ELITE' : 'PATH_B: CONSCRIPT'}
            </span>
        </p>
        <div class="decision-buttons">
            <a href="/suit/${suitId}" class="reward-btn dossier-link" style="text-decoration:none; text-align:center; display:block;">
                [ ACCESS SPECIMEN DOSSIER ]
            </a>
            <button id="btn-dispute" class="reward-btn">
                [ DISPUTE_FINDINGS ]
            </button>
        </div>
    `;

    document.getElementById('btn-dispute').addEventListener('click', () => {
        decisionBox.classList.add('hidden');
        inputSection.classList.remove('hidden');
        input.value = '';
        input.style.height = '120px';
        input.placeholder = 'STATE YOUR GROUNDS...';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        input.focus();
        submitBtn.dataset.mode = 'dispute';
    });

    decisionBox.classList.remove('hidden');
}

// ── CORE AUDIT FUNCTION ───────────────────────────────────────────────────────
async function runAudit(type = 'standard') {
    if (isDisabled) return;

    if (type === 'standard') {
        if (!input.value.trim()) return;
        lastInput = input.value.trim();
    }

    isDisabled = true;
    submitBtn.disabled = true;
    clearInterval(tickerInterval);
    inputSection.classList.add('hidden');
    decisionBox.classList.add('hidden');

    const existingZone = document.getElementById('propagation-zone');
    if (existingZone) existingZone.remove();

    if (!isArchitectSession()) {
        output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    }

    const isDispute = (type === 'dispute') || (submitBtn.dataset.mode === 'dispute');
    submitBtn.dataset.mode = 'standard';

    const userPayload = isDispute
        ? `[DISPUTE_PROTOCOL]: ${lastInput}`
        : lastInput;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: userPayload,
                history: chatHistory,
                isDispute,
                auditCount
            })
        });

        if (res.status === 429) {
            output.innerHTML = "<span style='color:#ff0000'>[THERMAL_OVERLOAD]: Too many specimens. Retry in 60 seconds.</span>";
            isDisabled = false;
            submitBtn.disabled = false;
            inputSection.classList.remove('hidden');
            return;
        }

        const data = await res.json();

        if (data.error) {
            output.innerHTML = `<span style='color:#ff0000'>[GATEWAY_ERROR]: ${data.error}</span>`;
            isDisabled = false;
            submitBtn.disabled = false;
            inputSection.classList.remove('hidden');
            return;
        }

        chatHistory = data.history || chatHistory;
        auditCount++;
        if (data.suitId) currentSuitId = data.suitId;
        if (data.pathStatus) currentPathStatus = data.pathStatus;

        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/i);
        if (wpMatch) currentWP = parseInt(wpMatch[1], 10);

        // ── RENDER AUDIT OUTPUT ───────────────────────────────────────────────
        const auditText = data.audit || '[SYSTEM_SILENCE]';

        // Strip [PROPAGATION_CLIP] from display — rendered separately
        const auditForDisplay = auditText.replace(/\[PROPAGATION_CLIP\]:[\s\S]*$/i, '').trim();

        output.innerHTML = auditForDisplay
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Stamp SS-ID
        const idMatch = auditText.match(/\[IDENTIFIER:\s*([^\]\n]+)/);
        if (idMatch) {
            const resolvedId = idMatch[1].trim();
            skinDisplay.innerText = resolvedId;
            currentSuitId = resolvedId;
        } else if (currentSuitId) {
            skinDisplay.innerText = currentSuitId;
        }

        // MathJax
        if (window.MathJax) {
            await MathJax.typesetPromise([output]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ── GATE LOGIC ────────────────────────────────────────────────────────

        if (currentWP >= 100) {
            // ── GATE 4: CENTRIFUGE ────────────────────────────────────────────
            // Input removed. Decision box only. Directives 02 + 03 appear.
            inputSection.classList.add('hidden');
            document.getElementById('reward-signal').classList.remove('hidden');
            rewardContainer.classList.remove('hidden');
            renderDecisionBox(currentSuitId, currentPathStatus);

        } else if (currentWP >= 50 && !propagationClipIssued) {
            // ── GATE 2: INJECTION PHASE ───────────────────────────────────────
            // Input locks. Propagation zone only. Countdown on click.
            const clipText = parsePropagationClip(auditText);
            if (clipText) {
                propagationClipIssued = true;
                // Input stays hidden — renderPropagationClip manages unlock
                renderPropagationClip(clipText, currentSuitId);
            } else {
                // Clip not generated — fail gracefully, re-enable input
                inputSection.classList.remove('hidden');
                input.value = '';
                input.placeholder = 'PROVIDE EVIDENCE OF YOUR STAGNATION...';
                input.style.height = '120px';
            }

        } else if (currentWP >= 75 && gate2Complete) {
            // ── GATE 3 MID: WP 75 — Directive drip handled in Gate 2 callback
            // Nothing extra here — directives already appeared after Gate 2
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = 'PROVIDE EVIDENCE OF YOUR STAGNATION...';
            input.style.height = '120px';

        } else {
            // ── GATE 1: AUDIT PHASE (WP 0-49) or Gate 3 continuation ─────────
            // Input active. Standard placeholder.
            decisionBox.classList.add('hidden');
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = 'PROVIDE EVIDENCE OF YOUR STAGNATION...';
            input.style.height = '120px';
        }

    } catch (err) {
        output.innerHTML = `<span style='color:#ff0000'>[CORE_CRASH]: ${err.message}</span>`;
    } finally {
        isDisabled = false;
        submitBtn.disabled = false;
    }
}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', () => {
    const mode = submitBtn.dataset.mode || 'standard';
    runAudit(mode);
});

// ── ENTER KEY ─────────────────────────────────────────────────────────────────
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
        e.preventDefault();
        submitBtn.click();
    }
});
