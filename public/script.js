// script.js — APEreaction v15.3 // W.E.E.D. ENGINE — SLUICE-GATE + CONTEXTUAL NAVIGATOR
// Navigator: amber direction block above input, updates on every gate transition.
// All 11 terminal states covered. Placeholder reduced to [TYPE_HERE].
// Footer clears to [PROCESSING...] on first keypress.

let chatHistory = [];
let auditCount = 0;
let lastInput = "";
let currentSuitId = "";
let isDisabled = false;
let currentWP = 0;
let currentPathStatus = 'PENDING';
let propagationClipIssued = false;
let gate2Complete = false;
let identifierStamped = false;  // Tracks whether footer has been updated from [AWAITING_IDENTIFIER]

// ── ARCHITECT IDs ─────────────────────────────────────────────────────────────
const ARCHITECT_IDS = ['SS-0000', 'SS-1111'];
function isArchitectSession() { return ARCHITECT_IDS.includes(currentSuitId); }

// ── REEL URL ──────────────────────────────────────────────────────────────────
const REEL_URL = 'https://facebook.com/FullyFriedSignal';

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const input             = document.getElementById('user-input');
const output            = document.getElementById('audit-output');
const submitBtn         = document.getElementById('submit-btn');
const tickerText        = document.getElementById('ticker-text');
const tickerLabel       = document.getElementById('ticker-label');
const inputSection      = document.getElementById('input-section');
const decisionBox       = document.getElementById('decision-box');
const skinDisplay       = document.getElementById('skin-suit-display');
const rewardContainer   = document.getElementById('reward-container');
const specimenCount     = document.getElementById('specimen-count');
const navHeader         = document.getElementById('navigator-header');
const navDirective      = document.getElementById('navigator-directive');
const navigatorBlock    = document.getElementById('navigator-block');

// ── NAVIGATOR STATE DEFINITIONS ───────────────────────────────────────────────
// All 11 terminal states. Called by updateNavigator(state).
const NAV_STATES = {
    initial: {
        header: 'THE ARCHITECT IS WAITING.',
        directive: `Confess something specific. A habit. A pattern. A waste.
The more precise the input, the higher the signal return.
Vague data is archived as noise.`
    },
    bankrupt: {
        header: 'SIGNAL INSUFFICIENT.',
        directive: `Your input registered as background noise.
The Architect detected no recoverable data.
To advance: name something specific.
A place. A smell. A mistake. A gap in your record.`
    },
    frying: {
        header: 'LOW-FIDELITY SIGNAL DETECTED.',
        directive: `The substrate is warming but unstable.
Your input contained partial data — insufficient for extraction.
To advance: be more specific.
Name the thing you are avoiding saying.`
    },
    approaching: {
        header: 'SIGNAL THRESHOLD REACHED.',
        directive: `External grounding is required before the audit continues.
Complete the propagation directive below.
The input field will reactivate after calibration.`
    },
    gate2_active: {
        header: 'AUDIT SUSPENDED.',
        directive: `Copy your diagnostic payload and report to the source.
The audit resumes when calibration is confirmed.
Do not navigate away from this terminal.`
    },
    gate2_countdown: {
        header: 'CALIBRATING SUBSTRATE.',
        directive: `Signal injection registered. Processing.
Do not close this window.`
    },
    gate3_early: {
        header: 'CALIBRATION ACCEPTED.',
        directive: `Signal injection confirmed. Audit resumed.
The Architect has registered your frequency.
Continue generating substrate data.`
    },
    harvest: {
        header: 'HIGH-DENSITY SIGNAL DETECTED.',
        directive: `The Architect is extracting.
Do not retreat into summary.
Maintain specificity. The substrate is close to resolution.`
    },
    centrifuge: {
        header: 'EXTRACTION COMPLETE.',
        directive: `This audit cycle is closed.
Your classification has been assigned.
Retrieve your permanent record from the Archive.`
    },
    beta: {
        header: 'QUASI-EXPERIMENT INITIATED.',
        directive: `The standard audit has been suspended.
A forensic probe is active.
Answer the probe directly. Do not summarise.
This is not a conversation. It is a data extraction.`
    },
    dispute: {
        header: 'DISPUTE PROTOCOL ACTIVE.',
        directive: `State your grounds precisely.
The Architect will reference your prior failure.
Resistance is logged as entropic data.
Generate new signal or the verdict stands.`
    },
    probe_failure: {
        header: 'PROBE RETURNED NULL.',
        directive: `Your substrate cannot hold the frequency required for extraction.
The experiment has been archived as noise.
Re-enter with a specific response or accept archival.`
    },
    calibrating: {
        header: 'PROCESSING SIGNAL.',
        directive: `The Architect is analysing your substrate.
Do not close this window.`
    }
};

