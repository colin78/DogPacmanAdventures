const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ROWS = 30;
const COLS = 40;

let lucy, treats, powerUps, geese, score;
let gameRunning = false;

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

class GameObject {
    constructor(x, y, size, color, image) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.image = image;
    }

    draw() {
        if (this.image) {
            ctx.drawImage(this.image, this.x * CELL_SIZE, this.y * CELL_SIZE, this.size, this.size);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x * CELL_SIZE, this.y * CELL_SIZE, this.size, this.size);
        }
    }
}

class Lucy extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE * 2, '#FFD700', loadImage('dog_face_realistic.svg'));
        this.isEating = false;
        this.eatingFrames = [loadImage('dog_face_eating_1.svg'), loadImage('dog_face_eating_2.svg')];
        this.currentEatingFrame = 0;
        this.eatingAnimationDuration = 500;
        this.eatingAnimationStart = 0;
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 30000;
        this.hasZoomies = false;
        this.zoomiesSpeed = 1;
        this.zoomiesDuration = 10000;
        this.zoomiesTimer = 0;
    }

    move(direction) {
        const speed = this.hasZoomies ? this.zoomiesSpeed : 1;
        this.x += direction.x * speed;
        this.y += direction.y * speed;

        if (this.x < 0) this.x = COLS - 1;
        if (this.x >= COLS) this.x = 0;
        if (this.y < 0) this.y = ROWS - 1;
        if (this.y >= ROWS) this.y = 0;
    }

    moveRandomly() {
        if (this.hasZoomies) {
            const randomDirection = getRandomDirection();
            this.move(randomDirection);
        }
    }

    startEating() {
        this.isEating = true;
        this.eatingAnimationStart = Date.now();
    }

    startInvincibility() {
        this.isInvincible = true;
        this.invincibilityTimer = Date.now();
    }

    startZoomies() {
        this.hasZoomies = true;
        this.zoomiesTimer = Date.now();
        this.startInvincibility();
        showMessage("Bathtub zoomies activated!", 3000);
    }

    updatePowerUps() {
        if (this.isInvincible && Date.now() - this.invincibilityTimer >= this.invincibilityDuration) {
            this.isInvincible = false;
        }
        if (this.hasZoomies && Date.now() - this.zoomiesTimer >= this.zoomiesDuration) {
            this.hasZoomies = false;
        }
    }

    draw() {
        const drawX = this.x * CELL_SIZE - CELL_SIZE / 2;
        const drawY = this.y * CELL_SIZE - CELL_SIZE / 2;
        
        ctx.save();
        if (this.hasZoomies) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'hue-rotate(180deg) saturate(200%)';
        } else if (this.isInvincible) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'hue-rotate(180deg) saturate(200%)';
        }
        
        if (this.isEating) {
            const elapsedTime = Date.now() - this.eatingAnimationStart;
            if (elapsedTime < this.eatingAnimationDuration) {
                this.currentEatingFrame = Math.floor(elapsedTime / (this.eatingAnimationDuration / 2));
                ctx.drawImage(this.eatingFrames[this.currentEatingFrame], drawX, drawY, this.size, this.size);
            } else {
                this.isEating = false;
                ctx.drawImage(this.image, drawX, drawY, this.size, this.size);
            }
        } else {
            ctx.drawImage(this.image, drawX, drawY, this.size, this.size);
        }
        
        ctx.restore();
    }
}

class Treat extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE / 2, 'brown', loadImage('treat.svg'));
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        const image = loadImage(type === 'pizza' ? 'pizza.svg' : type === 'hamburger' ? 'hamburger.svg' : 'bathtub.svg');
        super(x, y, CELL_SIZE, 'green', image);
        this.type = type;
        console.log(`Created ${type} power-up at (${x}, ${y})`);
        if (!this.image) {
            console.error(`Failed to load image for ${type} power-up`);
        }
    }

    draw() {
        super.draw();
        console.log(`Drawing ${this.type} power-up at (${this.x}, ${this.y})`);
    }
}

class Goose extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE * 1.5, 'white');
        this.imageRight = loadImage('goose_large.svg');
        this.imageLeft = loadImage('goose_large_flipped.svg');
        this.direction = getRandomDirection();
        this.moveCounter = 0;
        this.moveFrequency = 16;
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 5000 + 5000;
        this.rotation = 0;
    }

    move() {
        this.moveCounter++;
        this.directionChangeTimer += 16;

        if (this.directionChangeTimer >= this.directionChangeInterval) {
            this.direction = getRandomDirection();
            this.directionChangeTimer = 0;
            this.directionChangeInterval = Math.random() * 10000 + 10000;
        }

        if (this.moveCounter >= this.moveFrequency) {
            this.moveCounter = 0;
            
            let newX = this.x + this.direction.x;
            let newY = this.y + this.direction.y;

            if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
                this.direction = getRandomDirection();
            } else {
                this.x = newX;
                this.y = newY;
            }

            if (this.direction.x === 1) this.rotation = 0;
            else if (this.direction.x === -1) this.rotation = Math.PI;
            else if (this.direction.y === -1) this.rotation = -Math.PI / 2;
            else if (this.direction.y === 1) this.rotation = Math.PI / 2;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x * CELL_SIZE + this.size / 2, this.y * CELL_SIZE + this.size / 2);
        
        if (this.direction.x === -1) {
            ctx.drawImage(this.imageLeft, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.rotate(this.rotation);
            ctx.drawImage(this.imageRight, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
    }
}

function loadImage(name) {
    const img = new Image();
    img.src = `/static/assets/${name}?v=${Date.now()}`;
    return img;
}

function getRandomDirection() {
    const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
    ];
    return directions[Math.floor(Math.random() * directions.length)];
}

