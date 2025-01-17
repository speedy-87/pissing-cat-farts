const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const leaderboardButton = document.getElementById("leaderboard-button");
const nicknameInput = document.getElementById("nickname-input");

// Base game dimensions
const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;
let scale = 1; // Scaling factor for responsiveness

// Load images
const catImg = new Image();
catImg.src = "./img/pcf-new.png";

const catFartImg = new Image();
catFartImg.src = "./img/pcf-fart-new.png";

const milkImg = new Image();
milkImg.src = "./img/milk.png";

const pipeImg = new Image();
pipeImg.src = "./img/cat-tree2.png";

// Load sounds
const fartSound = new Audio("./audio/fart.wav");
const flushSound = new Audio("./audio/toilet-flushed.mp3");
const slurpSound = new Audio("./audio/cartoon-slurp.mp3");

// Offscreen canvas for pixel-perfect collision detection
const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d");

// Resize canvas to fit the screen while maintaining aspect ratio
function resizeCanvas() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const maxHeight = 625; // Maximum height to avoid excessive scaling
    if (screenWidth / screenHeight > BASE_WIDTH / BASE_HEIGHT) {
        canvas.height = Math.min(screenHeight, maxHeight);
        canvas.width = (BASE_WIDTH / BASE_HEIGHT) * canvas.height;
    } else {
        canvas.width = screenWidth * 0.95;
        canvas.height = (BASE_HEIGHT / BASE_WIDTH) * canvas.width;
    }

    scale = canvas.width / BASE_WIDTH;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Track image load status
let imagesLoaded = 0;
const totalImages = 4;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        drawStartScreen(); // Start the game once all images are loaded
    }
}

catImg.onload = imageLoaded;
catFartImg.onload = imageLoaded;
milkImg.onload = imageLoaded;
pipeImg.onload = imageLoaded;

// Game variables
let catY = canvas.height / 2;
let catX = (BASE_WIDTH / 6) * scale;
let catVelocity = 0;
let gravity = 0.2 * scale;
let isGameOver = false;
let isGameStarted = false;
let score = 0;

const pipes = [];
let pipeWidth = 50 * scale;
let gap = 150 * scale;
let pipeSpeed = 3 * scale;
const scorePadding = 10 * scale;

let milk = null; // Store only one milk
let milkWidth = 50 * scale;

let pipeInterval;
let milkInterval;

let isFarting = false;
let nickname = "";
let fartCooldown = false;

// Draw Start Screen
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#f3c64b";
    ctx.font = `bold ${30 * scale}px Arial`;
    ctx.textAlign = "center";
    
    ctx.fillText("Pissing Cat Farts", canvas.width / 2, canvas.height / 2 - 50 * scale);
    
    restartButton.style.display = "none"; 
    startButton.style.display = "block";
    leaderboardButton.style.display = "block"; 
    nicknameInput.style.display = "block";
}

// Draw Game Over Screen
function drawGameOverScreen() {
    ctx.fillStyle = "red";
    ctx.font = `${30 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50 * scale);
    ctx.fillStyle = "black";
    ctx.font = `${20 * scale}px Arial`;
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Name: ${nickname}`, canvas.width / 2, canvas.height / 2 + 25 * scale);
    startButton.style.display = "none";
    restartButton.style.display = "block"; 
    leaderboardButton.style.display = "block"; 
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isGameOver) {
        // Cat movement
        catVelocity += gravity;
        catY += catVelocity;

        const catSize = 60 * scale;
        const currentCatImg = isFarting ? catFartImg : catImg;
        if (isFarting && !fartCooldown) {
            const fartClone = fartSound.cloneNode();
            fartClone.play();
            fartCooldown = true;
            setTimeout(() => fartCooldown = false, 200);
        }

        ctx.drawImage(currentCatImg, catX, catY, catSize, catSize);

        // Draw and update pipes
        pipes.forEach((pipe, index) => {
            pipe.x -= pipeSpeed;

            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, pipe.x, -pipe.top, pipe.width, pipe.top);
            ctx.restore();

            ctx.drawImage(pipeImg, pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);

            // Collision detection
            if (catX < pipe.x + pipe.width && catX + catSize > pipe.x && (catY < pipe.top || catY + catSize > pipe.bottom)) {
                flushSound.play();
                gameOver();
            }

            // Remove pipes that are out of the screen
            if (pipe.x + pipe.width < 0) {
                pipes.splice(index, 1);
                score++;
            }
        });

        // Draw and update milk
        if (milk !== null) {
            milk.x -= pipeSpeed;
            ctx.drawImage(milkImg, milk.x, milk.y, milkWidth, milkWidth);

            // Collision detection with milk
            if (catX < milk.x + milkWidth && catX + catSize > milk.x && catY < milk.y + milkWidth && catY + catSize > milk.y) {
                slurpSound.play();
                milk = null;
                score++;
            } else if (milk.x + milkWidth < 0) {
                milk = null;
            }
        }

        // Game over check
        if (catY + catSize > canvas.height || catY < 0) {
            flushSound.play();
            gameOver();
        }

        // Draw score
        ctx.fillStyle = "black";
        ctx.font = `${20 * scale}px Arial`;
        ctx.textAlign = "left";
        ctx.fillText(`Score: ${score}`, scorePadding, scorePadding + 10 * scale);
        ctx.fillText(`Name: ${nickname}`, scorePadding, scorePadding + 30 * scale);

        requestAnimationFrame(gameLoop);
    } else {
        drawGameOverScreen();
    }
}

