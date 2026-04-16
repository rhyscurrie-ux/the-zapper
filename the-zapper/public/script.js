// This matches the IDs in your HTML file
const terminal = document.getElementById('terminal');
const input = document.getElementById('commandInput'); 

async function handleCommand(val) {
    // 1. Create the user's input line
    const line = document.createElement('div');
    line.className = 'line'; // Matches your CSS class
    line.textContent = `> ${val}`;
    terminal.appendChild(line);

    // 2. Create the loading indicator
    const loading = document.createElement('div');
    loading.className = 'line';
    loading.textContent = "[PENETRATING_BUFFER...]";
    terminal.appendChild(loading);

    try {
        // 3. Send the request to your Railway server
        const response = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val })
        });

        const data = await response.json();
        
        // 4. Clean up and show the Architect's response
        loading.remove();
        const responseLine = document.createElement('div');
        responseLine.className = 'line';
        responseLine.style.color = "#00ff00"; // Ensure it pops in green
        
        // This handles the LaTeX math and formatting
        responseLine.innerHTML = data.architect_roast;
        terminal.appendChild(responseLine);

        // Trigger MathJax to render any LaTeX math in the response
        if (window.MathJax) {
            MathJax.typesetPromise();
        }

    } catch (e) {
        loading.textContent = "[SYSTEM_SILENCE]: Check connection.";
        console.error("Architect Error:", e);
    }
    
    // Auto-scroll to the bottom
    window.scrollTo(0, document.body.scrollHeight);
}

// Listen for the 'Enter' key
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        handleCommand(input.value);
        input.value = ''; // Clear the box for the next command
    }
});