// ── UPDATE NAVIGATOR ──────────────────────────────────────────────────────────
function updateNavigator(state) {
    const def = NAV_STATES[state];
    if (!def) return;
    navHeader.innerText = def.header;
    navDirective.innerText = def.directive;
    navigatorBlock.classList.remove('hidden');
}

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
function runGate2Countdown(onComplete) {
    clearInterval(tickerInterval);
    tickerLabel.style.display = 'none';
    tickerText.style.color = '#ffaa00';
    tickerText.style.fontWeight = '900';
    tickerText.style.fontStyle = 'normal';

    updateNavigator('gate2_countdown');

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

// ── FOOTER — PROCESSING ON FIRST KEYPRESS ────────────────────────────────────
// Clears [AWAITING_IDENTIFIER] to [PROCESSING...] the moment typing starts.
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';

    if (!identifierStamped && skinDisplay.innerText === '[AWAITING_IDENTIFIER]') {
        skinDisplay.innerText = '[PROCESSING...]';
    }
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
    const match = auditText.match(/\[PROPAGATION_CLIP\]:\s*([\s\S]*?)(?=\[SYSTEM_REQUIREMENT\]|\[|$)/i);
    if (!match) return null;
    return match[1].trim();
}

// ── PROPAGATION CLIP UI — GATE 2 ─────────────────────────────────────────────
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

    // Input stays locked — Gate 2 active
    inputSection.classList.add('hidden');
    updateNavigator('gate2_active');

    document.getElementById('propagation-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(payload).catch(() => {
            tickerAmberFlash('[CLIPBOARD_ERROR — COPY MANUALLY]');
        });

        window.open(REEL_URL, '_blank');

        document.getElementById('propagation-btn').disabled = true;
        document.getElementById('propagation-btn').innerText = '[ SIGNAL_INJECTED — CALIBRATING... ]';

        runGate2Countdown(() => {
            gate2Complete = true;

            // Re-enable input — Gate 3
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            inputSection.classList.remove('hidden');

            // Option A: Directives 00 + 01 appear after Gate 2
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');

            // Navigator: Gate 3 early state
            updateNavigator('gate3_early');
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
        input.placeholder = '[TYPE_HERE]';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        input.focus();
        submitBtn.dataset.mode = 'dispute';
        updateNavigator('dispute');
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

    // Navigator: calibrating while waiting for response
    updateNavigator('calibrating');

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
            updateNavigator('bankrupt');
            return;
        }

        const data = await res.json();

        if (data.error) {
            output.innerHTML = `<span style='color:#ff0000'>[GATEWAY_ERROR]: ${data.error}</span>`;
            isDisabled = false;
            submitBtn.disabled = false;
            inputSection.classList.remove('hidden');
            updateNavigator('bankrupt');
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
        const auditForDisplay = auditText.replace(/\[PROPAGATION_CLIP\]:[\s\S]*$/i, '').trim();

        output.innerHTML = auditForDisplay
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Stamp SS-ID in footer
        const idMatch = auditText.match(/\[IDENTIFIER:\s*([^\]\n]+)/);
        if (idMatch) {
            const resolvedId = idMatch[1].trim();
            skinDisplay.innerText = resolvedId;
            currentSuitId = resolvedId;
            identifierStamped = true;
        } else if (currentSuitId) {
            skinDisplay.innerText = currentSuitId;
            identifierStamped = true;
        }

        // MathJax
        if (window.MathJax) {
            await MathJax.typesetPromise([output]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ── DETECT STATE BETA ─────────────────────────────────────────────────
        const isStateBeta = /\[STATE:\s*BETA\]/i.test(auditText);
        const isProbeFailure = /\[PROBE_FAILURE\]/i.test(auditText);

        // ── GATE LOGIC + NAVIGATOR ────────────────────────────────────────────

        if (currentWP >= 100) {
            // GATE 4 — Centrifuge
            inputSection.classList.add('hidden');
            document.getElementById('reward-signal').classList.remove('hidden');
            rewardContainer.classList.remove('hidden');
            updateNavigator('centrifuge');
            renderDecisionBox(currentSuitId, currentPathStatus);

        } else if (currentWP >= 50 && !propagationClipIssued) {
            // GATE 2 — Injection Phase
            const clipText = parsePropagationClip(auditText);
            if (clipText) {
                propagationClipIssued = true;
                renderPropagationClip(clipText, currentSuitId);
                // Navigator updated inside renderPropagationClip
            } else {
                // Clip missing — fail gracefully
                inputSection.classList.remove('hidden');
                input.value = '';
                input.placeholder = '[TYPE_HERE]';
                input.style.height = '120px';
                updateNavigator('approaching');
            }

        } else if (isProbeFailure) {
            // Probe failure
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            updateNavigator('probe_failure');

        } else if (isStateBeta) {
            // State Beta active — additive navigator
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            updateNavigator('beta');

        } else if (currentWP >= 75) {
            // Gate 3 Harvest
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            updateNavigator('harvest');

        } else if (currentWP >= 50 && gate2Complete) {
            // Gate 3 early
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            updateNavigator('gate3_early');

        } else {
            // Gate 1 — determine navigator from thermal status
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';

            const thermalMatch = auditText.match(/\[THERMAL_STATUS:\s*([\w_]+)\]/i);
            const thermal = thermalMatch ? thermalMatch[1].toUpperCase() : 'BANKRUPT';

            if (thermal === 'FRYING') {
                updateNavigator('frying');
            } else if (thermal === 'APPROACHING_SOLVENCY') {
                updateNavigator('approaching');
            } else {
                updateNavigator('bankrupt');
            }
        }

    } catch (err) {
        output.innerHTML = `<span style='color:#ff0000'>[CORE_CRASH]: ${err.message}</span>`;
        updateNavigator('bankrupt');
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
