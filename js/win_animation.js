// card throwing angle
const CARD_ANGLE_RANGE = {
    MIN: Math.PI * 9 / 16, // 9
    MAX: Math.PI * 14 / 16 // 15
}

// card speed
const CARD_SPEED = 4 * SCALE

// gravity
const GRAVITY = 1 * SCALE

// delay until next card starts animating
const CARD_DELAY = {
    MIN: 500,
    MAX: 700
}

// bounciness factor, 0-1
const BOUNCINESS = .9

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
        let x = last_stack_x = random_element(animatable_stack_indices)
        console.log(x)
        let y = put_stacks_copy[x].length - 1

        // get card
        let card = put_stacks_copy[x].pop()

        console.log(card)

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