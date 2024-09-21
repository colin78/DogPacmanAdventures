const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ROWS = 30;
const COLS = 40;

let lucy, treats, powerUps, geese, score;

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
        super(x, y, CELL_SIZE * 2, '#FFD700', loadImage('lucy.svg'));
        this.isEating = false;
        this.eatingFrames = [loadImage('lucy_eating1.svg'), loadImage('lucy_eating2.svg')];
        this.currentEatingFrame = 0;
        this.eatingAnimationDuration = 500;
        this.eatingAnimationStart = 0;
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 30000; // 30 seconds
        this.hasZoomies = false;
        this.zoomiesSpeed = 2; // Double speed during Zoomies
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

    startEating() {
        this.isEating = true;
        this.eatingAnimationStart = Date.now();
    }

    startInvincibility() {
        this.isInvincible = true;
        this.hasZoomies = true;
        this.invincibilityTimer = Date.now();
    }

    updateInvincibility() {
        if (this.isInvincible && Date.now() - this.invincibilityTimer >= this.invincibilityDuration) {
            this.isInvincible = false;
            this.hasZoomies = false;
        }
    }

    draw() {
        const drawX = this.x * CELL_SIZE - CELL_SIZE / 2;
        const drawY = this.y * CELL_SIZE - CELL_SIZE / 2;
        
        ctx.save();
        if (this.isInvincible) {
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
        super(x, y, CELL_SIZE, 'green', loadImage(type === 'pizza' ? 'pizza.svg' : type === 'hamburger' ? 'hamburger.svg' : 'bathtub.svg'));
        this.type = type;
    }
}

class Goose extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE * 1.5, 'white', loadImage('goose.svg'));
        this.direction = getRandomDirection();
        this.moveCounter = 0;
        this.moveFrequency = 16;
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 5000 + 5000;
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
        }
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
        const type = Math.random() < 0.33 ? 'pizza' : Math.random() < 0.66 ? 'hamburger' : 'bathtub';
        powerUps.push(new PowerUp(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS), type));
    }

    for (let i = 0; i < 5; i++) {
        geese.push(new Goose(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)));
    }
}

function update() {
    lucy.updateInvincibility();

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
                lucy.startInvincibility();
            }
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
        ctx.fillStyle = 'blue';
        ctx.fillText(`Invincible: ${remainingTime}s`, 10, 40);
        
        if (lucy.hasZoomies) {
            ctx.fillStyle = 'purple';
            ctx.fillText('Zoomies Active!', 10, 70);
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    playSound('gameover.mp3');
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').style.display = 'flex';
}

function gameWin() {
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.querySelector('#game-over-screen h1').textContent = 'You Win!';
}

function playSound(soundFile) {
    const audio = new Audio(`/static/assets/${soundFile}`);
    audio.play();
}

document.addEventListener('keydown', (e) => {
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
    init();
    gameLoop();
});

document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    init();
});

document.getElementById('game-over-screen').style.display = 'none';
