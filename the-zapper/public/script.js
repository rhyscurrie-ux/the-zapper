let chatHistory = [];
const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
    }
});

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

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        chatHistory = data.history;

        // PARSE WEIGHTING POINTS
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
        
        if (window.MathJax) {
            MathJax.typesetPromise([output]).catch((err) => console.log(err.message));
        }

        window.scrollTo(0, 0); // Keep focus on the audit result
    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]: ${err.message}</span>`;
    } finally {
        btn.disabled = false;
    }
});
