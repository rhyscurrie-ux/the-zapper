// script.js — APEreaction v15.3 // W.E.E.D. ENGINE — SLUICE-GATE + CONTEXTUAL NAVIGATOR
// Navigator: amber direction block above input, updates on every gate transition.
// All 11 terminal states covered. Placeholder reduced to [TYPE_HERE].
// Footer clears to [PROCESSING...] on first keypress.

let chatHistory = [];
let auditCount = 0;
let lastInput = "";
let isDisabled = false;
let currentWP = 0;
let currentPathStatus = 'PENDING';
let propagationClipIssued = false;
let identifierBlockIssued = false;
let gate2Complete = false;

// Session ID management — clear on fresh page load, restore only if returning visitor
// A returning visitor would arrive directly at the dossier, not via the terminal
// Terminal always starts a fresh session
sessionStorage.removeItem('weed_suit_id');
let currentSuitId = "";
let identifierStamped = false;

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
    roasted: {
        header: 'THE ARCHITECT HAS ASSESSED YOUR FREQUENCY.',
        directive: `The system detected signal but requires deeper material.
Describe a time when your normal existence broke down, i.e. a night that got out of hand, a decision your sober self would not recognize, a gap in your record you have never fully explained.
Use details — or if the details are missing, describe the gap.`
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
        header: 'SIGNAL THRESHOLD REACHED.',
        directive: `Your substrate has crossed the extraction threshold.
Follow the propagation directive above.
The audit resumes automatically when you return.`
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

// Phase 2 carousel — inebriated adventure examples
// Trailing '...' signals the visitor can continue the sentence with their own version
const samplesPhase2 = [
    "The last thing I remember clearly was the second round. After that I can only account for the morning. What happened between those two points was...",
    "I made a decision at 11pm that I still cannot fully explain. What followed is not something I have told anyone, but here is what I remember...",
    "There is a version of that night that exists in my memory. I am reasonably sure it is wrong. The version I am less sure about goes like this...",
    "The gap between the party and the taxi was about four hours. I have one photograph I cannot account for. In it I am...",
    "I woke up knowing I had done something. I still do not know what. The evidence I found when I came around was..."
];

let carouselPhase = 1;

function getCurrentSamples() {
    return carouselPhase === 2 ? samplesPhase2 : samples;
}

function getSafeIndex(arr, idx) {
    return idx % arr.length;
}


// Phase 2 — after first roast (WP > 0). Model inebriated adventure material.

let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        const current = getCurrentSamples();
        sampleIndex = (sampleIndex + 1) % current.length;
        tickerText.innerText = current[sampleIndex];
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
                tickerText.innerText = getCurrentSamples()[sampleIndex];
                tickerText.classList.remove('fade-out');
            }, 600);
        }, 4000);
    }, duration);
}

