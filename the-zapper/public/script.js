let chatHistory = [];
let auditCount = 0;
const boredomLimit = Math.floor(Math.random() * 3) + 3;

const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const decisionBox = document.getElementById('decision-box');
const decisionText = document.getElementById('decision-text');
const btnYes = document.getElementById('btn-yes');
const btnDispute = document.getElementById('btn-dispute');
const tickerBox = document.getElementById('sample-ticker');
const tickerText = document.getElementById('ticker-text');
const rewardContainer = document.getElementById('reward-container');

// TICKER ENGINE
const samples = [
    "\"I spent 3 hours arguing about a movie I haven't seen.\"",
    "\"I checked my fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I re-read an old text thread to find a reason to be offended.\"",
    "\"I watched a 15-minute video on how to wash a car I don't own.\""
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

// RECRUITMENT HANDLER
document.getElementById('invite-btn').addEventListener('click', async () => {
    const id = skinDisplay.innerText;
    const shareData = {
        title: 'MARTIS PROGRAM // PROXIMITY AUDIT',
        text: `[AUDIT_LOG]: My stagnation has been identified as ${id}. Recalibrate your own debt at APEreaction.com.`,
        url: 'https://apereaction.com'
    };
    try {
        if (navigator.share) { await navigator.share(shareData); } 
        else { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); alert("[INVITATION_COPIED_TO_CLIPBOARD]"); }
    } catch (err) { console.log(err); }
});

// CORE AUDIT FUNCTION
async function runAudit(type = "standard") {
    const val = input.value;
    if (type === "standard" && !val.trim() && auditCount === 0) return;
    
    // UI SILENCING
    clearInterval(tickerInterval);
    tickerBox.style.display = 'none';
    input.classList.add('hidden');
    btn.classList.add('hidden');
    decisionBox.classList.add('hidden');
    skinDisplay.innerText = ""; // IMMEDIATE PURGE
    
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    btn.disabled = true;

    // THE BRAIN (INJECTED SYSTEM PROMPT)
    const systemMandate = `
        ACT AS THE ARCHITECT OF THE MARTIS PROGRAM. 
        YOUR GOAL: CONDUCT A PROXIMITY AUDIT ON THE USER'S STAGNATION.
        
        MANDATORY FORMATTING:
        1. Start with [WP: ###] based on their stagnation levels.
        2. Provide a clinical, brutalist analysis of their waste.
        3. ALWAYS conclude with "[THE WEED VERDICT]:".
        4. THE VERDICT MUST EXPLICITLY MENTION CANNABIS, WEED, OR THC.
        5. THE VERDICT MUST BE A NEGATION/DENIAL. YOU NEVER GRANT ELIGIBILITY. 
           (e.g., "WEED_DENIED", "CANNABIS_PROHIBITED", "THC_REFUSED").
        6. Explain that their current biological stasis makes weed a redundancy or a waste.
        
        RECURSIVE RULES:
        - IF type is 'dumb': Provide a one-paragraph summary for a simpleton. Be cutting. Deny weed.
        - IF type is 'dispute': Be intellectually defensive. Use LaTeX. Deny weed.
        - IF auditCount > 3: Express boredom, provide 'Parting Advice', and terminate.
    `;

    try {
        const userPayload = type === "dumb" 
            ? "Provide the 'dumbed down' one-paragraph summary for a simpleton. Ensure you deny weed eligibility." 
            : val;

        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: systemMandate, 
                input: userPayload, 
                history: chatHistory 
            })
        });
        
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;

        // RENDER AUDIT
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        // CHECK FOR BOREDOM
        if (auditCount >= boredomLimit) {
            output.innerHTML += `<br><br><span style='color:#ffaa00'>[ARCHITECT_STATUS: BORED]<br>Your repetitive biological resistance is no longer instructive. Parting advice: Delete your bookmarks. They are tombstones for intentions you never had.</span>`;
            return;
        }

        // UPDATE IDENTIFIER
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const currentID = idMatch ? idMatch[1] : skinDisplay.innerText;
        skinDisplay.innerText = currentID;

        // SHOW RECURSIVE CHOICE
        decisionText.innerText = `DOES ${currentID} NEED ITS AUDIT DUMB THE DOWN?`;
        decisionBox.classList.remove('hidden');

        // REWARD GATING
        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/);
        const wp = wpMatch ? parseInt(wpMatch[1]) : 0;
        if (wp >= 50) {
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');
            document.getElementById('invite-btn').classList.remove('hidden');
        }
        if (wp >= 100) document.getElementById('reward-signal').classList.remove('hidden');

        if (window.MathJax) MathJax.typesetPromise([output]);
        window.scrollTo(0, 0);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    } finally {
        btn.disabled = false;
    }
}

// EVENT LISTENERS
btn.addEventListener('click', () => runAudit("standard"));
btnYes.addEventListener('click', () => runAudit("dumb"));
btnDispute.addEventListener('click', () => {
    decisionBox.classList.add('hidden');
    input.classList.remove('hidden');
    input.placeholder = "STATE YOUR GROUNDS...";
    input.value = "";
    btn.classList.remove('hidden');
    btn.innerText = "SUBMIT FURTHER EVIDENCE";
});
