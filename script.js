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

// Load cat and milk images
const catImg = new Image();
catImg.src = "./img/pcf-new.png"; // Replace with actual cat image path

const catFartImg = new Image();
catFartImg.src = "./img/pcf-fart-new.png"; // Replace with farting cat image path

const milkImg = new Image();
milkImg.src = "./img/milk.png"; // Replace with actual milk image path

// Load fart sound
const fartSound = new Audio("./audio/fart.wav"); 

const flushSound = new Audio("./audio/toilet-flushed.mp3"); 
const slurpSound = new Audio("./audio/cartoon-slurp.mp3"); 

// Offscreen canvas for pixel-perfect collision detection
const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d");

// Resize canvas to fit the screen while maintaining the aspect ratio
function resizeCanvas() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const maxHeight = 625; // Maximum height to avoid excessive scaling

    if (screenWidth / screenHeight > BASE_WIDTH / BASE_HEIGHT) {
        canvas.height = Math.min(screenHeight, maxHeight); // Ensure height doesn't exceed maxHeight
        canvas.width = (BASE_WIDTH / BASE_HEIGHT) * canvas.height;
    } else {
        canvas.width = screenWidth * 0.95; // Reduce width slightly for better fit
        canvas.height = (BASE_HEIGHT / BASE_WIDTH) * canvas.width;
    }

    scale = canvas.width / BASE_WIDTH; // Scaling factor based on width
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas); // Update on resize

// Load pipe image (only one image is now used)
const pipeImg = new Image();
pipeImg.src = "./img/cat-tree2.png"; // Path to the selected pipe image

// Track image load status
let imagesLoaded = 0;
const totalImages = 4; // Including cat and milk images

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        drawStartScreen(); // Start the game once all images are loaded
    }
}

// Attach image load event listeners
catImg.onload = imageLoaded;
catFartImg.onload = imageLoaded;
milkImg.onload = imageLoaded;
pipeImg.onload = imageLoaded; // Load pipe image
fartSound.preload = 'auto'; // Preload the sound

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

// Milk variable
let milk = null; // Store only one milk
let milkWidth = 50 * scale;

// Add pipes at intervals
let pipeInterval;
let milkInterval;

let isFarting = false;
let nickname = "";

let fartCooldown = false;
// Save to database function
function saveToDatabase() {
    fetch("https://sqlite3-production-3e88.up.railway.app/api/save_score", { // Use your live backend URL here
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, score }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Your score has been saved!");
            } else {
                alert(data.message); // Show message if the score wasn't high enough
            }
        })
        .catch((error) => {
            console.error("Error saving score:", error);
            alert("Failed to save score.");
        });
}


