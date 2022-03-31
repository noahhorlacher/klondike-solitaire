// card throwing angle
const CARD_ANGLE_RANGE = {
    MIN: Math.PI * 9 / 16, // 9
    MAX: Math.PI * 14 / 16 // 15
}

// card speed
const CARD_SPEED = 4

// gravity
const GRAVITY = 2

// delay until next card starts animating
const CARD_DELAY = 500

// bounciness factor, 0-1
const BOUNCINESS = .9

let animation_stack

// start animating cards
function start_win_animation() {
    animation_stack = [...putstacks].map(stack => stack.reverse())
    for (let x = 0; x < putstacks.length; x++) {
        // get stack
        let putstack = animation_stack[x]

        for (let y = 0; y < putstack.length; y++) {
            // get card
            let card = putstack[y]

            // initial card position
            card.position = {
                x: DESIGN.PUTSTACKS[x].POSITION.X,
                y: DESIGN.PUTSTACKS[x].POSITION.Y
            }

            // random angle, flip randomly
            let angle = random_range(CARD_ANGLE_RANGE.MIN, CARD_ANGLE_RANGE.MAX) - Math.PI * .5

            // get velocity vector and flip x randomly
            card.velocity = {
                x: Math.cos(angle) * CARD_SPEED * (Math.random() > .5 ? -1 : 1),
                y: Math.sin(angle) * CARD_SPEED
            }

            // start the card animation after a random delay
            card.delay = setTimeout(() => card.interval = setInterval(() => card_win_animation(card), 1000 / FPS), CARD_DELAY * (y * 4 + x))
        }
    }
}

// animation of a single card
function card_win_animation(card) {
    // get the new position
    card.velocity.y += GRAVITY

    card.position = {
        x: card.position.x + card.velocity.x,
        y: card.position.y + card.velocity.y
    }

    // bounce off ceiling or floor
    if (card.position.y >= HEIGHT - DESIGN.CARD.SIZE.Y || card.position.y <= 0) {
        card.position.y = card.position.y <= 0 ? 0 : HEIGHT - DESIGN.CARD.SIZE.Y
        card.velocity.y *= -1 * BOUNCINESS
    }

    // draw the card
    draw_card(card, card.position.x, card.position.y)

    // stop rendering if out of view
    if (card.position.x > WIDTH || card.position.x < -DESIGN.CARD.SIZE.X) {
        clearInterval(card.interval)
        delete card.interval
    }
}