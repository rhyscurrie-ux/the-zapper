async function runAudit() {
    const input = document.getElementById('user-input');
    const output = document.getElementById('audit-output');
    
    // 1. Check if there is actually text to process
    if (!input.value.trim()) return;

    // 2. IMMEDIATELY purge the "Awaiting" text and hide the input area
    output.innerHTML = ""; 
    document.getElementById('input-section').classList.add('hidden');
    
    // 3. Show the calibration state
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                input: input.value, 
                history: chatHistory 
            })
        });
        
        const data = await res.json();
        chatHistory = data.history;

        // 4. Overwrite the calibration text with the final Audit result
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        // Handle Identifier and Decision Box visibility here...
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        document.getElementById('skin-suit-display').innerText = idMatch ? idMatch[1] : "UNKNOWN";
        document.getElementById('decision-box').classList.remove('hidden');

        if (window.MathJax) MathJax.typesetPromise([output]);

    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    }
}