// Game over handling
function gameOver() {
    if (isGameOver) return;

    isGameOver = true;
    clearInterval(pipeInterval);
    clearInterval(milkInterval);

    submitScore();
    drawGameOverScreen();
}

function submitScore() {
    const nicknameInput = document.querySelector("#nickname-input");  // Target the correct nickname input
    const playerScore = score;  // Use the game score directly
    const nickname = nicknameInput.value.trim();
    
    if (!nickname || isNaN(playerScore)) {
        alert("Please enter a valid nickname and ensure the game has ended.");
        return;
    }

    // Remove '@' from the beginning of the nickname before creating the Twitter URL
    const twitterURL = `https://www.x.com/${nickname.replace(/^@/, '')}`;
    const scoreData = { nickname: `${nickname}`, score: playerScore, twitter: twitterURL };

    console.log("Submitting score:", scoreData); // Debugging line

    const url = 'https://api.sheety.co/fd10818c1eae04caf0980564586d4c52/pcfLeaderboard/sheet1';

    // First, load the existing leaderboard
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const leaderboard = data.sheet1;
            let existingEntry = leaderboard.find(entry => entry.nickname === nickname);

            if (existingEntry) {
                // If the nickname exists, check if the new score is higher
                if (playerScore > existingEntry.score) {
                    // Update the score if the new score is higher
                    existingEntry.score = playerScore;

                    // Update the leaderboard entry in the database
                    return fetch(url, {
                        method: 'PUT', // Use PUT to update the existing entry
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer YOUR_API_KEY" // Replace with actual API key
                        },
                        body: JSON.stringify({ sheet1: existingEntry })
                    });
                } else {
                    alert("Your score is not higher than the current score. No update made.");
                    
                }
            } else {
                // If the nickname doesn't exist, add it to the leaderboard
                return fetch(url, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer YOUR_API_KEY" // Replace with actual API key
                    },
                    body: JSON.stringify({ sheet1: scoreData })
                });
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => { throw new Error(error.message || "Failed to submit score") });
            }
            return response.json();
        })
        .then(json => {
            console.log("Score submitted/updated successfully!", json);
            alert("Score submitted/updated successfully!");
        })
        .catch((error) => {
            console.error("Error submitting/updating score:", error);
        });
}

// Start game
function startGame() {
    nickname = nicknameInput.value.trim();

    if (!nickname || nickname.length > 16 || /[<>]/.test(nickname)) {
        alert("Please enter a valid nickname (max 16 characters, no special symbols).");
        return;
    }

    // Hide UI elements
    startButton.style.display = "none";
    restartButton.style.display = "none";
    leaderboardButton.style.display = "none";
    nicknameInput.style.display = "none";

    // Reset game variables
    isGameStarted = true;
    isGameOver = false;
    catY = canvas.height / 2;
    catVelocity = 0;
    score = 0;
    pipes.length = 0;
    milk = null;

    // Start intervals for pipes and milk
    const MIN_PIPE_HEIGHT = 50 * scale;
    const MAX_PIPE_HEIGHT = canvas.height - gap - 50 * scale;

    pipeInterval = setInterval(() => {
        const randomTopHeight = Math.random() * (MAX_PIPE_HEIGHT - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
        pipes.push({ x: canvas.width, top: randomTopHeight, bottom: randomTopHeight + gap, width: pipeWidth });
    }, 2000);

    milkInterval = setInterval(() => {
        if (milk === null && pipes.length > 0) {
            const pipe = pipes[pipes.length - 1];
            const milkY = pipe.top + Math.random() * (gap - milkWidth);
            milk = { x: pipe.x + pipeWidth + Math.random() * 100 * scale, y: milkY };
        }
    }, 2000);

    gameLoop();
}

function restartGame() {
    isGameStarted = false;
    isGameOver = false;
    score = 0;

    startButton.style.display = "block";
    restartButton.style.display = "none";
    leaderboardButton.style.display = "block";
    nicknameInput.style.display = "block";
    nicknameInput.value = ""; 

    drawStartScreen();
}

// Event listeners for interactions
canvas.addEventListener("click", () => {
    if (isGameStarted && !isGameOver) {
        catVelocity = -5 * scale;
        isFarting = true;

        setTimeout(() => isFarting = false, 200);
    }
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (isGameStarted && !isGameOver) {
        catVelocity = -5 * scale;
        isFarting = true;

        setTimeout(() => isFarting = false, 200);
    }
});

startButton.addEventListener("click", () => {
    if (!isGameStarted) {
        startGame();
    }
});

restartButton.addEventListener("click", () => restartGame());

leaderboardButton.addEventListener("click", () => {
    window.location.href = "leaderboard.html"; 
});
