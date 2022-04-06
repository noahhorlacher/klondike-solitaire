// animation length per card
const FINISH_ANIMATION_DELAY = 200

// stack of currently animated cards
let full_finish_animation_stack = []
let current_finish_animation_stack = []

// snapshot of the non-animated board
let finish_animation_snapshot

// increment of interpolation time
const TIME_INCREMENT = 14 * 1 / FPS

// animate all main stack cards to put stacks
function start_finish_animation() {
    // disable finish button
    UI.BTN_FINISH.setAttribute('disabled', true)

    // keep track of card animation delay
    let current_delay = 0

    // how many cards need to be displaced
    let remaining_cards = main_stacks.reduce((sum, stack) => sum + stack.length, 0)

    // use deep copy of put_stacks to push checked cards
    let put_stacks_copy = clone_stack(put_stacks)

    // use deep copy of main_stacks to pop checked cards
    let main_stacks_copy = clone_stack(main_stacks)

    // for all cards
    while (remaining_cards > 0) {
        // index of put stack to put card on
        let put_stack_index

        // go through uppermost cards of main stacks to check for match
        let match_index = main_stacks_copy.findIndex(main_stack => {
            // check if card matches some put stack
            put_stack_index = put_stacks_copy.findIndex((put_stack, x) => check_for_match(
                { where: 'put_stack', x: x, target_stack: put_stack }, main_stack.at(-1)
            ))
            return main_stack.length > 0 && put_stack_index >= 0
        })

        // card found
        if (match_index >= 0) {
            // pop the card
            let card = main_stacks_copy[match_index].pop()
            card.x = match_index
            card.y = main_stacks_copy[match_index].length - 1
            card.put_stack_index = put_stack_index
            card.is_last_card = remaining_cards == 1

            // push to animation stack
            full_finish_animation_stack.push(card)

            // save starting position
            card.start_position = {
                x: card.position.x,
                y: card.position.y
            }

            // set target position
            card.target_position = {
                x: DESIGN.PUT_STACKS[put_stack_index].POSITION.X,
                y: DESIGN.PUT_STACKS[put_stack_index].POSITION.Y
            }

            // initialize card time value
            card.time = 0

            // start timeout
            card.delay = setTimeout(() => {
                // remove from main stacks
                for (let main_stack of main_stacks) {
                    let idx = main_stack.findIndex(search_card => search_card.value == card.value && search_card.color == card.color)
                    if (idx >= 0) {
                        main_stack.splice(idx, 1)
                        break
                    }
                }

                // push to animation stack
                let animation_stack_index = full_finish_animation_stack.findIndex(animation_card => animation_card == card)
                current_finish_animation_stack.push(full_finish_animation_stack.splice(animation_stack_index, 1)[0])
            }, current_delay)

            // put card on put stack copy
            put_stacks_copy[put_stack_index].push(card)

            // increase delay
            current_delay += FINISH_ANIMATION_DELAY

            // decrease amount of remaining cards
            remaining_cards--
        }
    }

    // take snapshot
    render_board()
    finish_animation_snapshot = CTX.getImageData(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

    // start rendering
    requestAnimationFrame(finish_animation_render_update)
}

// render card finish animation
function card_finish_animation(card) {
    if (card.time >= 1) {
        // animation over
        // remove from animation stack
        let card_index = current_finish_animation_stack.findIndex(search_card =>
            search_card.value == card.value &&
            search_card.color == card.color
        )
        current_finish_animation_stack.splice(card_index, 1)

        // push to put stack
        put_stacks[card.put_stack_index].push(card)

        // update move count
        UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

        // if it's the last card
        if (card.is_last_card) {
            // stop timer
            clearInterval(timer)

            // stop animation
            stop_finish_animation()

            // start the win animation
            start_win_animation()
        }
    } else {
        // set new card position
        card.position = vector_lerp(card.start_position, card.target_position, card.time)
        // draw the card
        draw_card(card, card.position.x, card.position.y)
        // update draw value
        card.time = Math.min(card.time + TIME_INCREMENT, 1)
    }
}

// render the cards
function finish_animation_render_update() {
    // freeze rendering
    CTX.save()

    CTX.putImageData(finish_animation_snapshot, 0, 0)

    render_put_stacks()
    render_main_stacks()

    // render all cards
    for (let card of current_finish_animation_stack) card_finish_animation(card)

    // update rendering
    CTX.restore()

    // continue rendering if there are more cards to be rendered
    if (current_finish_animation_stack.length > 0 || full_finish_animation_stack.length > 0)
        requestAnimationFrame(finish_animation_render_update)
}

// stop/interrupt the animation
function stop_finish_animation() {
    // clear timeouts
    full_finish_animation_stack?.forEach(card => {
        if ('delay' in card) {
            clearTimeout(card.delay)
            delete card.delay
        }
    })

    // reset animation stacks
    full_finish_animation_stack = []
    current_finish_animation_stack = []
}