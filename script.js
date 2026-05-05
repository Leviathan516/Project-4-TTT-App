const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originParagraph = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const scoreList = document.querySelector("#score-list");

// Key used in localStorage.
const STORAGE_KEY = "typingTest.topScores";
const MAX_SCORES = 3;

// Text bank 
const PARAGRAPHS = [
    "The quick brown fox jumps over the lazy dog near the riverbank.",
    "JavaScript is a versatile language used for both front-end and back-end development.",
    "Practice makes perfect, especially when learning to type without looking at the keys.",
    "A journey of a thousand miles begins with a single keystroke at the keyboard.",
    "Coffee in one hand, semicolons in the other, that's the developer way of life.",
    "Reading books in the early morning is one of the simplest joys a person can have.",
    "The library was silent except for the soft turning of pages and distant footsteps.",
    "Learning a new skill takes patience, repetition, and a willingness to fail forward.",
    "Sunlight filtered through the trees, casting golden patterns across the forest floor.",
    "A good algorithm can save hours of computation; a great one can save days of frustration.",
    "Friendship is built on small moments, shared laughter, and quiet acts of kindness.",
    "The thunderstorm rolled across the valley, painting the sky in shades of grey and silver.",
    "Curiosity is the engine of discovery, pulling us toward questions we never thought to ask.",
    "She closed the laptop, stretched her arms, and finally noticed the city lights outside.",
    "Every great journey begins with the courage to take the very first uncertain step forward."
];

// State
let timer = [0, 0, 0]; // [minutes, seconds, hundredths]
let interval = null;
let timerRunning = false;
let originText = "";

function leadingZero(time) {
    return time <= 9 ? "0" + time : time;
}

// min/sec/hundredths runner
function runTimer() {
    const formatted =
        leadingZero(timer[0]) + ":" +
        leadingZero(timer[1]) + ":" +
        leadingZero(timer[2]);
    theTimer.innerHTML = formatted;

    timer[2]++;
    if (timer[2] >= 100) { timer[2] = 0; timer[1]++; }
    if (timer[1] >= 60)  { timer[1] = 0; timer[0]++; }
}

// Render origin text as individual spans so each char can be colored
function renderOriginText() {
    originParagraph.innerHTML = "";
    for (let i = 0; i < originText.length; i++) {
        const span = document.createElement("span");
        span.textContent = originText[i];
        originParagraph.appendChild(span);
    }
}
 
// Color each character span based on what the user typed
function updateCharColors() {
    const typed = testArea.value;
    const spans = originParagraph.querySelectorAll("span");
 
    spans.forEach((span, i) => {
        span.classList.remove("correct", "incorrect", "current");
 
        if (i < typed.length) {
            if (typed[i] === originText[i]) {
                span.classList.add("correct");
            } else {
                span.classList.add("incorrect");
            }
        } else if (i === typed.length) {
            span.classList.add("current");
        }
    });
}

// Match input vs origin text
function spellCheck() {
    const typed = testArea.value;

    // Update per-character coloring on the origin text
    updateCharColors();

    if (typed === originText) {
        // Test complete!
        clearInterval(interval);
        testWrapper.style.borderColor = "#0F9D58"; // green
        recordScore(timer.slice()); // pass a copy of the current time
    } else if (originText.startsWith(typed)) {
        testWrapper.style.borderColor = "#65CCf3"; // blue (correct so far)
    } else {
        testWrapper.style.borderColor = "#E95D0F"; // red (typo)
    }
}

// Start the timer on first keystroke
function start() {
    const textLen = testArea.value.length;
    if (textLen === 0 && !timerRunning) {
        timerRunning = true;
        interval = setInterval(runTimer, 10);
    }
}

// Reset everything: timer, text, border, and pull a new random paragraph
function reset() {
    clearInterval(interval);
    interval = null;
    timer = [0, 0, 0];
    timerRunning = false;
    testArea.value = "";
    theTimer.innerHTML = "00:00:00";
    testWrapper.style.borderColor = "grey";

    // Pick a fresh random paragraph
    const randomIndex = Math.floor(Math.random() * PARAGRAPHS.length);
    originText = PARAGRAPHS[randomIndex];

    // Render the new paragraph as individual character spans
    renderOriginText();
    updateCharColors();

    testArea.focus();
}

/* 
   LOCAL STORAGE INTEGRATION 
*/

// Convert a [min, sec, hundredths] array into total hundredths
// sort numerically (smallest = fastest).
function timeToHundredths(t) {
    return t[0] * 6000 + t[1] * 100 + t[2];
}

// Format a [min, sec, hundredths] array into a display string
function formatTime(t) {
    return leadingZero(t[0]) + ":" + leadingZero(t[1]) + ":" + leadingZero(t[2]);
}

// pull saved scores from localStorage and parse the JSON string
// back into a real JavaScript array.
function loadScores() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    try {
        const parsed = JSON.parse(raw);
        
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn("Could not parse saved scores:", err);
        return [];
    }
}

// turn the JS array into a JSON string and stash it in localStorage.
function saveScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

// Record a finished time, keep only the top 3 fastest, persist, and re-render.
function recordScore(finishedTime) {
    const scores = loadScores();

    // Add the new score
    scores.push({
        time: finishedTime,                    
        display: formatTime(finishedTime),     
        date: new Date().toLocaleDateString()  
    });

    // Sort fastest -> slowest
    scores.sort((a, b) => timeToHundredths(a.time) - timeToHundredths(b.time));

    // Keep only the top 3
    const top = scores.slice(0, MAX_SCORES);

    saveScores(top);
    renderScores(top);
}

// Render the high scores list. Dynamically creates <li> elements.
function renderScores(scores) {
    scoreList.innerHTML = ""; // clear current list

    if (scores.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-score";
        empty.textContent = "No scores yet — finish a test to record one!";
        scoreList.appendChild(empty);
        return;
    }

    scores.forEach((score, index) => {
        const li = document.createElement("li");
        li.innerHTML =
            '<span class="rank">#' + (index + 1) + '</span>' +
            '<span class="score-time">' + score.display + '</span>' +
            '<span class="score-date">' + score.date + '</span>';
        scoreList.appendChild(li);
    });
}

// On page load: render whatever scores were saved from a previous session,
// and pick a starting paragraph.
function init() {
    renderScores(loadScores());
    reset(); // sets initial paragraph + focuses textarea
}

// Event Listeners 
testArea.addEventListener("keypress", start);
testArea.addEventListener("input", spellCheck);
resetButton.addEventListener("click", reset);

init();
