let chatHistory = [];
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const val = input.value;
        if (!val.trim()) return;
        input.value = '';
        output.innerHTML += `<br><br>> Specimen_Input: "${val}"<br>[CALIBRATING...]`;

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: val, history: chatHistory })
            });

            const data = await res.json();
            const auditHTML = data.audit.replace(/\n/g, '<br>');
            output.innerHTML += `<br>${auditHTML}`;
            chatHistory = data.history;
            
            if (window.MathJax) {
                MathJax.typesetPromise([output]);
            }
            window.scrollTo(0, document.body.scrollHeight);
        } catch (err) {
            output.innerHTML += `<br>[CRITICAL_ERROR]: ${err.message}`;
        }
    }
});
