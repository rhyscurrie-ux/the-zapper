let chatHistory = [];
const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const tickerText = document.getElementById('ticker-text');

// --- 1. THE TURNSTILE ENGINE ---
const samples = [
    "I spent 3 hours arguing about a movie I haven't seen.",
    "I checked my fridge 4 times in 10 minutes hoping for new content.",
    "I've been scrolling through 'productivity' hacks for two hours.",
    "I watched a 15-minute video on how to wash a car I don't own.",
    "I re-read an old text thread to find a reason to be offended.",
    "I spent my lunch break looking at vacation homes I can't afford."
];
let sampleIndex = 0;

function rotateSamples() {
    tickerText.classList.add('fade-out');
    
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
        tickerText.classList.add('fade-in');
    }, 500);
}

// Rotate every 4 seconds to maintain rhythmic intimidation
setInterval(rotateSamples, 4000);

// --- 2. INPUT HANDLING ---
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
    }
});

// --- 3. THE PROXIMITY AUDIT TRIGGER ---
btn.addEventListener('click', async () => {
    const val = input.value;
    if (!val.trim()) return;
    
    output.innerHTML = "[CALIBRATING_PROXIMITY...]";
    btn.disabled = true;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory })
        });

        const data = await res.json();
        if (data.audit.startsWith("[CONNECTION_SEVERED]")) throw new Error(data.audit);

        // UI COLLAPSE: Remove the entry tools to focus on the audit
        input.style.display = 'none';
        document.getElementById('sample-ticker').style.display = 'none';
        btn.style.display = 'none';

        // RENDER AUDIT
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        chatHistory = data.history;

        // PARSE WEIGHTING POINTS (WP)
        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/);
        const wp = wpMatch ? parseInt(wpMatch[1]) : 0;

        // REVEAL GATES BASED ON DEBT STATUS
        if (wp >= 50) {
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');
        }
        if (wp >= 100) {
            document.getElementById('reward-signal').classList.remove('hidden');
        }

        // UPDATE IDENTIFIER
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        if (idMatch) skinDisplay.innerText = idMatch[1];
        
        // TRIGGER MATH RE-RENDER
        if (window.MathJax) {
            MathJax.typesetPromise([output]).catch((err) => console.log(err.message));
        }

        // SCROLL TO TOP FOR MOBILE FOCUS
        window.scrollTo(0, 0);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]: ${err.message}</span>`;
    } finally {
        btn.disabled = false;
    }
});
