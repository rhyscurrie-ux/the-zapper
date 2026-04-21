let chatHistory = [];
let auditCount = 0;

const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const submitBtn = document.getElementById('submit-btn');
const tickerText = document.getElementById('ticker-text');
const tickerBox = document.getElementById('sample-ticker');
const inputSection = document.getElementById('input-section');
const decisionBox = document.getElementById('decision-box');
const skinDisplay = document.getElementById('skin-suit-display');

// THE MUNDANE TICKER
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

// AUTO-EXPAND THE VOID
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// CORE AUDIT FUNCTION
async function runAudit(type = "standard") {
    if (type === "standard" && !input.value.trim()) return;

    // 1. Immediately clear the "Awaiting" text and hide input
    output.innerHTML = "";
    inputSection.classList.add('hidden');
    clearInterval(tickerInterval);
    
    // 2. Show loading state
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                input: input.value, 
                history: chatHistory, 
                type: type 
            })
        });
        
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;

        // 3. Render Audit Result
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        // 4. Update Identifier
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        skinDisplay.innerText = idMatch ? idMatch[1] : "UNKNOWN";

        // 5. Show Decision Loop
        decisionBox.classList.remove('hidden');

        // Trigger MathJax
        if (window.MathJax) MathJax.typesetPromise([output]);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE] // CONNECTION_LOST</span>`;
    }
}

// BINDINGS
submitBtn.onclick = () => runAudit("standard");

document.getElementById('btn-yes').onclick = () => runAudit("dumb");

document.getElementById('btn-dispute').onclick = () => {
    decisionBox.classList.add('hidden');
    inputSection.classList.remove('hidden');
    input.value = "";
    input.placeholder = "STATE YOUR GROUNDS...";
};
