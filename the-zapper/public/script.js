let chatHistory = [];
let auditCount = 0;
let lastInput = ""; // FIX 2: Prevent stale text

const boredomLimit = 6; // FIX 8: Restore Narrative Unlock

// FIX 9: Directive Roadmap
const directives = {
    1: { label: "[DIRECTIVE: RE-ESTABLISH SOCIAL HIERARCHY]", url: "https://facebook.com" },
    2: { label: "[DIRECTIVE: ACQUIRE UNNECESSARY ASSETS]", url: "https://amazon.com" },
    3: { label: "[DIRECTIVE: ENCRYPT COGNITIVE DISSENT]", url: "https://signal.org" }
};

const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const submitBtn = document.getElementById('submit-btn');
const tickerText = document.getElementById('ticker-text');
const inputSection = document.getElementById('input-section');
const decisionBox = document.getElementById('decision-box');
const skinDisplay = document.getElementById('skin-suit-display');

const samples = [
    "\"I checked the fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I keep a spreadsheet of my neighbors' cars.\"",
    "\"I haven't told anyone about the zapper.\"",
    "\"I reuse single-use plastics when no one is looking.\"",
    "\"I sometimes agree with the architect.\""
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

input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

async function runAudit(type = "standard") {
    // FIX 2: Manage text flow and audit types
    if (type === "standard") {
        if (!input.value.trim()) return;
        lastInput = input.value;
    }

    output.innerHTML = ""; 
    inputSection.classList.add('hidden');
    clearInterval(tickerInterval);
    
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // FIX 7: Client NO LONGER sends systemMandate. Just input/history/type.
            body: JSON.stringify({ 
                input: lastInput, 
                history: chatHistory, 
                type: type 
            })
        });
        
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        skinDisplay.innerText = idMatch ? idMatch[1] : "UNKNOWN";

        // FIX 8: Boredom Limit Check
        if (auditCount >= boredomLimit) {
            output.innerHTML += `<br><br><span style='color:#ffaa00'>[ARCHITECT_STATUS: BORED]<br>Biological resistance is no longer instructive.<br>COLLABORATOR STATUS CONFIRMED.<br>CC v10.7.0 is waiting at fullyfried.com.</span>`;
        }

        // FIX 9: Directive Triggering
        const dir = directives[auditCount];
        if (dir) {
            const dLink = document.getElementById('directive-link');
            const dContainer = document.getElementById('directive-container');
            dLink.innerText = dir.label;
            dLink.href = dir.url;
            dContainer.classList.remove('hidden');
        }

        decisionBox.classList.remove('hidden');
        if (window.MathJax) MathJax.typesetPromise([output]);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE] // CONNECTION_LOST</span>`;
    }
}

submitBtn.onclick = () => runAudit("standard");
document.getElementById('btn-yes').onclick = () => runAudit("dumb");

// FIX 3: Smooth scroll and focus on Dispute
document.getElementById('btn-dispute').onclick = () => {
    decisionBox.classList.add('hidden');
    inputSection.classList.remove('hidden');
    input.value = "";
    input.placeholder = "STATE YOUR GROUNDS...";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();
};
