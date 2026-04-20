let chatHistory = [];
const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');

// Bug 7: Enter key submission
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
    }
});

btn.addEventListener('click', async () => {
    const val = input.value;
    if (!val.trim()) return;
    
    output.innerHTML = "[CALIBRATING_ENTROPY...]";
    btn.disabled = true;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory })
        });

        const data = await res.json();
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        chatHistory = data.history;

        // Bug 6: WP Parsing and Gating
        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/);
        const wp = wpMatch ? parseInt(wpMatch[1]) : 0;

        if (wp >= 50) {
            document.getElementById('reward-fb').classList.remove('hidden');
            document.getElementById('reward-amazon').classList.remove('hidden');
        }
        if (wp >= 100) {
            document.getElementById('reward-signal').classList.remove('hidden');
        }

        // Extract Identifier
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        if (idMatch) skinDisplay.innerText = idMatch[1];
        
        if (window.MathJax) MathJax.typesetPromise([output]);
    } catch (err) {
        output.innerHTML = `[CRITICAL_FAILURE]: ${err.message}`;
    } finally {
        btn.disabled = false;
    }
});
