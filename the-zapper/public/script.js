let chatHistory = [];
let auditCount = 0;
const boredomLimit = 6; 

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
    "\"I checked my fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I spent 3 hours arguing about a movie I haven't seen.\"",
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

// AUTO-EXPAND THE VOID
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// RECRUITMENT HANDLER (DIRECTIVE 00) - RECALIBRATED FOR MAX HUMILIATION
document.getElementById('invite-btn').addEventListener('click', async () => {
    const id = skinDisplay.innerText;
    const shareData = {
        title: 'MARTIS PROGRAM // PROXIMITY AUDIT',
        text: `I failed my W.E.E.D. audit at APEreaction.com. I've been identified as ${id}. I'm sending you this to reverse my ENTROPIC SPIRALLING and offload some shame. The Architect is waiting for you.`,
        url: 'https://apereaction.com'
    };
    try {
        if (navigator.share) { 
            await navigator.share(shareData); 
        } else { 
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); 
            alert("[INVITATION_COPIED_TO_CLIPBOARD]"); 
        }
    } catch (err) { console.log(err); }
});

// CORE AUDIT FUNCTION
async function runAudit(type = "standard") {
    const val = input.value;
    if (type === "standard" && !val.trim() && auditCount === 0) return;
    
    clearInterval(tickerInterval);
    tickerBox.style.display = 'none';
    input.classList.add('hidden');
    btn.classList.add('hidden');
    decisionBox.classList.add('hidden');
    
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    btn.disabled = true;

    const systemMandate = `
        ACT AS THE ARCHITECT UTILIZING THE WASTED_ENERGY_ENTROPIC_DECIPHERER (W.E.E.D.).
        STRICT OUTPUT SCHEMA:
        1. [WP: ###]
        2. [IDENTIFIER: (Random Hex Code)]
        3. [AUDIT_LOG // SUBJECT: (Topic)]
        4. [DECIPHERED_WASTE]: (Entropy analysis)
        5. [FORENSIC_AXIOM_LOAD]: (LaTeX Math)
        6. [THE WEED VERDICT]: (EXPLICIT DENIAL OF CANNABIS/THC. YOU NEVER GRANT ELIGIBILITY.)
        
        MANDATE:
        - NEVER prescribe substances.
        - Frame the DENIAL as a diagnostic requirement. 
        - IF auditCount == 1: Direct them to monitor Directive 01.
        - IF auditCount == 2: Direct them to watch Directive 02.
        - IF auditCount >= 3: Direct them to Decipher Directive 03.
        - IF type is 'dumb', provide ONE single, cutting, insulting paragraph.
    `;

    try {
        const userPayload = type === "dumb" 
            ? "Provide the 'dumbed down' one-paragraph summary. Explicitly deny weed eligibility." 
            : val;

        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: systemMandate, input: userPayload, history: chatHistory })
        });
        
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        if (auditCount >= boredomLimit) {
            output.innerHTML += `<br><br><span style='color:#ffaa00'>[ARCHITECT_STATUS: BORED]<br>Your repetitive biological resistance is no longer instructive. Parting advice: Go outside.</span>`;
            return;
        }

        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const currentID = idMatch ? idMatch[1] : (skinDisplay.innerText !== "[AWAITING_IDENTIFIER]" ? skinDisplay.innerText : "UNKNOWN_SPECIMEN");
        skinDisplay.innerText = currentID;

        decisionText.innerText = `DOES ${currentID} NEED ITS AUDIT DUMB_DOWN?`;
        decisionBox.classList.remove('hidden');

        // REWARD RECALIBRATION: SEQUENTIAL DIRECTIVES
        rewardContainer.classList.remove('hidden');
        if (auditCount >= 1) document.getElementById('reward-fb').classList.remove('hidden');
        if (auditCount >= 2) document.getElementById('reward-amazon').classList.remove('hidden');
        if (auditCount >= 3) document.getElementById('reward-signal').classList.remove('hidden');

        if (window.MathJax) MathJax.typesetPromise([output]);
        window.scrollTo(0, 0);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    } finally {
        btn.disabled = false;
    }
}

// DIRECTIVE EXPANSION LOGIC
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

btn.addEventListener('click', () => runAudit("standard"));
btnYes.addEventListener('click', () => runAudit("dumb"));
btnDispute.addEventListener('click', () => {
    decisionBox.classList.add('hidden');
    input.classList.remove('hidden');
    input.style.height = '120px';
    input.placeholder = "STATE YOUR GROUNDS...";
    input.value = "";
    btn.classList.remove('hidden');
    btn.innerText = "SUBMIT FURTHER EVIDENCE";
});
