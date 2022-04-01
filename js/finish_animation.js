// all current finish animations
let finish_animation_timeouts = []

const FINISH_ANIMATION_DELAY = 200

// animate all main stack cards to put stacks
function start_finish_animation() {
    // disable finish button
    UI.BTN_FINISH.setAttribute('disabled', true)

    // keep track of card animation delay
    let current_delay = 0

    // how many cards need to be displaced
    let remaining_cards = main_stacks.reduce((sum, stack) => sum + stack.length, 0)

    // use deep copy of main_stacks to remove checked cards
    let main_stacks_copy = JSON.parse(JSON.stringify(main_stacks))

    // use deep copy of main_stacks to push checked cards
    let put_stacks_copy = JSON.parse(JSON.stringify(put_stacks))

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
            return put_stack_index >= 0
        })

        // card found
        if (match_index >= 0) {
            let is_last_card = remaining_cards == 1
            // start animation
            finish_animation_timeouts.push(setTimeout(() => card_finish_animation({
                x: match_index,
                y: main_stacks_copy[match_index].length - 1
            }, put_stack_index, is_last_card), current_delay))

            // remove card from main stack copy
            let popped_card = main_stacks_copy[match_index].pop()

            // put card on put stack copy
            put_stacks_copy[put_stack_index].push(popped_card)

            // increase delay
            current_delay += FINISH_ANIMATION_DELAY

            // decrease amount of remaining cards
            remaining_cards--
        }
    }
}

// animation of a card being put on put stack
function card_finish_animation(main_stack_indices, put_stack_index, is_last_card) {
    // remove card from main stack
    let popped_card = main_stacks[main_stack_indices.x].splice(main_stack_indices.y, 1)[0]

    // push to put stack
    put_stacks[put_stack_index].push(popped_card)

    // update move count
    UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

    // if it's the last card
    if (is_last_card) {
        // stop timer
        clearInterval(timer)

        // clear animations
        finish_animation_timeouts = []

        // start the win animation
        start_win_animation()
    }

    render()
}

// stop/interrupt the animation
function stop_finish_animation() {
    // clear all timeouts
    finish_animation_timeouts.forEach(animation => clearTimeout(animation))
}