const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 20;
const ROWS = 30;
const COLS = 40;

let lucy, treats, powerUps, enemies, score;

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
        super(x, y, CELL_SIZE, 'yellow', loadImage('lucy.svg'));
        this.direction = DIRECTIONS.RIGHT;
    }

    move() {
        this.x += this.direction.x;
        this.y += this.direction.y;

        if (this.x < 0) this.x = COLS - 1;
        if (this.x >= COLS) this.x = 0;
        if (this.y < 0) this.y = ROWS - 1;
        if (this.y >= ROWS) this.y = 0;
    }
}

class Treat extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE / 2, 'brown', loadImage('treat.svg'));
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y, CELL_SIZE, 'green', loadImage(type === 'pizza' ? 'pizza.svg' : 'hamburger.svg'));
        this.type = type;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, CELL_SIZE, 'red', loadImage('person.svg'));
        this.direction = getRandomDirection();
    }

    move() {
        if (Math.random() < 0.1) {
            this.direction = getRandomDirection();
        }

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

function loadImage(name) {
    const img = new Image();
    img.src = `/static/assets/${name}`;
    return img;
}

function getRandomDirection() {
    const directions = Object.values(DIRECTIONS);
    return directions[Math.floor(Math.random() * directions.length)];
}

function init() {
    lucy = new Lucy(0, 0);
    treats = [];
    powerUps = [];
    enemies = [];
    score = 0;

    // Generate treats
    for (let i = 0; i < 100; i++) {
        treats.push(new Treat(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)));
    }

    // Generate power-ups
    for (let i = 0; i < 5; i++) {
        const type = Math.random() < 0.5 ? 'pizza' : 'hamburger';
        powerUps.push(new PowerUp(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS), type));
    }

    // Generate enemies
    for (let i = 0; i < 4; i++) {
        enemies.push(new Enemy(Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)));
    }
}

function update() {
    lucy.move();

    // Check for treat collection
    treats = treats.filter(treat => {
        if (lucy.x === treat.x && lucy.y === treat.y) {
            score += 10;
            playSound('eat.mp3');
            return false;
        }
        return true;
    });

    // Check for power-up collection
    powerUps = powerUps.filter(powerUp => {
        if (lucy.x === powerUp.x && lucy.y === powerUp.y) {
            score += 50;
            playSound('eat.mp3');
            return false;
        }
        return true;
    });

    // Move enemies
    enemies.forEach(enemy => {
        enemy.move();
        if (lucy.x === enemy.x && lucy.y === enemy.y) {
            gameOver();
        }
    });

    // Check win condition
    if (treats.length === 0 && powerUps.length === 0) {
        gameWin();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    treats.forEach(treat => treat.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    enemies.forEach(enemy => enemy.draw());
    lucy.draw();

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
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
            lucy.direction = DIRECTIONS.UP;
            break;
        case 'ArrowDown':
            lucy.direction = DIRECTIONS.DOWN;
            break;
        case 'ArrowLeft':
            lucy.direction = DIRECTIONS.LEFT;
            break;
        case 'ArrowRight':
            lucy.direction = DIRECTIONS.RIGHT;
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

// Initial setup
document.getElementById('game-over-screen').style.display = 'none';