// Draw Start Screen
function drawStartScreen() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#f3c64b";
    ctx.font = `bold ${30 * scale}px Arial`;
    ctx.textAlign = "center";
    
    // Fill the text in the same position
    ctx.fillText("Pissing Cat Farts", canvas.width / 2, canvas.height / 2 - 50 * scale);
    
    restartButton.style.display = "none"; // hide button
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
    ctx.fillText(`Name: ${nickname}`, canvas.width / 2, canvas.height / 2 - -25 * scale);
    startButton.style.display = "none";
    restartButton.style.display = "block"; // Show button
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
            const fartClone = fartSound.cloneNode(); // Create a new instance of the sound
            fartClone.play();                       // Play the cloned sound
            fartCooldown = true;                    // Set cooldown to prevent rapid playback
            setTimeout(() => {
                fartCooldown = false;              // Reset cooldown after 500ms
            }, 200);                               // Adjust this value if needed
        }    

        // Draw the cat
        ctx.drawImage(currentCatImg, catX, catY, catSize, catSize);

        // Draw and update pipes
        pipes.forEach((pipe, index) => {
            pipe.x -= pipeSpeed;
        
            // Draw the top pipe (flipped vertically)
            ctx.save(); // Save the current canvas state
            ctx.scale(1, -1); // Flip the canvas vertically
            ctx.drawImage(pipeImg, pipe.x, -pipe.top, pipe.width, pipe.top); // Negative y-coordinate for flip
            ctx.restore(); // Restore the canvas state
        
            // Draw the bottom pipe (regular)
            ctx.drawImage(pipeImg, pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
        
            // Check collision with top pipe
            if (
                catX < pipe.x + pipe.width &&
                catX + catSize > pipe.x &&
                (catY < pipe.top || catY + catSize > pipe.bottom)
            ) {
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
            milk.x -= pipeSpeed; // Move milk towards the cat
            ctx.drawImage(milkImg, milk.x, milk.y, milkWidth, milkWidth);

            // Check for collision with milk
            if (
                catX < milk.x + milkWidth &&
                catX + catSize > milk.x &&
                catY < milk.y + milkWidth &&
                catY + catSize > milk.y
            ) {
                slurpSound.play();
                milk = null; // Remove milk
                score++; // Increase score
            }
            else if (milk.x + milkWidth < 0) {
                milk = null; // Remove missed milk
            }
        }

        // Check for game over (cat out of screen)
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
        // Ensure the game-over screen is drawn once
        drawGameOverScreen();
    }
}

function gameOver() {
    if (isGameOver) return; // Prevent multiple calls to gameOver

    isGameOver = true;

    // Stop intervals
    clearInterval(pipeInterval);
    clearInterval(milkInterval);

    // Save the score and draw the game-over screen
    saveToDatabase();
    drawGameOverScreen();
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
    const MIN_PIPE_HEIGHT = 50 * scale;  // Minimum height for pipe
    const MAX_PIPE_HEIGHT = canvas.height - gap - 50 * scale; // Maximum height for pipe

    pipeInterval = setInterval(() => {
        const randomTopHeight = Math.random() * (MAX_PIPE_HEIGHT - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
        pipes.push({
            x: canvas.width,
            top: randomTopHeight,         // Top height for top pipe
            bottom: randomTopHeight + gap, // Position for bottom pipe's top edge
            width: pipeWidth,            // Fixed width for the pipes
        });
    }, 2000); // Adjust pipe spawn interval if needed

    milkInterval = setInterval(() => {
        if (milk === null && pipes.length > 0) {
            const pipe = pipes[pipes.length - 1]; // Get the latest pipe

            // Randomize milk spawn in the gap between pipes
            const milkY = pipe.top + Math.random() * (gap - milkWidth);
            milk = {
                x: pipe.x + pipeWidth + Math.random() * 100 * scale, // Slight offset from the pipe
                y: milkY, // Spawn in the gap
            };
        }
    }, 2000);

    // Start the game loop
    gameLoop();
}


function restartGame() {
    // Reset game state variables
    isGameStarted = false;
    isGameOver = false;
    score = 0; // Reset score

    // Show necessary UI elements
    startButton.style.display = "block";
    restartButton.style.display = "none";
    leaderboardButton.style.display = "block";
    nicknameInput.style.display = "block";
    nicknameInput.value = ""; // Clear the nickname input

    // Draw the start screen
    drawStartScreen();
}

canvas.addEventListener("click", () => {
    if (isGameStarted && !isGameOver) {
        catVelocity = -5 * scale;
        isFarting = true;

        setTimeout(() => {
            isFarting = false;
        }, 200);
    }
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (isGameStarted && !isGameOver) {
        catVelocity = -5 * scale;
        isFarting = true;

        setTimeout(() => {
            isFarting = false;
        }, 200);
    }
});

startButton.addEventListener("click", () => {
    if (!isGameStarted) {
        startGame();
    }
});

restartButton.addEventListener("click", () => {
    restartGame();
});

leaderboardButton.addEventListener("click", () => {
    window.location.href = "leaderboard.html"; // Adjust this URL to your leaderboard page
});
