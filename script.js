const ENGLISH_LETTER_FREQUENCIES = {
    A: 8.17, B: 1.49, C: 2.78, D: 4.25, E: 12.70,
    F: 2.23, G: 2.02, H: 6.09, I: 6.97, J: 0.15,
    K: 0.77, L: 4.03, M: 2.41, N: 6.75, O: 7.51,
    P: 1.93, Q: 0.10, R: 5.99, S: 6.33, T: 9.06,
    U: 2.76, V: 0.98, W: 2.36, X: 0.15, Y: 1.97, Z: 0.07
};

let currentChallenge = null;

function caesarCipher(text, shift, preserveCase = true) {
    shift = parseInt(shift) % 26;
    const effectiveShift = (shift < 0) ? (shift + 26) : shift;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char.match(/[A-Za-z]/)) {
            let isUpper = char === char.toUpperCase();
            let shiftedCharCode = ((char.toUpperCase().charCodeAt(0) - 65 + effectiveShift) % 26) + 65;
            let shiftedChar = String.fromCharCode(shiftedCharCode);
            result += preserveCase ? (isUpper ? shiftedChar : shiftedChar.toLowerCase()) : shiftedChar;
        } else {
            result += char;
        }
    }
    return result;
}

function giveFeedback(userAttempt) {
    if (!currentChallenge) return "";

    const cleanedAttempt = userAttempt.replace(/[^A-Za-z]/gi, '').toUpperCase();
    const cleanedAnswer = currentChallenge.replace(/[^A-Za-z]/gi, '').toUpperCase();

    if (cleanedAttempt === cleanedAnswer) {
        return "🎉 You cracked it!";
    }

    let matchCount = 0;
    for (let i = 0; i < Math.min(cleanedAttempt.length, cleanedAnswer.length); i++) {
        if (cleanedAttempt[i] === cleanedAnswer[i]) {
            matchCount++;
        }
    }

    const accuracy = matchCount / cleanedAnswer.length;

    if (accuracy > 0.7) return "You're getting close!";
    if (accuracy > 0.4) return "Not quite right...";
    return "Keep trying!";
}

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const shiftValueInput = document.getElementById('shiftValue');
    const shiftDownBtn = document.getElementById('shiftDown');
    const shiftUpBtn = document.getElementById('shiftUp');
    const applyButton = document.getElementById('applyButton');
    const outputTextDiv = document.getElementById('outputText');
    const innerWheelGroup = document.getElementById('innerWheelGroup');
    const crackButton = document.getElementById('crackButton');
    const crackShiftDisplay = document.getElementById('crackShiftDisplay');
    const preserveCaseCheckbox = document.getElementById('preserveCaseCheckbox');
    const copyButton = document.getElementById('copyButton');
    const generateButton = document.getElementById('generateChallengeButton');
    const freqCrackButton = document.getElementById('freqCrackButton');

    let isCracking = false;
    let chartInstance = null;

    function updateWheelRotation(shift) {
        let numericShift = parseInt(shift) || 0;
        numericShift %= 26;
        const rotationAngle = (numericShift / 26) * -360;
        if (innerWheelGroup) {
            innerWheelGroup.style.transform = `rotate(${rotationAngle}deg)`;
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getLetterFrequencies(text) {
        const freq = {};
        const totalLetters = text.replace(/[^A-Za-z]/g, "").length;
        for (let char of text.toUpperCase()) {
            if (char >= 'A' && char <= 'Z') {
                freq[char] = (freq[char] || 0) + 1;
            }
        }
        for (let letter in ENGLISH_LETTER_FREQUENCIES) {
            if (!freq[letter]) freq[letter] = 0;
        }
        for (let letter in freq) {
            freq[letter] = totalLetters === 0 ? 0 : (freq[letter] / totalLetters) * 100;
        }
        return freq;
    }

    function renderFrequencyChart(text) {
        const ctx = document.getElementById('frequencyChart').getContext('2d');
        const observed = getLetterFrequencies(text);
        const labels = Object.keys(ENGLISH_LETTER_FREQUENCIES);
        const expectedData = labels.map(l => ENGLISH_LETTER_FREQUENCIES[l]);
        const actualData = labels.map(l => observed[l]);

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Observed Frequency (%)',
                        data: actualData,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    },
                    {
                        label: 'Expected English Frequency (%)',
                        data: expectedData,
                        backgroundColor: 'rgba(255, 99, 132, 0.4)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 14 }
                }
            }
        });
    }

    async function startCracking() {
        if (isCracking) return;
        const textToCrack = inputText.value;
        if (!textToCrack) {
            alert("Please enter text to crack.");
            return;
        }

        isCracking = true;
        applyButton.disabled = crackButton.disabled = shiftValueInput.disabled = shiftDownBtn.disabled = shiftUpBtn.disabled = true;
        crackShiftDisplay.textContent = "Starting crack...";
        outputTextDiv.textContent = "";

        try {
            for (let key = 1; key <= 25; key++) {
                const decryptedText = caesarCipher(textToCrack, -key, preserveCaseCheckbox.checked);
                outputTextDiv.textContent = decryptedText;
                const feedback = giveFeedback(decryptedText);
                crackShiftDisplay.textContent = `Trying Encryption Key: ${key} → ${feedback}`;
                updateWheelRotation(key);
                await delay(300);
            }
            crackShiftDisplay.textContent = "Cracking finished.";
        } catch (err) {
            crackShiftDisplay.textContent = "Error during cracking.";
        } finally {
            isCracking = false;
            applyButton.disabled = crackButton.disabled = shiftValueInput.disabled = shiftDownBtn.disabled = shiftUpBtn.disabled = false;
        }
    }

    function crackByFrequency() {
        const text = inputText.value;
        if (!text) {
            alert("Please enter text to analyze.");
            return;
        }

        const letterCounts = {};
        for (let char of text.toUpperCase()) {
            if (char >= 'A' && char <= 'Z') {
                letterCounts[char] = (letterCounts[char] || 0) + 1;
            }
        }

        if (Object.keys(letterCounts).length === 0) {
            alert("No letters found in input.");
            return;
        }

        const mostFrequentLetter = Object.entries(letterCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const guessedShift = (mostFrequentLetter.charCodeAt(0) - 'E'.charCodeAt(0) + 26) % 26;
        const decryptedText = caesarCipher(text, -guessedShift, preserveCaseCheckbox.checked);

        outputTextDiv.textContent = decryptedText;
        const feedback = giveFeedback(decryptedText);
        crackShiftDisplay.textContent = `Guessed Shift: -${guessedShift} → ${feedback}`;
        updateWheelRotation(guessedShift);
        renderFrequencyChart(text);
    }

    applyButton.addEventListener('click', () => {
        if (isCracking) return;
        const text = inputText.value;
        const shift = parseInt(shiftValueInput.value);
        if (isNaN(shift)) return alert("Enter valid shift.");
        const result = caesarCipher(text, shift, preserveCaseCheckbox.checked);
        outputTextDiv.textContent = result;
        const feedback = giveFeedback(result);
        crackShiftDisplay.textContent = `(Applied Shift: ${shift}) → ${feedback}`;
        updateWheelRotation(shift);
        renderFrequencyChart(result);
    });

    crackButton.addEventListener('click', startCracking);
    freqCrackButton.addEventListener('click', crackByFrequency);

    shiftDownBtn.addEventListener('click', () => {
        shiftValueInput.value = parseInt(shiftValueInput.value) - 1;
        updateWheelRotation(shiftValueInput.value);
    });

    shiftUpBtn.addEventListener('click', () => {
        shiftValueInput.value = parseInt(shiftValueInput.value) + 1;
        updateWheelRotation(shiftValueInput.value);
    });

    shiftValueInput.addEventListener('input', () => {
        updateWheelRotation(shiftValueInput.value);
    });

    copyButton.addEventListener('click', () => {
        const text = outputTextDiv.textContent;
        if (!text || text === '(Output will appear here)') {
            alert('No text to copy!');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => copyButton.textContent = 'Copy to Clipboard', 1500);
        });
    });

    const samplePhrases = [
        "HELLO WORLD", "CAESAR CIPHER", "SECRET MESSAGE", "TRY TO DECRYPT", "CRYPTO FUN"
    ];

    generateButton.addEventListener('click', () => {
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        const randomShift = Math.floor(Math.random() * 25) + 1;
        const encrypted = caesarCipher(randomPhrase, randomShift, preserveCaseCheckbox.checked);
        inputText.value = encrypted;
        shiftValueInput.value = 0;
        crackShiftDisplay.textContent = `Challenge generated. Try cracking it!`;
        outputTextDiv.textContent = "(Try to decrypt this...)";
        currentChallenge = randomPhrase;
        updateWheelRotation(0);
        renderFrequencyChart(encrypted);
    });

    updateWheelRotation(shiftValueInput.value);
    crackShiftDisplay.textContent = '(Shift Tried: -)';
    outputTextDiv.textContent = '(Output will appear here)';
});