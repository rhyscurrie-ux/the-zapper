let chatHistory = [];
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');

input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        output.innerText += `\n\n> Specimen_Input: "${val}"\n[CALIBRATING...]`;

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: val, history: chatHistory })
            });

            const data = await res.json();
            output.innerText += `\n${data.audit}`;
            chatHistory = data.history;
            
            // Trigger MathJax to render the new LaTeX
            if (window.MathJax) {
                MathJax.typesetPromise();
            }
            
            window.scrollTo(0, document.body.scrollHeight);
        } catch (err) {
            output.innerText += `\n[CRITICAL_ERROR]: ${err.message}`;
        }
    }
});
