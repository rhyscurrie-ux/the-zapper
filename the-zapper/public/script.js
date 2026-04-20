let chatHistory = [];
const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const tickerText = document.getElementById('ticker-text');
const tickerBox = document.getElementById('sample-ticker');

// TURNSTILE ENGINE
const samples = [
    "\"I spent 3 hours arguing about a movie I haven't seen.\"",
    "\"I checked my fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I watched a 15-minute video on how to wash a car I don't own.\"",
    "\"I've been scrolling through 'productivity' hacks for two hours.\""
];
let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 500);
}, 4000);

btn.addEventListener('click', async () => {
    const val = input.value;
    if (!val.trim()) return;
    
    // IMMEDIATE BLACKOUT & FLASHING AMBER STATUS
    clearInterval(tickerInterval); // Kill the background logic
    tickerBox.style.display = 'none'; // Instant visual death
    input.style.display = 'none'; 
    btn.style.display = 'none';
    
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    btn.disabled = true;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory })
        });

        const data = await res.json();
        
        // RENDER FINAL AUDIT (Removes flashing amber)
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        chatHistory = data.history;

        // GATE LOGIC
        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/);
        const wp = wpMatch ? parseInt(wpMatch[1]) : 0;
        if (wp >= 50) {
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');
        }
        if (wp >= 100) document.getElementById('reward-signal').classList.remove('hidden');

        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        if (idMatch) skinDisplay.innerText = idMatch[1];
        
        if (window.MathJax) MathJax.typesetPromise([output]);
        window.scrollTo(0, 0);
    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    } finally {
        btn.disabled = false;
    }
});
