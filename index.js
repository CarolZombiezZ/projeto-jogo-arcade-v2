const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1366
canvas.height = 768

c.fillRect(0, 0, canvas.width, canvas.height)

// Aumentamos a gravidade para o pulo não parecer que está na Lua
const gravity = 1.2 
let gameInterval 

const player = new Fighter({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    imageSrc: './img/samuraiMack/Idle.png',
    framesMax: 8,
    scale: 4.75,
    offset: { x: 215, y: 430 },
    sprites: {
        idle: { imageSrc: './img/samuraiMack/Idle.png', framesMax: 8 },
        run: { imageSrc: './img/samuraiMack/Run.png', framesMax: 8 },
        jump: { imageSrc: './img/samuraiMack/Jump.png', framesMax: 2 },
        fall: { imageSrc: './img/samuraiMack/Fall.png', framesMax: 2 },
        attack1: { imageSrc: './img/samuraiMack/Attack4.png', framesMax: 4 },
        takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', framesMax: 4 },
        death: { imageSrc: './img/samuraiMack/Death.png', framesMax: 6 }
    },
    attackBox: { offset: { x: 200, y: 45 }, width: 200, height: 50 }
})

const enemy = new Fighter({
    position: { x: 850, y: 100 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    imageSrc: './img/kenji/Idle.png',
    framesMax: 4,
    scale: 4.75,
    offset: { x: 300, y: 457 },
    sprites: {
        idle: { imageSrc: './img/kenji/Idle.png', framesMax: 4 },
        run: { imageSrc: './img/kenji/Run.png', framesMax: 8 },
        jump: { imageSrc: './img/kenji/Jump.png', framesMax: 2 },
        fall: { imageSrc: './img/kenji/Fall.png', framesMax: 2 },
        attack1: { imageSrc: './img/kenji/Attack1.png', framesMax: 4 },
        takeHit: { imageSrc: './img/kenji/Take-hit.png', framesMax: 4 },
        death: { imageSrc: './img/kenji/Death.png', framesMax: 7 }
    },
    attackBox: { offset: { x: -350, y: 40 }, width: 200, height: 50 }
})

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false }
}

function resetGame() {
    clearInterval(gameInterval)
    player.health = 100
    enemy.health = 100
    gsap.to('#playerHealth', { width: '100%' })
    gsap.to('#enemyHealth', { width: '100%' })
    player.position = { x: 0, y: 0 }
    enemy.position = { x: 850, y: 0 }
    player.velocity = { x: 0, y: 0 }
    enemy.velocity = { x: 0, y: 0 }
    player.dead = false
    enemy.dead = false
    player.switchSprite('idle')
    enemy.switchSprite('idle')
    document.querySelector('#displayText').style.display = 'none'
    document.querySelector('#resetButton').disabled = true
    timer = 60
    document.querySelector('#timer').innerHTML = timer
    gameInterval = setInterval(animate, 1000 / 60)
}

document.getElementById('resetButton').addEventListener('click', resetGame)

function animate() {
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()
    enemy.update()

    player.velocity.x = 0
    enemy.velocity.x = 0

    // Movimentação acelerada para compensar os 60 FPS
    if (keys.a.pressed && player.lastKey === 'a' && player.position.x > -145) {
        player.velocity.x = -12
        player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd' && player.position.x < 1080) {
        player.velocity.x = 12
        player.switchSprite('run')
    } else {
        player.switchSprite('idle')
    }

    if (player.velocity.y < 0) player.switchSprite('jump')
    else if (player.velocity.y > 0) player.switchSprite('fall')

    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft' && enemy.position.x > -59) {
        enemy.velocity.x = -12
        enemy.switchSprite('run')
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight' && enemy.position.x < 1200) {
        enemy.velocity.x = 12
        enemy.switchSprite('run')
    } else {
        enemy.switchSprite('idle')
    }

    if (enemy.velocity.y < 0) enemy.switchSprite('jump')
    else if (enemy.velocity.y > 0) enemy.switchSprite('fall')

    // Colisões
    if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && 
        player.isAttacking && player.framesCurrent === 2) {
        enemy.takeHit()
        player.isAttacking = false
        gsap.to('#enemyHealth', { width: enemy.health + '%' })
    }
    if (player.isAttacking && player.framesCurrent === 4) player.isAttacking = false

    if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && 
        enemy.isAttacking && enemy.framesCurrent === 2) {
        player.takeHit()
        enemy.isAttacking = false
        gsap.to('#playerHealth', { width: player.health + '%' })
    }
    if (enemy.isAttacking && enemy.framesCurrent === 2) enemy.isAttacking = false

    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({ player, enemy, timerID })
        document.querySelector('#resetButton').disabled = false
    }
}

gameInterval = setInterval(animate, 1000 / 60)
decreaseTimer()

window.addEventListener('keydown', (event) => {
    if (!player.dead) {
        switch (event.key) {
            case 'd': keys.d.pressed = true; player.lastKey = 'd'; break
            case 'a': keys.a.pressed = true; player.lastKey = 'a'; break
            // Pulo mais forte para vencer a gravidade maior
            case 'w': if (player.position.y >= 570) player.velocity.y = -25; break
            case ' ': player.attack(); break
        }
    }
    if (!enemy.dead) {
        switch (event.key) {
            case 'ArrowRight': keys.ArrowRight.pressed = true; enemy.lastKey = 'ArrowRight'; break
            case 'ArrowLeft': keys.ArrowLeft.pressed = true; enemy.lastKey = 'ArrowLeft'; break
            case 'ArrowUp': if (enemy.position.y >= 570) enemy.velocity.y = -25; break
            case 'ArrowDown': enemy.attack(); break
        }
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd': keys.d.pressed = false; break
        case 'a': keys.a.pressed = false; break
        case 'ArrowRight': keys.ArrowRight.pressed = false; break
        case 'ArrowLeft': keys.ArrowLeft.pressed = false; break
    }
})