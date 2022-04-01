// card throwing angle
const CARD_ANGLE_RANGE = {
    MIN: Math.PI * 9 / 16, // 9
    MAX: Math.PI * 14 / 16 // 15
}

// card speed
const CARD_SPEED = 4 * SCALE

// gravity
const GRAVITY = 2 * SCALE

// delay until next card starts animating
const CARD_DELAY = 500

// bounciness factor, 0-1
const BOUNCINESS = .9

// all cards to be animated
let full_win_animation_stack = []
let current_win_animation_stack = []

// start animating cards
function start_win_animation() {
    // go through stacks
    for (let x = 0; x < put_stacks.length; x++) {
        // get stack
        let put_stack = [...[...put_stacks][x]]

        for (let y = 0; y < 13; y++) {
            // get card
            let card = put_stack.pop()

            // initial card position
            card.position = {
                x: DESIGN.PUT_STACKS[x].POSITION.X,
                y: DESIGN.PUT_STACKS[x].POSITION.Y
            }

            // random angle, flip randomly
            let angle = random_range(CARD_ANGLE_RANGE.MIN, CARD_ANGLE_RANGE.MAX) - Math.PI * .5

            // get velocity vector and flip x randomly
            card.velocity = {
                x: Math.cos(angle) * CARD_SPEED * (Math.random() > .5 ? -1 : 1),
                y: Math.sin(angle) * CARD_SPEED
            }

            full_win_animation_stack.push(card)

            // start the card animation after a random delay
            card.delay = setTimeout(() => current_win_animation_stack.push(full_win_animation_stack.pop()), CARD_DELAY * (y * 4 + x))
        }
    }

    // start rendering
    requestAnimationFrame(win_animation_render_update)
}

function win_animation_render_update() {
    console.log('render')
    // freeze rendering
    CTX.save()

    // render all cards
    for (let card of current_win_animation_stack) card_win_animation(card)

    // update rendering
    CTX.restore()

    // continue rendering if there are more cards to be rendered
    if (current_win_animation_stack.length > 0 || full_win_animation_stack.length > 0)
        requestAnimationFrame(win_animation_render_update)
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
    if (card.position.y >= (HEIGHT * SCALE) - DESIGN.CARD.SIZE.Y || card.position.y <= 0) {
        card.position.y = card.position.y <= 0 ? 0 : (HEIGHT * SCALE) - DESIGN.CARD.SIZE.Y
        card.velocity.y *= -1 * BOUNCINESS
    }

    // draw the card
    draw_card(card, card.position.x, card.position.y)

    // stop rendering if out of view
    if (card.position.x > (WIDTH * SCALE) || card.position.x < -DESIGN.CARD.SIZE.X) {
        let card_index = current_win_animation_stack.findIndex(search_card => search_card == card)
        current_win_animation_stack.splice(card_index, 1)
    }
}

function stop_win_animation() {
    // clear timeouts
    full_win_animation_stack?.forEach(card => {
        if ('delay' in card) {
            clearTimeout(card.delay)
            delete card.delay
        }
    })

    // reset animation stacks
    full_win_animation_stack = []
    current_win_animation_stack = []
}