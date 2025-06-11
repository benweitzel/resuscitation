document.addEventListener("DOMContentLoaded", function () {
    const overallTimerElement = document.getElementById("overall-timer");
    const cycleTimerElement = document.getElementById("cycle-timer");
    const startButton = document.getElementById("start-button");
    const stopButton = document.getElementById("stop-button");
    const resetButton = document.getElementById("reset-button");
    const eventButtons = document.querySelectorAll(".event-button");
    const addNoteButton = document.getElementById("add-note-button");
    const customEventInput = document.getElementById("custom-event");
    const logList = document.getElementById("log-list");
    const metronomeVisual = document.getElementById("metronome-visual");
    const metronomeContainer = document.querySelector(".metronome");
    const suggestedStepsList = document.getElementById("suggested-steps-list");
    const currentTimeElement = document.getElementById("current-time");
    const timeOfDeathButton = document.getElementById("time-of-death-button");
    const timeOfDeathDisplay = document.getElementById("time-of-death-display");
    const rhythmSelect = document.getElementById("rhythm-select");

    let overallSeconds = 0;
    let cycleSeconds = 120;
    let interval;
    let metronomeAudio = new Audio('metronome-beep.wav');
    let alertAudio = null;
    let cycleCount = 0;
    let currentRhythm = 'none';

    // Ensure metronome sound loop
    metronomeAudio.loop = true;

    const getCurrentTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    // Function to start the timers and metronome
    startButton.addEventListener("click", function () {
        if (!interval) {
            interval = setInterval(updateTimers, 1000);
            metronomeAudio.play();
            metronomeContainer.classList.add("metronome-active");
        }
    });

    // Function to stop the timers and metronome
    stopButton.addEventListener("click", function () {
        clearInterval(interval);
        if (metronomeAudio) metronomeAudio.pause();
        if (alertAudio) alertAudio.pause();
        interval = null;
        metronomeContainer.classList.remove("metronome-active");
    });

    // Function to reset the timers and the event log
    resetButton.addEventListener("click", function () {
        clearInterval(interval);
        if (metronomeAudio) metronomeAudio.pause();
        if (alertAudio) alertAudio.pause();
        interval = null;
        overallSeconds = 0;
        cycleSeconds = 120;
        cycleCount = 0;
        currentRhythm = 'none';
        rhythmSelect.value = 'none';
        logList.innerHTML = "";
        suggestedStepsList.innerHTML = "No suggested steps at this time."; // Clear suggested steps
        timeOfDeathDisplay.innerHTML = ""; // Clear time of death display
        updateDisplay();
        metronomeContainer.classList.remove("metronome-active");
    });

    // Function to update the overall and cycle timers every second
    function updateTimers() {
        overallSeconds++;
        cycleSeconds--;

        suggestedNextSteps();

        if (cycleSeconds <= 0) {
            cycleSeconds = 120;
            cycleCount++;
            logEvent(`CPR Cycle ${cycleCount} Complete`);
            playAlert('end-cycle.wav');
        } else if (cycleSeconds === 5) {
            playAlert('warning-cycle.wav');
        }

        updateDisplay();
    }

    // Display the updated timers on the interface
    function updateDisplay() {
        overallTimerElement.textContent = formatTime(overallSeconds);
        cycleTimerElement.textContent = formatTime(cycleSeconds);
        updateCurrentTime();
    }

    // Format time in seconds to MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Function to play the audible alert
    function playAlert(file) {
        if (alertAudio && !alertAudio.paused) {
            alertAudio.pause();
        }
        alertAudio = new Audio(file);
        alertAudio.play();
    }

    // Log events and scroll the logger to the bottom
    function logEvent(event) {
        const realTime = getCurrentTime();
        if (event === "Rhythm Detected") {
            if (currentRhythm === "vf_pvt") event += ": VF/pVT";
            else if (currentRhythm === "pea") event += ": PEA";
            else if (currentRhythm === "asystole") event += ": Asystole";
        }
        const logEntry = document.createElement("div");
        logEntry.textContent = `${realTime} - ${event}`;
        logList.appendChild(logEntry);
        
        // Scroll the log list to the bottom
        logList.scrollTop = logList.scrollHeight;
    }

    // Log pre-defined events
    eventButtons.forEach(button => {
        button.addEventListener("click", function () {
            const event = button.getAttribute("data-event");
            logEvent(event);
        });
    });

    // Log custom notes
    addNoteButton.addEventListener("click", function () {
        const note = customEventInput.value.trim();
        if (note) {
            logEvent(`Note: ${note}`);
            customEventInput.value = "";
        }
    });

    // Update the current time display
    function updateCurrentTime() {
        currentTimeElement.textContent = getCurrentTime();
    }

    // Suggested next steps based on the current rhythm
    function suggestedNextSteps() {
        if (currentRhythm === 'none') {
            suggestedStepsList.innerHTML = "No suggested steps at this time.";
            return;
        }
        
        // Special actions based on overall time and rhythms per ACLS guidelines
        if (overallSeconds === 120 || overallSeconds % 600 === 0) { // Every 2 minutes or 10 minutes
            if (currentRhythm === 'pea' || currentRhythm === 'asystole') {
                suggestStep("Administer Epinephrine (1 mg)");
            }
            if (currentRhythm === 'vf_pvt') {
                suggestStep("Attempt Defibrillation");
            }
        }

        // Additional checks for specific medications and interventions
        if (currentRhythm === 'vf_pvt' && overallSeconds === 180) {
            suggestStep("Administer Amiodarone (300 mg)");
        }
        if (currentRhythm === 'vf_pvt' && overallSeconds === 480) { // After 8 minutes for the second dose
            suggestStep("Administer Amiodarone (150 mg)");
        }
    }

    // Function to display suggested next steps
    function suggestStep(step) {
        const realTime = getCurrentTime();
        if (suggestedStepsList.textContent === "No suggested steps at this time.") {
            suggestedStepsList.textContent = "";
        }
        const stepEntry = document.createElement("div");
        stepEntry.textContent = `${realTime} - ${step}`;
        suggestedStepsList.appendChild(stepEntry);
    }

    // Handle the "Time of Death" button click
    timeOfDeathButton.addEventListener("click", function () {
        clearInterval(interval);
        if (metronomeAudio) metronomeAudio.pause();
        if (alertAudio) alertAudio.pause();
        interval = null;
        metronomeContainer.classList.remove("metronome-active");

        const timeOfDeath = getCurrentTime();
        timeOfDeathDisplay.textContent = `Time of Death: ${timeOfDeath}`;

        logEvent("Time of Death");
    });

    // Handle rhythm selection changes
    rhythmSelect.addEventListener("change", function () {
        currentRhythm = rhythmSelect.value;
        logEvent("Rhythm Detected");
    });

    // Initial call to update the current time display
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000); // Update the current time every second
});