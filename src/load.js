document.addEventListener('DOMContentLoaded', () => {
    const loader = document.createElement('div');
    loader.id = 'loading-screen';
    loader.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0a0a0a;
        color: #e0e0e0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Courier New', monospace;
        line-height: 1.6;
        text-align: center;
        padding: 20px;
    `;

    const textContainer = document.createElement('div');
    textContainer.id = 'type-container';
    textContainer.style = `max-width: 800px;`;

    const enterButton = document.createElement('button');
    enterButton.textContent = 'PRESS ENTER TO CONTINUE';
    enterButton.style = `
        opacity: 0;
        margin-top: 40px;
        padding: 15px 30px;
        font-size: 1.2rem;
        background: transparent;
        color: #e0e0e0;
        border: 2px solid #e0e0e0;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    enterButton.disabled = true;

    loader.appendChild(textContainer);
    loader.appendChild(enterButton);
    document.body.appendChild(loader);

    // Sylvia Plath quote split into lines
    const quoteLines = [
        "I can never read all the books I want;",
        "I can never be all the people I want and live all the lives I want.",
        "I can never train myself in all the skills I want.",
        "And why do I want?",
        "I want to live and feel all the shades, tones, and variations of",
        "mental and physical experience possible in my life.",
        "And I am horribly limited.",
        "- Sylvia Plath"
    ];

    const typingSpeed = 40; // Faster typing speed for longer text
    const lineDelay = 500; // Delay between lines
    let currentLine = 0;

    function typeLine() {
        if (currentLine >= quoteLines.length) {
            enterButton.style.opacity = '1';
            enterButton.disabled = false;
            return;
        }

        const lineDiv = document.createElement('div');
        lineDiv.style.margin = '10px 0';
        textContainer.appendChild(lineDiv);

        const currentText = quoteLines[currentLine];
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            lineDiv.textContent += currentText[charIndex];
            charIndex++;

            if (charIndex === currentText.length) {
                clearInterval(typeInterval);
                currentLine++;
                setTimeout(typeLine, lineDelay);
            }
        }, typingSpeed);
    }

    enterButton.addEventListener('click', () => {
        loader.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(loader);
            // Initialize your planet visualization here
            initializePlanet(); 
        }, 1000);
    });

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !enterButton.disabled) {
            enterButton.click();
        }
    });

    // Start typing sequence
    typeLine();
});