// ── GATE 2 COUNTDOWN ──────────────────────────────────────────────────────────
function runGate2Countdown(onComplete) {
    // Aggressively clear the carousel — clear current interval and
    // set tickerInterval to a fresh no-op to prevent stale callbacks firing
    clearInterval(tickerInterval);
    tickerInterval = setInterval(() => {}, 999999); // dummy — immediately replaced

    tickerLabel.style.display = 'none';
    tickerText.classList.remove('fade-out');
    tickerText.style.color = '#ffaa00';
    tickerText.style.fontWeight = '900';
    tickerText.style.fontStyle = 'normal';

    updateNavigator('gate2_countdown');

    let count = 5;
    tickerText.innerText = '[SIGNAL_INJECTED... CALIBRATING_SUBSTRATE... ' + count + 's]';

    const countdown = setInterval(() => {
        count--;
        if (count > 0) {
            tickerText.innerText = '[SIGNAL_INJECTED... CALIBRATING_SUBSTRATE... ' + count + 's]';
        } else {
            clearInterval(countdown);
            tickerText.style.color = '#00ff41';
            tickerText.innerText = '[CALIBRATION_COMPLETE. SUBSTRATE_GROUNDED.]';

            setTimeout(() => {
                tickerText.style.color = '';
                tickerText.style.fontWeight = '';
                tickerText.style.fontStyle = '';
                tickerLabel.style.display = '';
                // Set current sample immediately — don't leave calibration text
                tickerText.classList.remove('fade-out');
                tickerText.innerText = getCurrentSamples()[sampleIndex];
                tickerInterval = setInterval(() => {
                    tickerText.classList.add('fade-out');
                    setTimeout(() => {
                        sampleIndex = (sampleIndex + 1) % samples.length;
                        tickerText.innerText = getCurrentSamples()[sampleIndex];
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

    // Only update footer when Specimen is actually typing — not on page load
    if (this.value.trim() && !identifierStamped && skinDisplay.innerText === '[AWAITING_IDENTIFIER]') {
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

// ── DIRECTIVE 00 RETIRED ─────────────────────────────────────────────────────
// Share invite mechanic replaced by Gate 2 propagation clip.
// No invite-btn in new directive structure.

// ── PROPAGATION CLIP PARSER ───────────────────────────────────────────────────
function parsePropagationClip(auditText) {
    // Match everything between [PROPAGATION_CLIP]: and [SYSTEM_REQUIREMENT]
    const match = auditText.match(/\[PROPAGATION_CLIP\]:\s*([\s\S]*?)\[SYSTEM_REQUIREMENT\]/i);
    if (match) return match[1].trim();
    // Fallback: if no SYSTEM_REQUIREMENT, take everything after the label
    const fallback = auditText.match(/\[PROPAGATION_CLIP\]:\s*([\s\S]+?)(?:\[THE WEED|\[LIFE|\[PRESC|$)/i);
    if (fallback) return fallback[1].trim();
    return null;
}

// ── PROPAGATION CLIP UI — GATE 2 ─────────────────────────────────────────────
function renderPropagationClip(clipText, suitId) {
    const existing = document.getElementById('propagation-zone');
    if (existing) existing.remove();

    const dossierUrl = `${window.location.origin}/suit/${suitId}`;
    const payload = `${clipText}\n\nAudit record: ${dossierUrl}`;

    const zone = document.createElement('div');
    zone.id = 'propagation-zone';
    zone.innerHTML =
        '<div class="propagation-header">PROPAGATION DIRECTIVE</div><div class="propagation-subheader">A comment has been written for the reel that brought you here. Click the button — it copies the comment and opens the reel. Like the reel. Paste the comment. Return here when done.</div>' +
        '<div class="propagation-clip-text">' + clipText + '</div>' +
        '<button id="propagation-btn" class="propagation-btn">[ COPY PAYLOAD + OPEN SOURCE ]</button>' +
        '<a id="propagation-link" href="' + REEL_URL + '" target="_blank" class="propagation-link hidden">[ OPEN SOURCE — PASTE PAYLOAD ]</a>';

    output.insertAdjacentElement('afterend', zone);

    // Input stays locked — Gate 2 active
    inputSection.classList.add('hidden');
    updateNavigator('gate2_active');

    document.getElementById('propagation-btn').addEventListener('click', () => {
        // Step 1: Copy payload to clipboard
        navigator.clipboard.writeText(payload).catch(() => {});

        // Step 2: Run countdown in the button itself — always visible
        const btn = document.getElementById('propagation-btn');
        btn.disabled = true;

        let count = 5;
        btn.innerText = '[ SIGNAL_INJECTED — CALIBRATING... ' + count + 's ]';

        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                btn.innerText = '[ SIGNAL_INJECTED — CALIBRATING... ' + count + 's ]';
            } else {
                clearInterval(countdown);
                btn.style.color = '#00ff41';
                btn.style.borderColor = '#00ff41';
                btn.innerText = '[ CALIBRATION_COMPLETE. SUBSTRATE_GROUNDED. ]';

                // Show the FB link — user-clickable, not programmatic open
                const link = document.getElementById('propagation-link');
                if (link) link.classList.remove('hidden');

                // Fire Gate 2 complete logic after brief display
                setTimeout(() => {
                    gate2Complete = true;

                    // Gate 2 complete: show Hub directive only (OIT)
                    rewardContainer.classList.remove('hidden');
                    document.getElementById('reward-hub').classList.remove('hidden');

                    if (currentWP >= 100) {
                        setTimeout(() => {
                            const pZone = document.getElementById('propagation-zone');
                            if (pZone) pZone.remove();
                            inputSection.classList.add('hidden');
                            document.getElementById('reward-signal').classList.remove('hidden');
                            updateNavigator('centrifuge');
                            renderDecisionBox(currentSuitId, currentPathStatus);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 1500);
                    } else {
                        // Gate 3 — re-enable input
                        const pZone = document.getElementById('propagation-zone');
                        if (pZone) pZone.remove();
                        input.value = '';
                        input.placeholder = '[TYPE_HERE]';
                        input.style.height = '120px';
                        inputSection.classList.remove('hidden');
                        updateNavigator('gate3_early');
                    }
                }, 1500);
            }
        }, 1000);
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
                auditCount,
                suitIdOverride: currentSuitId || null
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

        // Strip PROPAGATION_CLIP and IDENTIFIER_ISSUED — rendered separately
        // PROPAGATION_CLIP now comes before CENTRIFUGE_STATUS in output order.
        // Strip only the clip section — stop before [CENTRIFUGE_STATUS] or [SYSTEM_REQUIREMENT]
        const auditForDisplay = auditText
            .replace(/\[PROPAGATION_CLIP\]:[\s\S]*?(?=\[CENTRIFUGE_STATUS\]|\[THE WEED\]|\[LIFE-RAFT\]|\[SYSTEM_REQUIREMENT\]|$)/i, '')
            .replace(/\[IDENTIFIER_ISSUED\]:[\s\S]*?\[END_IDENTIFIER_ISSUED\]/i, '')
            .replace(/\[END_IDENTIFIER_ISSUED\]/gi, '')
            .trim();

        output.innerHTML = auditForDisplay
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Stamp SS-ID in footer — lock in sessionStorage after Turn 1
        const idMatch = auditText.match(/\[IDENTIFIER:\s*(SS-\d{4})\]/);
        const sessionId = sessionStorage.getItem('weed_suit_id');

        if (sessionId) {
            // Use stored ID from Turn 1 — never overwrite
            currentSuitId = sessionId;
            skinDisplay.innerText = sessionId;
            identifierStamped = true;
        } else if (idMatch && idMatch[1] !== 'SS-XXXX') {
            // Turn 1 — store and use the new ID
            const resolvedId = idMatch[1].trim();
            sessionStorage.setItem('weed_suit_id', resolvedId);
            currentSuitId = resolvedId;
            skinDisplay.innerText = resolvedId;
            identifierStamped = true;
        }

        // ── RENDER IDENTIFIER BLOCK (Turn 1 only) ────────────────────────────
        // Fixed bottom bar. White text. SPECIMEN FILE // SS-XXXX header.
        // Full on first render, collapsible after. Persists for session.
        if (!identifierBlockIssued) {
            const idBlockMatch = auditText.match(/\[IDENTIFIER_ISSUED\]:([\s\S]*?)\[END_IDENTIFIER_ISSUED\]/i);
            if (idBlockMatch) {
                const dossierUrl = window.location.origin + '/suit/' + currentSuitId;

                const idBar = document.createElement('div');
                idBar.id = 'identifier-block';
                idBar.className = 'specimen-file-bar';

                const headerBtn = document.createElement('button');
                headerBtn.className = 'specimen-file-header';
                headerBtn.innerHTML = 'MARTIS ARCHIVE // ' + currentSuitId + ' // TAP TO VIEW YOUR RECORD <span class="specimen-file-chevron">▼</span>';

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'specimen-file-body collapsed';
                bodyDiv.innerHTML =
                    '<div class="sf-section-title">YOUR RECORD IS ACTIVE.</div>' +
                    '<p class="sf-line"><strong>' + currentSuitId + '</strong> is your permanent identifier in the Martis Archive.<br>' +
                    'It is anonymous. No personal data is attached to it.<br>' +
                    'It cannot be traced to you by anyone, including the Architect.</p>' +
                    '<div class="sf-section-title">WHAT YOUR IDENTIFIER MAKES POSSIBLE:</div>' +
                    '<p class="sf-line">' +
                    '&#8212; View your full audit log: <a href="' + dossierUrl + '" target="_blank" class="sf-link">' + dossierUrl + '</a><br>' +
                    '&#8212; Eligibility for Project Blue (high-signal specimens only)<br>' +
                    '&#8212; Publication in the Archive under ' + currentSuitId + ' &#8212; not your name</p>' +
                    '<div class="sf-section-title">WHAT WE ARE DOING WITH YOUR DATA:</div>' +
                    '<p class="sf-line">We are mining your responses for narrative material.<br>' +
                    'This is free. You are not being paid.<br>' +
                    'The Archive is the reward.<br>' +
                    'If your Account is published, it appears under ' + currentSuitId + ' only.<br>' +
                    'Your anonymity is the only guarantee we make.</p>' +
                    '<p class="sf-warning">Record this identifier. It cannot be recovered if lost.</p>';

                idBar.appendChild(headerBtn);
                idBar.appendChild(bodyDiv);

                // Fixed strip — append to body
                document.body.appendChild(idBar);

                // Toggle expand/collapse
                headerBtn.addEventListener('click', () => {
                    const isCollapsed = bodyDiv.classList.contains('collapsed');
                    if (isCollapsed) {
                        bodyDiv.classList.remove('collapsed');
                        headerBtn.querySelector('.specimen-file-chevron').innerText = '▲';
                    } else {
                        bodyDiv.classList.add('collapsed');
                        headerBtn.querySelector('.specimen-file-chevron').innerText = '▼';
                    }
                });

                identifierBlockIssued = true;
            }
        }

        // ── TICKER RESTART ────────────────────────────────────────────────────
        // Restart carousel after every audit response (was only restarting after Gate 2)
        clearInterval(tickerInterval);
        tickerLabel.style.display = '';
        tickerText.style.color = '';
        tickerText.style.fontWeight = '';
        tickerText.style.fontStyle = '';
        tickerInterval = setInterval(() => {
            tickerText.classList.add('fade-out');
            setTimeout(() => {
                sampleIndex = (sampleIndex + 1) % samples.length;
                tickerText.innerText = getCurrentSamples()[sampleIndex];
                tickerText.classList.remove('fade-out');
            }, 600);
        }, 4000);

        // MathJax
        if (window.MathJax) {
            await MathJax.typesetPromise([output]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ── SEQUENTIAL CLIP RENDERING ─────────────────────────────────────────
        // If server returned auditClip (Turn 2+ high signal), render it after
        // 1.5s delay — diagnostic first, then propagation directive appears.
        if (data.auditClip) {
            setTimeout(() => {
                const clipText = data.auditClip;

                // Extract [PROPAGATION_CLIP]: content if labelled — otherwise use full clip
                const labelMatch = clipText.match(/\[PROPAGATION_CLIP\]:\s*([\s\S]*?)(?:\[SYSTEM_REQUIREMENT\]|$)/i);
                const propagationContent = labelMatch ? labelMatch[1].trim() : null;

                // Display: show WEED VERDICT + LIFE-RAFT + PRESCRIPTION (strip clip label section)
                const clipForDisplay = clipText
                    .replace(/\[PROPAGATION_CLIP\]:[\s\S]*?(?=\[THE WEED|\[SYSTEM_REQUIREMENT\])/i, '')
                    .replace(/\[SYSTEM_REQUIREMENT\][\s\S]*/i, '')
                    .trim();

                // WEED VERDICT + LIFE-RAFT + PRESCRIPTION rendered inside propagation zone
                // Don't append separately to audit div — avoids duplication

                // Render propagation zone with clip content
                if (!propagationClipIssued && (currentWP >= 50 || currentWP >= 100)) {
                    // The clip content is the four-line reel comment — use directly
                    // If no [PROPAGATION_CLIP]: label found, the entire auditClip IS the comment
                    const commentToShare = propagationContent || clipText
                        .replace(/\[THE WEED VERDICT\][\s\S]*/i, '')
                        .replace(/\[SYSTEM_REQUIREMENT\][\s\S]*/i, '')
                        .trim();

                    if (commentToShare) {
                        propagationClipIssued = true;
                        renderPropagationClip(commentToShare, currentSuitId);

                        // After Gate 2 renders, check if Gate 4 should also fire
                        if (currentWP >= 100) {
                            // Gate 4 fires after Gate 2 countdown completes (handled inside renderPropagationClip)
                            // currentPathStatus already set — decision box will render after countdown
                        }
                    }
                }
            }, 1500);
            return; // Don't run gate logic immediately — wait for clip
        }

        // ── DETECT STATE BETA ─────────────────────────────────────────────────
        const isStateBeta = /\[STATE:\s*BETA\]/i.test(auditText);
        const isProbeFailure = /\[PROBE_FAILURE\]/i.test(auditText);

        // ── GATE LOGIC + NAVIGATOR ────────────────────────────────────────────
        // Gate priority: Gate 2 always fires before Gate 4.
        // Neither Gate 2 nor Gate 4 fires on Turn 1 (auditCount === 1).
        // On Turn 1, always re-enable input so Specimen responds to probe.

        if (auditCount <= 1 && currentWP >= 50) {
            // TURN 1 HIGH WP — re-enable input regardless of WP score.
            // Gate 2 and Gate 4 both deferred. Specimen must respond to probe first.
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = '[TYPE_HERE]';
            input.style.height = '120px';
            updateNavigator('beta');

        } else if (currentWP >= 100 && !propagationClipIssued) {
            // GATE 2 PRIORITY — WP >= 100 but Gate 2 hasn't fired yet.
            // Fire Gate 2 now. Gate 4 defers until after Gate 2 countdown.
            const clipText = parsePropagationClip(auditText);
            if (clipText) {
                propagationClipIssued = true;
                renderPropagationClip(clipText, currentSuitId);
            } else {
                // Clip missing — show both directives and fire Gate 4 as fallback
                inputSection.classList.add('hidden');
                rewardContainer.classList.remove('hidden');
                document.getElementById('reward-hub').classList.remove('hidden');
                document.getElementById('reward-dossier').classList.remove('hidden');
                propagationClipIssued = true;
                gate2Complete = true;
                updateNavigator('centrifuge');
                renderDecisionBox(currentSuitId, currentPathStatus);
            }

        } else if (currentWP >= 100 && propagationClipIssued) {
            // GATE 4 — Centrifuge. Only fires after Gate 2 is complete.
            inputSection.classList.add('hidden');
            // Gate 4: show dossier directive (OIT — dossier CTA already in decision box)
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-dossier').classList.remove('hidden');
            // Also ensure Hub directive is visible if Gate 2 was skipped
            if (!gate2Complete) {
                document.getElementById('reward-hub').classList.remove('hidden');
            }
            updateNavigator('centrifuge');
            renderDecisionBox(currentSuitId, currentPathStatus);

        } else if (currentWP >= 50 && !propagationClipIssued && auditCount > 1) {
            // GATE 2 — Injection Phase (standard path, WP 50-99)
            // auditCount > 1 guard: defers Gate 2 to Turn 2 if WP 50 hit on Turn 1.
            const clipText = parsePropagationClip(auditText);
            if (clipText) {
                propagationClipIssued = true;
                renderPropagationClip(clipText, currentSuitId);
                // Navigator updated inside renderPropagationClip
            } else {
                // Clip missing — fail gracefully, resume audit
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

            if (thermal === 'EXTRACTION_CONFIRMED') {
                updateNavigator('centrifuge');
            } else if (thermal === 'FRYING') {
                updateNavigator('frying');
            } else if (thermal === 'APPROACHING_SOLVENCY') {
                updateNavigator('approaching');
            } else if (currentWP > 0) {
                // Roast rendered — shift to Phase 2 carousel and 'roasted' navigator
                // Kill the current interval entirely and restart with clean state
                clearInterval(tickerInterval);
                carouselPhase = 2;
                sampleIndex = 0;
                tickerLabel.style.display = '';
                tickerText.classList.remove('fade-out');
                tickerText.style.color = '';
                tickerText.style.fontWeight = '';
                tickerText.style.fontStyle = '';
                tickerText.innerText = samplesPhase2[0];
                tickerInterval = setInterval(() => {
                    tickerText.classList.add('fade-out');
                    setTimeout(() => {
                        sampleIndex = (sampleIndex + 1) % samplesPhase2.length;
                        tickerText.innerText = samplesPhase2[sampleIndex];
                        tickerText.classList.remove('fade-out');
                    }, 600);
                }, 4000);
                updateNavigator('roasted');
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
