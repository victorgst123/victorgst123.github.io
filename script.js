// Game state
let currentScreen = 'welcome';
let score = 0;
let currentQuestion = { hour: 3, minute: 0 };
let isDragging = false;
let currentHand = null;

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// Clock utility functions
function setClockTime(clockId, hour, minute) {
    const hourHand = document.querySelector(`#${clockId} .hour-hand`);
    const minuteHand = document.querySelector(`#${clockId} .minute-hand`);
    
    // Calculate angles
    const hourAngle = (hour % 12) * 30 + (minute / 60) * 30; // 30 degrees per hour + minute offset
    const minuteAngle = minute * 6; // 6 degrees per minute
    
    // Apply rotations
    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
}

function getTimeFromClock(clockId) {
    const hourHand = document.querySelector(`#${clockId} .hour-hand`);
    const minuteHand = document.querySelector(`#${clockId} .minute-hand`);
    
    // Get rotation angles
    const hourTransform = hourHand.style.transform;
    const minuteTransform = minuteHand.style.transform;
    
    let hourAngle = 0;
    let minuteAngle = 0;
    
    if (hourTransform && hourTransform.includes('rotate')) {
        hourAngle = parseFloat(hourTransform.match(/rotate\(([^)]+)deg\)/)[1]);
    }
    
    if (minuteTransform && minuteTransform.includes('rotate')) {
        minuteAngle = parseFloat(minuteTransform.match(/rotate\(([^)]+)deg\)/)[1]);
    }
    
    // Normalize angles to positive values
    if (hourAngle < 0) hourAngle += 360;
    if (minuteAngle < 0) minuteAngle += 360;
    
    // Convert angles to time
    let hour = Math.round(hourAngle / 30);
    let minute = Math.round(minuteAngle / 6);
    
    // Handle rounding and edge cases
    minute = Math.round(minute / 5) * 5; // Round to nearest 5 minutes
    if (minute >= 60) minute = 0;
    if (minute < 0) minute = 0;
    
    if (hour >= 12) hour = hour % 12;
    if (hour <= 0) hour = 12;
    
    return { hour, minute };
}

function formatTime(hour, minute) {
    return `${hour}:${minute.toString().padStart(2, '0')}`;
}

// Touch/Mouse event handlers for draggable hands
function setupDraggableHands(clockId) {
    const clock = document.getElementById(clockId);
    const hands = clock.querySelectorAll('.hand');
    
    hands.forEach(hand => {
        // Mouse events
        hand.addEventListener('mousedown', startDrag);
        
        // Touch events
        hand.addEventListener('touchstart', startDrag, { passive: false });
    });
    
    // Global events
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    currentHand = e.target;
    currentHand.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging || !currentHand) return;
    
    e.preventDefault();
    
    const clock = currentHand.closest('.clock');
    const rect = clock.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // Calculate angle from center
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let degrees = (angle * 180 / Math.PI) + 90; // +90 to align with 12 o'clock
    
    if (degrees < 0) degrees += 360;
    
    // Snap to appropriate increments
    if (currentHand.classList.contains('hour-hand')) {
        degrees = Math.round(degrees / 30) * 30; // Snap to hours
    } else {
        degrees = Math.round(degrees / 6) * 6; // Snap to minutes
    }
    
    currentHand.style.transform = `rotate(${degrees}deg)`;
    
    // Update time display in learning mode
    if (currentScreen === 'learning-screen') {
        updateLearningTime();
    }
}

function endDrag(e) {
    if (isDragging && currentHand) {
        currentHand.style.cursor = 'pointer';
    }
    isDragging = false;
    currentHand = null;
}

function updateLearningTime() {
    const time = getTimeFromClock('clock');
    document.getElementById('current-time').textContent = formatTime(time.hour, time.minute);
}

// Test mode functions
function generateRandomTime() {
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutes = [0, 30]; // Only whole hours and half hours for 6-year-olds
    
    return {
        hour: hours[Math.floor(Math.random() * hours.length)],
        minute: minutes[Math.floor(Math.random() * minutes.length)]
    };
}

function startNewQuestion() {
    currentQuestion = generateRandomTime();
    document.getElementById('target-time').textContent = formatTime(currentQuestion.hour, currentQuestion.minute);
    
    // Reset test clock to 12:00
    setClockTime('test-clock', 12, 0);
}

function checkAnswer() {
    const userAnswer = getTimeFromClock('test-clock');
    const isCorrect = userAnswer.hour === currentQuestion.hour && userAnswer.minute === currentQuestion.minute;
    
    if (isCorrect) {
        score++;
        showFeedback(true, "Great job! That's correct! 🎉");
    } else {
        showFeedback(false, `Not quite right. The correct time is ${formatTime(currentQuestion.hour, currentQuestion.minute)}. Try again! 💪`);
    }
    
    document.getElementById('score').textContent = score;
}

function showFeedback(isCorrect, message) {
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');
    
    if (isCorrect) {
        feedbackIcon.textContent = '🎉';
        feedbackIcon.classList.add('celebrating');
    } else {
        feedbackIcon.textContent = '😊';
        feedbackIcon.classList.add('wrong-answer');
    }
    
    feedbackText.textContent = message;
    showScreen('feedback-screen');
    
    // Remove animation classes after animation
    setTimeout(() => {
        feedbackIcon.classList.remove('celebrating', 'wrong-answer');
    }, 600);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Welcome screen buttons
    document.getElementById('learning-mode-btn').addEventListener('click', () => {
        showScreen('learning-screen');
        setClockTime('clock', 12, 0);
        updateLearningTime();
        setupDraggableHands('clock');
    });
    
    document.getElementById('test-mode-btn').addEventListener('click', () => {
        showScreen('test-screen');
        score = 0;
        document.getElementById('score').textContent = score;
        startNewQuestion();
        setupDraggableHands('test-clock');
    });
    
    // Back buttons
    document.getElementById('back-to-menu-learning').addEventListener('click', () => {
        showScreen('welcome-screen');
    });
    
    document.getElementById('back-to-menu-test').addEventListener('click', () => {
        showScreen('welcome-screen');
    });
    
    // Test mode buttons
    document.getElementById('check-answer-btn').addEventListener('click', checkAnswer);
    
    // Feedback screen buttons
    document.getElementById('next-question-btn').addEventListener('click', () => {
        showScreen('test-screen');
        startNewQuestion();
    });
    
    document.getElementById('back-to-test-btn').addEventListener('click', () => {
        showScreen('test-screen');
    });
    
    // Initialize
    showScreen('welcome-screen');
});