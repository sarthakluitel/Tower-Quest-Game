let balance = 100;
let currentFloor = 1;
const totalFloors = 8;

let autoPlayActive = false;
let autoPlayRounds = 0;
let selectedBoxIndex = null;

const floors = [];
const towerEl = document.getElementById("tower");
const balanceEl = document.getElementById("balance");
const currentFloorEl = document.getElementById("current-floor");
const startGameBtn = document.getElementById("start-game");
const autoPlayBtn = document.createElement("button");
const autoPlayRoundsInput = document.createElement("input");
const difficultySelect = document.createElement("select");

autoPlayBtn.textContent = "Start Auto-Play";
autoPlayBtn.id = "autoplay";
autoPlayRoundsInput.type = "number";
autoPlayRoundsInput.id = "autoplay-rounds";
autoPlayRoundsInput.placeholder = "Rounds (e.g., 10)";
document.getElementById("controls").appendChild(autoPlayBtn);
document.getElementById("controls").appendChild(autoPlayRoundsInput);

difficultySelect.id = "difficulty";
difficultySelect.innerHTML = `
  <option value="normal">Normal (1 bomb, 3 gems)</option>
  <option value="medium">Medium (1 bomb, 2 gems)</option>
  <option value="hard">Hard (2 bombs, 1 gem)</option>
  <option value="impossible">Impossible (3 bombs, 1 gem)</option>
`;
document.getElementById("controls").appendChild(difficultySelect);

// Difficulty config
const difficulties = {
  normal: { boxes: 4, bombs: 1 },
  medium: { boxes: 3, bombs: 1 },
  hard: { boxes: 3, bombs: 2 },
  impossible: { boxes: 4, bombs: 3 },
};
let difficulty = difficulties.normal;

// Generate floors
function generateFloors() {
  floors.length = 0;
  for (let i = 1; i <= totalFloors; i++) {
    const floor = [];
    const bombCount = difficulty.bombs;
    const gemCount = difficulty.boxes - bombCount;

    // Add bombs and gems
    for (let j = 0; j < bombCount; j++) floor.push("bomb");
    for (let j = 0; j < gemCount; j++) floor.push("gem");

    // Shuffle the floor
    floor.sort(() => Math.random() - 0.5);
    floors.push(floor);
  }
}

// Update difficulty based on user selection
difficultySelect.addEventListener("change", (event) => {
  const selectedDifficulty = event.target.value;
  difficulty = difficulties[selectedDifficulty];
  resetGame();
});

// Render tower
function renderTower() {
  towerEl.innerHTML = "";
  floors.forEach((floor, index) => {
    const floorEl = document.createElement("div");
    floorEl.className = "floor";
    if (index === currentFloor - 1) floorEl.classList.add("active-floor");

    floor.forEach((box, boxIndex) => {
      const boxEl = document.createElement("div");
      boxEl.className = "box";
      boxEl.dataset.floor = index;
      boxEl.dataset.box = boxIndex;

      // Handle box click (manual mode)
      boxEl.addEventListener("click", handleBoxClick);
      floorEl.appendChild(boxEl);
    });

    towerEl.appendChild(floorEl);
  });
}

// For message box
function showMessage(message, callback = null) {
  const messageBox = document.getElementById("message-box");
  const messageContent = document.getElementById("message-content");
  const closeMessageBtn = document.getElementById("close-message");

  messageContent.textContent = message; 
  messageBox.classList.remove("hidden"); 

  // Close the message box when the button is clicked
  closeMessageBtn.onclick = () => {
    messageBox.classList.add("hidden");
    if (callback) callback();
  };
}

// Handle box selection (manual mode)
function handleBoxClick(event) {
  const boxEl = event.target;
  const floorIndex = +boxEl.dataset.floor;
  const boxIndex = +boxEl.dataset.box;

  if (floorIndex === currentFloor - 1 && !boxEl.classList.contains("revealed")) {
    const content = floors[floorIndex][boxIndex];
    boxEl.classList.add("revealed", content);
    boxEl.textContent = content === "gem" ? "🍎" : "☠️";

    if (content === "bomb") { 
      //immediately ends game
      revealAllBoxes();
      showMessage("👎🏿👎🏿👎🏿 Game over! You hit a bomb.", resetGame);
      return; 
    }

    if (content === "gem") {
      // Display gem before next floor
      setTimeout(() => {
        currentFloor++;
        if (currentFloor > totalFloors) {
          showMessage("👏🏿👏🏿👏🏿 You won! Congratulations on reaching the top floor!");
          resetGame();
        } else {
          renderTower();
        }
      }, 500);
    } else if (content === "bomb") {
      showMessage("👎🏿👎🏿👎🏿 Game over! You hit a bomb.", resetGame);
      revealAllBoxes();
    }
  }
}