function init() {
    lucy = new Lucy(Math.floor(COLS / 2), Math.floor(ROWS / 2));
    treats = [];
    powerUps = [];
    geese = [];
    score = 0;

    for (let i = 0; i < 100; i++) {
        treats.push(new Treat(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)));
    }

    for (let i = 0; i < 5; i++) {
        const type = Math.random() < 0.4 ? 'bathtub' : Math.random() < 0.7 ? 'pizza' : 'hamburger';
        powerUps.push(new PowerUp(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS), type));
    }

    for (let i = 0; i < 5; i++) {
        geese.push(new Goose(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)));
    }

    console.log(`Initialized ${powerUps.length} power-ups:`);
    powerUps.forEach((powerUp, index) => {
        console.log(`PowerUp ${index + 1}: ${powerUp.type} at (${powerUp.x}, ${powerUp.y})`);
    });
}

function update() {
    if (!gameRunning) return;

    lucy.updatePowerUps();
    lucy.moveRandomly();

    treats = treats.filter(treat => {
        if (lucy.x === treat.x && lucy.y === treat.y) {
            score += 10;
            playSound('eat.mp3');
            lucy.startEating();
            return false;
        }
        return true;
    });

    powerUps = powerUps.filter(powerUp => {
        if (lucy.x === powerUp.x && lucy.y === powerUp.y) {
            score += 50;
            playSound('powerup.mp3');
            lucy.startEating();
            if (powerUp.type === 'bathtub') {
                lucy.startZoomies();
            } else {
                lucy.startInvincibility();
            }
            console.log(`Collected PowerUp: ${powerUp.type}`);
            return false;
        }
        return true;
    });

    geese.forEach(goose => {
        goose.move();
        if (lucy.x === goose.x && lucy.y === goose.y && !lucy.isInvincible) {
            gameOver();
        }
    });

    if (treats.length === 0 && powerUps.length === 0) {
        gameWin();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    treats.forEach(treat => treat.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    geese.forEach(goose => goose.draw());
    lucy.draw();

    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(`Score: ${score}`, 10, 10);
    
    ctx.fillStyle = 'black';
    ctx.fillText(`Score: ${score}`, 10, 10);

    if (lucy.isInvincible) {
        const remainingTime = Math.ceil((lucy.invincibilityDuration - (Date.now() - lucy.invincibilityTimer)) / 1000);
        ctx.fillStyle = 'green';
        ctx.fillText(`Invincible: ${remainingTime}s`, 10, 40);
    }
    
    if (lucy.hasZoomies) {
        const remainingTime = Math.ceil((lucy.zoomiesDuration - (Date.now() - lucy.zoomiesTimer)) / 1000);
        ctx.fillText(`Zoomies: ${remainingTime}s`, 10, 70);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    init();
    gameRunning = true;
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    playSound('gameover.mp3');
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').style.display = 'flex';
}

function gameWin() {
    gameRunning = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.querySelector('#game-over-screen h1').textContent = 'You Win!';
}

function playSound(soundFile) {
    const audio = new Audio(`/static/assets/${soundFile}`);
    audio.play();
}

function showMessage(text, duration) {
    const messageElement = document.createElement('div');
    messageElement.textContent = text;
    messageElement.style.position = 'absolute';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.color = 'blue';
    messageElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '5px';
    document.body.appendChild(messageElement);

    setTimeout(() => {
        document.body.removeChild(messageElement);
    }, duration);
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    switch (e.key) {
        case 'ArrowUp':
            lucy.move(DIRECTIONS.UP);
            break;
        case 'ArrowDown':
            lucy.move(DIRECTIONS.DOWN);
            break;
        case 'ArrowLeft':
            lucy.move(DIRECTIONS.LEFT);
            break;
        case 'ArrowRight':
            lucy.move(DIRECTIONS.RIGHT);
            break;
    }
});

document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    startGame();
});

document.getElementById('play-again-button').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    startGame();
});

const restartButton = document.getElementById('restart-button');
restartButton.addEventListener('click', () => {
    if (gameRunning) {
        startGame();
    }
});

document.getElementById('game-over-screen').style.display = 'none';
restartButton.style.display = 'none';

document.getElementById('start-button').addEventListener('click', () => {
    restartButton.style.display = 'block';
});