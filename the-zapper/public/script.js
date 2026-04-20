let chatHistory = [];
const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const tickerText = document.getElementById('ticker-text');
const tickerBox = document.getElementById('sample-ticker');

// 1. STABILIZED TURNSTILE
const samples = [
    "\"I spent 3 hours arguing about a movie I haven't seen.\"",
    "\"I checked my fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I re-read an old text thread to find a reason to be offended.\"",
    "\"I spent my lunch break looking at vacation homes I can't afford.\""
];
let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 600); // Matched to CSS transition
}, 4000);

// 2. RECRUITMENT HANDLER
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

// 3. THE AUDIT TRIGGER
btn.addEventListener('click', async () => {
    const val = input.value;
    if (!val.trim()) return;
    
    // IMMEDIATE PURGE & BLACKOUT
    clearInterval(tickerInterval);
    tickerBox.style.display = 'none';
    input.style.display = 'none';
    btn.style.display = 'none';
    skinDisplay.innerText = ""; // PURGE [AWAITING_IDENTIFIER]
    
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    btn.disabled = true;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory })
        });
        const data = await res.json();
        
        // RE-ENABLE FOR MULTI-STEP
        input.style.display = 'block';
        input.value = '';
        btn.style.display = 'block';
        btn.innerText = "SUBMIT FURTHER EVIDENCE";

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        chatHistory = data.history;

        // WP GATING
        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/);
        const wp = wpMatch ? parseInt(wpMatch[1]) : 0;
        if (wp >= 50) {
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');
            document.getElementById('invite-btn').classList.remove('hidden');
        }
        if (wp >= 100) document.getElementById('reward-signal').classList.remove('hidden');

        // ASSIGN NEW IDENTIFIER
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        if (idMatch) {
            skinDisplay.style.opacity = "0";
            skinDisplay.innerText = idMatch[1];
            setTimeout(() => { skinDisplay.style.opacity = "1"; }, 100);
        }
        
        if (window.MathJax) MathJax.typesetPromise([output]);
        window.scrollTo(0, 0);
    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    } finally {
        btn.disabled = false;
    }
});