// Reveal all boxes (game over)
function revealAllBoxes() {
  floors.forEach((floor, floorIndex) => {
    const floorEl = towerEl.children[totalFloors - floorIndex - 1];
    floor.forEach((box, boxIndex) => {
      const boxEl = floorEl.children[boxIndex];
      if (!boxEl.classList.contains("revealed")) {
        boxEl.classList.add("revealed", box);
        boxEl.textContent = box === "gem" ? "🍎" : "☠️";
      }
    });
  });
  resetGame();
}

// To cancle auto play

const cancelAutoPlayBtn = document.createElement("button");
cancelAutoPlayBtn.textContent = "Cancel Auto-Play";
cancelAutoPlayBtn.id = "cancel-autoplay";
cancelAutoPlayBtn.style.display = "none"; 
document.getElementById("controls").appendChild(cancelAutoPlayBtn);

// Auto-play logic
function startAutoPlay() {
  if (autoPlayActive) {
    showMessage("Auto-Play is already running!");
    return;
  }

  // Validate input
  selectedBoxIndex = prompt(
    `Select the box index to apply for all floors (0 to ${
      difficulty.boxes - 1
    }):`
  );
  selectedBoxIndex = parseInt(selectedBoxIndex);
  if (
    isNaN(selectedBoxIndex) ||
    selectedBoxIndex < 0 ||
    selectedBoxIndex >= difficulty.boxes
  ) {
    showMessage("Invalid box index. Auto-Play canceled.");
    return;
  }

  autoPlayRounds = parseInt(autoPlayRoundsInput.value);
  if (isNaN(autoPlayRounds) || autoPlayRounds <= 0) {
    showMessage("Invalid number of rounds. Auto-Play canceled.");
    return;
  }

  autoPlayActive = true;
  cancelAutoPlayBtn.style.display = "inline-block";
  playAutoRounds();
}

function playAutoRounds() {
  if (!autoPlayActive || autoPlayRounds <= 0) {
    autoPlayActive = false;
    showMessage("Auto-Play finished.");
    cancelAutoPlayBtn.style.display = "none";
    return;
  }

  // showMessage
  generateFloors();

  let wonGame = true; 
  let gameResultMessage = "👏🏿👏🏿👏🏿 Game won! All selected boxes had apples.";

  for (let floorIndex = 0; floorIndex < totalFloors; floorIndex++) {
    const boxContent = floors[floorIndex][selectedBoxIndex];

    if (boxContent === "bomb") {
      // Player loses if a bomb is found
      gameResultMessage = `👎🏿👎🏿👎🏿 Game lost! A bomb was hit on floor ${floorIndex + 1}.`;
      wonGame = false;
      revealAllBoxes();
      cancelAutoPlayBtn.style.display = "none";
      break;
    }
  }

  showMessage(gameResultMessage, () => {
    if (wonGame) {
      autoPlayRounds--;
      setTimeout(autoPlayGame, 1000); 
    } else {
      autoPlayRounds = 0; 
      autoPlayActive = false;
    }
  });
}

// Reset the game
function resetGame() {
  setTimeout(() => {
    currentFloor = 1;
    balance -= 10;
    if (balance <= 0) {
      showMessage("You ran out of balance! Game over.");
      balance = 100;
    }
    balanceEl.textContent = balance;
    currentFloorEl.textContent = currentFloor;
    generateFloors();
    renderTower();
  }, 3000);
}

// Start the game (manual mode)
startGameBtn.addEventListener("click", () => {
  balance -= 10;
  balanceEl.textContent = balance;
  generateFloors();
  renderTower();
});

// Start auto-play mode
autoPlayBtn.addEventListener("click", startAutoPlay);

// To cancel Auto-Play logic
cancelAutoPlayBtn.addEventListener("click", () => {
  autoPlayActive = false; 
  cancelAutoPlayBtn.style.display = "none"; 
  showMessage("Auto-Play canceled. Returning to manual mode.");
});

// Initialize
generateFloors();
renderTower();
