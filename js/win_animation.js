// card throwing angle
const CARD_ANGLE_RANGE = {
    MIN: Math.PI * 9 / 16, // 9
    MAX: Math.PI * 14 / 16 // 15
}

// card speed
const CARD_SPEED = 6 * SCALE

// gravity
const GRAVITY = .8 * SCALE

// friction
const FRICTION = .2

// bounciness factor, 0-1
const BOUNCINESS = .8

// delay until next card starts animating
const CARD_DELAY = {
    MIN: 500,
    MAX: 700
}

// all cards to be animated
let full_win_animation_stack = []
let current_win_animation_stack = []

// start animating cards
function start_win_animation() {
    // keep track of how many cards are left
    let cards_left = 52

    // copy of put stacks count with
    let put_stacks_copy = JSON.parse(JSON.stringify(put_stacks))

    // last stack from which was popped from (to prevent popping twice in a row)
    let last_stack_x

    // animate all cards
    while (cards_left > 0) {
        // get non-empty put stacks
        let animatable_stack_indices = []
        put_stacks_copy.forEach((stack, x) => {
            if (stack.length > 0 && x != last_stack_x) animatable_stack_indices.push(x)
        })

        // get random index
        // if none animatable, fall back to last_stack_x
        let x = random_element(animatable_stack_indices)
        if (x === undefined) x = last_stack_x

        let y = put_stacks_copy[x].length - 1

        // get card
        let card = put_stacks_copy[x].pop()

        // get card image again
        card.image = put_stacks[x][put_stacks[x].length - 1 - y].image

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

        // push to track keeping stack
        full_win_animation_stack.push(card)

        // start the card animation after a random delay
        card.delay = setTimeout(() => {
            let animation_stack_index = full_win_animation_stack.findIndex(animation_card => animation_card == card)
            current_win_animation_stack.push(full_win_animation_stack.splice(animation_stack_index, 1)[0])
        }, random_range_i(CARD_DELAY.MIN, CARD_DELAY.MAX) * (y * 4 + x))

        // decrement cards left
        cards_left--
    }

    // start rendering
    requestAnimationFrame(win_animation_render_update)
}

// render the cards
function win_animation_render_update() {
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
    // save last position
    card.last_position = {
        x: card.position.x,
        y: card.position.y
    }

    // add gravity
    card.velocity.y += GRAVITY

    // get new position
    card.position = {
        x: card.position.x + card.velocity.x,
        y: card.position.y + card.velocity.y
    }

    // bounce off walls
    if (card.position.x >= (WIDTH * SCALE) - DESIGN.CARD.SIZE.X || card.position.x <= 0) {
        card.position.x = card.position.x <= 0 ? 0 : (WIDTH * SCALE) - DESIGN.CARD.SIZE.X
        card.velocity.x *= -1 * BOUNCINESS
        card.velocity.y *= (1 - FRICTION)
    }

    // bounce off ceiling or floor
    if (card.position.y >= (HEIGHT * SCALE) - DESIGN.CARD.SIZE.Y || card.position.y <= 0) {
        card.position.y = card.position.y <= 0 ? 0 : (HEIGHT * SCALE) - DESIGN.CARD.SIZE.Y
        card.velocity.y *= -1 * BOUNCINESS
        card.velocity.x *= (1 - FRICTION)
    }

    // draw the card
    draw_card(card, card.position.x, card.position.y)

    // stop rendering this card if not moving for 200ms
    // if card has moved
    let card_has_moved = card_moved(card)

    if (card_has_moved && card.move_timeout) {
        // clear timeout if moved
        clearTimeout(card.move_timeout)
        card.move_timeout = null
    } else if (!card_has_moved && !card.move_timeout) {
        // check if still hasn't moved after 200ms
        card.move_timeout = setTimeout(() => {
            if (!card_moved(card)) {
                // remove card from animation stack
                let card_index = current_win_animation_stack.findIndex(search_card =>
                    search_card.value == card.value &&
                    search_card.color == card.color
                )
                current_win_animation_stack.splice(card_index, 1)
            }
        }, 200)
    }
}

// if card has moved since last frame
function card_moved(card) {
    return Math.round(card.last_position.x * 10) != Math.round(card.position.x * 10) &&
        Math.round(card.last_position.y * 10) != Math.round(card.position.y * 10)
}

// stop/interrupt the win animation
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