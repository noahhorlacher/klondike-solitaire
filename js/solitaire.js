// display settings
const SCALE = 2
const WIDTH = 860, HEIGHT = 685;
const DESIGN = {
    BACKGROUND: {
        COLOR: "#68ab68"
    },
    STACK: {
        COLOR: "#fffb",
        LINE_WIDTH: 2 * SCALE
    },
    PULL_STACK: {
        POSITION: {
            X: 20 * SCALE,
            Y: 20 * SCALE
        },
        STACKING_OFFSET: 20 * SCALE
    },
    PUT_STACKS: [
        { POSITION: { X: (WIDTH - 1 * 120) * SCALE, Y: 20 * SCALE } },
        { POSITION: { X: (WIDTH - 2 * 120) * SCALE, Y: 20 * SCALE } },
        { POSITION: { X: (WIDTH - 3 * 120) * SCALE, Y: 20 * SCALE } },
        { POSITION: { X: (WIDTH - 4 * 120) * SCALE, Y: 20 * SCALE } }
    ],
    MAIN_STACKS: [
        { POSITION: { X: (20 + 0 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 1 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 2 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 3 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 4 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 5 * 120) * SCALE, Y: 180 * SCALE } },
        { POSITION: { X: (20 + 6 * 120) * SCALE, Y: 180 * SCALE } }
    ],
    CARD: {
        SIZE: {
            X: 90 * SCALE,
            Y: 126 * SCALE
        },
        RADIUS: 6 * SCALE,
        STACKING_OFFSET: {
            OPEN: 30 * SCALE,
            CLOSED: 10 * SCALE
        }
    }
}

// UI
const UI = {
    CANVAS: document.querySelector('canvas'),
    CONTAINER_CONTROLS: document.querySelector('#container_controls'),
    BTN_UNDO: document.querySelector('#btn_undo'),
    BTN_FINISH: document.querySelector('#btn_finish'),
    LABEL_TIMER: document.querySelector('#label_timer'),
    LABEL_MOVES: document.querySelector('#label_moves'),
    BTN_RESTART: document.querySelector('#btn_restart'),
    BTN_NEW_GAME: document.querySelector('#btn_new_game'),
    CONTAINER_LOADER: document.querySelector('#container_loader'),
    LABEL_LOADER: document.querySelector('#label_loader')
}

// mouse position relative to canvas
let mouse_position = {
    x: null,
    y: null
}

// get drawing context
const CTX = UI.CANVAS.getContext('2d')

// card properties
const CARD_VALUES = 'A23456789TJQK'.split('')
const CARD_COLORS = 'CDSH'.split('')
const CARD_COLOR_MATCH = {
    H: ['S', 'C'],
    D: ['S', 'C'],
    C: ['H', 'D'],
    S: ['H', 'D']
}

// for animations
const FPS = 60

// whether or not the game is over
let gameover

// count moves
let moves

// array of all cards to copy from
let initial_card_states = []

// all card images for copying
let card_images = {}

// stacks for cards
let pull_stack // top left, draw new cards
let put_stacks // top right, final place for cards
let main_stacks // playing field

// how many cards of the pull_stack lie open
let open_pull_stack_cards

// drag and drop
let mouse_down
let drag_stack
let drag_target
let drag_position = {
    x: null,
    y: null
}

// flag if game is loading to skip rendering
let loading = true

// for undo functionality
let last_action

// timer variables
let started, timer, start_time

// doubleclick variables
let click_timer, click_prevent = false
const CLICK_DELAY = 50

// copy of the canvas image to render dragging on top of
let snapshot

// deep copy of initial card configuration for resetting
let initial_configuration

// main rendering function
function render() {
    // render board
    render_board()

    // render cards
    render_cards()
}

// render the background and outlines
function render_board() {
    // render background
    CTX.fillStyle = DESIGN.BACKGROUND.COLOR
    CTX.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

    // render stacks
    CTX.strokeStyle = DESIGN.STACK.COLOR
    CTX.lineWidth = DESIGN.STACK.LINE_WIDTH

    // drawstack
    const STROKE_OFFSET = DESIGN.STACK.LINE_WIDTH / 2
    CTX.roundRect(
        DESIGN.PULL_STACK.POSITION.X - STROKE_OFFSET,
        DESIGN.PULL_STACK.POSITION.Y - STROKE_OFFSET,
        DESIGN.CARD.SIZE.X + DESIGN.STACK.LINE_WIDTH,
        DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINE_WIDTH,
        DESIGN.CARD.RADIUS
    )
    CTX.stroke()

    // put_stacks
    for (let putstack of DESIGN.PUT_STACKS) {
        CTX.roundRect(
            putstack.POSITION.X - STROKE_OFFSET,
            putstack.POSITION.Y - STROKE_OFFSET,
            DESIGN.CARD.SIZE.X + DESIGN.STACK.LINE_WIDTH,
            DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINE_WIDTH,
            DESIGN.CARD.RADIUS
        )
        CTX.stroke()
    }

    // main stacks
    for (let mainstack of DESIGN.MAIN_STACKS) {
        CTX.roundRect(
            mainstack.POSITION.X - STROKE_OFFSET,
            mainstack.POSITION.Y - STROKE_OFFSET,
            DESIGN.CARD.SIZE.X + DESIGN.STACK.LINE_WIDTH,
            DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINE_WIDTH,
            DESIGN.CARD.RADIUS
        )
        CTX.stroke()
    }
}

// draw one card
function draw_card(card, x, y) {
    let image = card?.open ? card.image : card_images['BACK']
    CTX.drawImage(image, x, y, DESIGN.CARD.SIZE.X, DESIGN.CARD.SIZE.Y)
}

// update card positions without rendering
function update_card_positions() {
    // pull stack
    if (open_pull_stack_cards > 0) {
        // right side of pull stack
        const RIGHT_SIDE = [...pull_stack].splice(
            pull_stack.length - open_pull_stack_cards,
            Math.min(open_pull_stack_cards, 3) // max 3 cards
        )

        // save card position
        for (let i = 0; i < RIGHT_SIDE.length; i++) RIGHT_SIDE[RIGHT_SIDE.length - 1 - i].position = {
            x: DESIGN.PULL_STACK.POSITION.X + DESIGN.CARD.SIZE.X + 20 + i * DESIGN.PULL_STACK.STACKING_OFFSET,
            y: DESIGN.PULL_STACK.POSITION.Y
        }
    }

    // main stacks
    for (let x = 0; x < 7; x++) {
        let current_offset = 0

        // update each card
        for (let y = 0; y < main_stacks[x].length; y++) {
            // the card
            let card = main_stacks[x][y]

            // save card position
            card.position = {
                x: DESIGN.MAIN_STACKS[x].POSITION.X,
                y: DESIGN.MAIN_STACKS[x].POSITION.Y + current_offset
            }

            // increment offset
            if (y < main_stacks[x].length - 1) current_offset += DESIGN.CARD.STACKING_OFFSET[card.open ? 'OPEN' : 'CLOSED']
        }
    }

    // put stacks
    put_stacks.forEach((putstack, x) => {
        // save card position if stack has cards
        if (putstack.length > 0) {
            putstack.at(-1).position = {
                x: DESIGN.PUT_STACKS[x].POSITION.X,
                y: DESIGN.PUT_STACKS[x].POSITION.Y
            }
        }
    })
}

// render the stack to pull from top left
function render_pull_stack() {
    // render left pull_stack side as one closed card
    if (pull_stack.length - open_pull_stack_cards > 0) {
        draw_card(
            null,
            DESIGN.PULL_STACK.POSITION.X,
            DESIGN.PULL_STACK.POSITION.Y
        )
    }

    // render right pull_stack side
    if (open_pull_stack_cards > 0) {
        const RIGHT_SIDE = [...pull_stack].splice(
            pull_stack.length - open_pull_stack_cards,
            Math.min(open_pull_stack_cards, 3) // max 3 cards
        )

        // open right side cards
        RIGHT_SIDE.forEach(card => card.open = true)
        // close all other cards
        pull_stack.filter(card => !RIGHT_SIDE.includes(card)).forEach(card => card.open = false)

        // skip rendering cards that are in drag_stack
        for (let i = 0; i < RIGHT_SIDE.length; i++) {
            let card = RIGHT_SIDE[RIGHT_SIDE.length - 1 - i]
            if (!drag_stack.includes(card)) draw_card(
                card,
                DESIGN.PULL_STACK.POSITION.X + DESIGN.CARD.SIZE.X + 20 + i * DESIGN.PULL_STACK.STACKING_OFFSET,
                DESIGN.PULL_STACK.POSITION.Y
            )
            // save card position for drag and drop
            card.position = {
                x: DESIGN.PULL_STACK.POSITION.X + DESIGN.CARD.SIZE.X + 20 + i * DESIGN.PULL_STACK.STACKING_OFFSET,
                y: DESIGN.PULL_STACK.POSITION.Y
            }
        }
    }
}

// render the main playing stacks bottom
function render_main_stacks() {
    // render main_stacks
    for (let x = 0; x < 7; x++) {
        let current_offset = 0

        // render each card
        for (let y = 0; y < main_stacks[x].length; y++) {
            let card = main_stacks[x][y]
            // save card position for drag and drop
            card.position = {
                x: DESIGN.MAIN_STACKS[x].POSITION.X,
                y: DESIGN.MAIN_STACKS[x].POSITION.Y + current_offset
            }

            // draw cards that aren't in drag_stack
            if (!drag_stack.includes(card)) {
                draw_card(
                    card, // show last card open
                    DESIGN.MAIN_STACKS[x].POSITION.X,
                    DESIGN.MAIN_STACKS[x].POSITION.Y + current_offset
                )
            }

            // increment offset
            if (y < main_stacks[x].length - 1) current_offset += DESIGN.CARD.STACKING_OFFSET[card.open ? 'OPEN' : 'CLOSED']
        }
    }
}

// render the final stacks top right
function render_put_stacks() {
    put_stacks.forEach((putstack, x) => {
        if (putstack.length > 0) {
            let card = putstack.at(-1)
            // render topmost card if not in drag_stack
            if (!drag_stack.includes(card))
                draw_card(card, DESIGN.PUT_STACKS[x].POSITION.X, DESIGN.PUT_STACKS[x].POSITION.Y)
            // else, render next card if there is one
            else if (putstack.length > 1)
                draw_card(putstack.at(-2), DESIGN.PUT_STACKS[x].POSITION.X, DESIGN.PUT_STACKS[x].POSITION.Y)

            // save card position for drag and drop
            putstack.at(-1).position = {
                x: DESIGN.PUT_STACKS[x].POSITION.X,
                y: DESIGN.PUT_STACKS[x].POSITION.Y
            }
        }
    })
}

// render the currently dragged stack
function render_drag_stack() {
    // render all drag stack cards
    drag_stack.forEach((card, i) => {
        // get card offset from original position
        let offset = {
            x: drag_position.x - card.position.x,
            y: drag_position.y - card.position.y
        }

        // restrict to boundaries
        let position = {
            x: Math.min(Math.max(mouse_position.x - offset.x, 0), (WIDTH * SCALE) - DESIGN.CARD.SIZE.X),
            y: Math.min(Math.max(mouse_position.y - offset.y, 0), (HEIGHT * SCALE) - DESIGN.CARD.SIZE.Y)
        }

        // draw the card
        draw_card(card, position.x, position.y)

        // remove position property
        delete drag_stack[i].position
    })
}

// render all cards
function render_cards() {
    render_pull_stack()
    render_main_stacks()
    render_put_stacks()
    render_drag_stack()
}

// reset all game variables
function reset_game_variables() {
    loading = true
    open_pull_stack_cards = 0
    drag_stack = []
    drag_position.x = drag_position.y = null
    drag_target = null
    gameover = false
    last_action = null
    moves = 0
    started = false
}

// reset the ui
function reset_ui() {
    // disable undo button
    UI.BTN_UNDO.setAttribute('disabled', true)

    // disable finish button
    UI.BTN_FINISH.setAttribute('disabled', true)

    // disable reset button
    UI.BTN_RESTART.setAttribute('disabled', true)

    // reset move display
    UI.LABEL_MOVES.textContent = `Moves: 0`
}

// start over
function restart() {
    // stop/interrupt the finish animation
    stop_finish_animation()

    // stop/interrupt the win animation
    stop_win_animation()

    // start loading animation
    start_load_animation()

    // reset game variables
    reset_game_variables()

    // clone stacks
    pull_stack = JSON.parse(JSON.stringify(initial_configuration.pull_stack))
    put_stacks = JSON.parse(JSON.stringify(initial_configuration.put_stacks))
    main_stacks = JSON.parse(JSON.stringify(initial_configuration.main_stacks))

    // set images again
    pull_stack.forEach(card =>
        card.image = initial_card_states.find(
            search_card =>
                search_card.color == card.color &&
                search_card.value == card.value
        ).image
    )
    main_stacks.forEach(stack => stack.forEach(card =>
        card.image = initial_card_states.find(
            search_card =>
                search_card.color == card.color &&
                search_card.value == card.value
        ).image
    ))
    put_stacks.forEach(stack => stack.forEach(card =>
        card.image = initial_card_states.find(
            search_card =>
                search_card.color == card.color &&
                search_card.value == card.value
        ).image
    ))

    // reset the gui
    reset_ui()

    // stop loading status
    loading = false

    // stop loading animation
    stop_load_animation()

    // render the board once
    render()

    // reset timer
    reset_timer()

    // rerender
    render()
}

// start new game
function new_game() {
    // stop/interrupt the finish animation
    stop_finish_animation()

    // stop/interrupt the win animation
    stop_win_animation()

    // start loading animation
    start_load_animation()

    // reset game variables
    reset_game_variables()

    // reset UI
    reset_ui()

    // stop/interrupt win animation
    stop_win_animation()

    // initialize stacks
    pull_stack = []
    put_stacks = [[], [], [], []]
    main_stacks = [[], [], [], [], [], [], []]

    // reset cards
    initial_card_states.forEach(card => card.open = false)

    // inject cards
    let cards = [...initial_card_states]

    // shuffle cards
    cards.shuffle()

    // put first 24 cards in pull_stack
    pull_stack = cards.splice(0, 24)

    // close pull_stack cards
    pull_stack.forEach(card => card.open = false)

    // put rest in main_stacks
    for (let i = 0; i < 7; i++) main_stacks[i] = cards.splice(0, i + 1)

    // open mainstack cards
    for (let i = 0; i < 7; i++) main_stacks[i][i].open = true

    // save initial card config
    initial_configuration = {
        pull_stack: JSON.parse(JSON.stringify(pull_stack)),
        put_stacks: JSON.parse(JSON.stringify(put_stacks)),
        main_stacks: JSON.parse(JSON.stringify(main_stacks))
    }

    // stop loading status
    loading = false

    // stop loading animation
    stop_load_animation()

    // render the board once
    render()

    // reset timer
    reset_timer()

    // fade in if not yet faded in
    if (!UI.CANVAS.classList.contains('loaded')) UI.CANVAS.classList.add('loaded')
}

// setup the game
async function setup() {
    // start load animation
    start_load_animation()

    // set canvas size
    UI.CANVAS.width = WIDTH * SCALE
    UI.CANVAS.height = HEIGHT * SCALE
    UI.CANVAS.style.width = `${WIDTH}px`
    UI.CANVAS.style.height = `${HEIGHT}px`

    // load card images
    // path prefix for card images
    const card_images_root = 'cards/'

    // load backside
    card_images.BACK = await load_image(`${card_images_root}2B.svg`)

    // load faces
    for (let value of CARD_VALUES)
        for (let color of CARD_COLORS)
            card_images[`${value}${color}`] = await load_image(`${card_images_root}${value}${color}.svg`)

    // make list of card ids to copy from
    for (let value of CARD_VALUES)
        for (let color of CARD_COLORS)
            initial_card_states.push({
                value: value,
                color: color,
                image: card_images[`${value}${color}`],
                open: false
            })

    // start
    new_game()
}

// undo the last step
function undo() {
    // ignore if no last action
    if (!last_action) return

    // cancel drag and drop
    mouse_down = false
    drag_stack = []

    if (last_action.action == 'drop') {
        // if dropped a card or stack of cards
        // if card was opened in last action, close again
        if (last_action.opened_card) main_stacks[last_action.drag_target.x].at(-1).open = false

        // remove dropped cards
        if (last_action.drop_target.where == 'main_stack') {
            let drop_target_stack = main_stacks[last_action.drop_target.x]
            drop_target_stack.splice(drop_target_stack.length - last_action.popped_cards.length)
        } else if (last_action.drop_target.where == 'put_stack') {
            let drop_target_stack = put_stacks[last_action.drop_target.x]
            drop_target_stack.splice(drop_target_stack.length - last_action.popped_cards.length)
        }

        // reinsert at old position
        if (last_action.drag_target.where == 'main_stack') {
            let drag_target_stack = main_stacks[last_action.drag_target.x]
            drag_target_stack.push(...last_action.popped_cards)
        } else if (last_action.drag_target.where == 'put_stack') {
            let drag_target_stack = put_stacks[last_action.drag_target.x]
            drag_target_stack.push(...last_action.popped_cards)
        } else if (last_action.drag_target.where == 'pull_stack') {
            let leftover = pull_stack.splice(last_action.drag_target.x)
            pull_stack = [...leftover.reverse(), ...last_action.popped_cards, ...pull_stack.reverse()].reverse()
            open_pull_stack_cards = last_action.old_open_pull_stack_cards
        }
    } else if (last_action.action == 'pull') {
        // if clicked on left side pull stack to reveal a card, undo
        open_pull_stack_cards = last_action.old_open_pull_stack_cards
    }

    // replace last action with last last action
    last_action = last_action.last_action

    if (!last_action) UI.BTN_UNDO.setAttribute('disabled', true)

    // decrement move count and update move display
    UI.LABEL_MOVES.textContent = `Moves: ${--moves}`

    // rerender
    render()
}

// solve and end the game (for testing win animation)
function solve() {
    // empty all stacks
    main_stacks = [[], [], [], [], [], [], []]
    pull_stack = []
    put_stacks = [[], [], [], []]

    // copy all cards
    let cards = [...initial_card_states]

    // put into stacks
    for (let card of cards) {
        card.open = true
        put_stacks[CARD_COLORS.indexOf(card.color)].push(card)
    }

    // start animation
    gameover = true

    render()
    start_win_animation()
}

// one step before solve (for testing win animation)
function almost_solve() {
    // empty all stacks
    main_stacks = [[], [], [], [], [], [], []]
    pull_stack = []
    put_stacks = [[], [], [], []]

    // copy all cards
    let cards = [...initial_card_states]

    // put into stacks
    for (let card of cards) {
        card.open = true
        put_stacks[CARD_COLORS.indexOf(card.color)].push(card)
    }

    // put king into main stack 3
    main_stacks[3].push(put_stacks[3].pop())

    // refresh
    render()
}

// one step before finish (for testing finish animation)
function before_finish() {
    // empty all stacks
    main_stacks = [[], [], [], [], [], [], []]
    pull_stack = []
    put_stacks = [[], [], [], []]

    // copy all cards
    let cards = [...initial_card_states]

    // put cards into main stacks in order
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 13; y++) {
            // get current value
            let current_value = [...CARD_VALUES].reverse()[y]
            // get current color, alternating red and black
            let current_color = CARD_COLORS[x + (y % 2)]

            // find matching card
            let splice_index = cards.findIndex(card => card.value == current_value && card.color == current_color)

            // remove card
            let card = cards.splice(splice_index, 1)[0]

            // open card
            card.open = true

            // remove matching card and insert
            main_stacks[x].push(card)
        }
    }

    // refresh
    render()

    // check for gameover to enable finish button
    check_gameover()
}

// check which card and stack is being hovered
function get_hover_target() {
    // update card positions
    update_card_positions()

    let hovered_card = null
    let hovered_stack = null

    // go through pull_stack to check for drag (uppermost one counts)
    if (
        open_pull_stack_cards > 0 &&
        mouse_position.y < DESIGN.MAIN_STACKS[0].POSITION.Y &&
        mouse_position.x < DESIGN.PUT_STACKS[3].POSITION.X
    ) {
        let opencard_index = [...pull_stack].findIndex(c => c.open === true)
        let pull_stack_opencard = pull_stack[opencard_index]

        if ('position' in pull_stack_opencard &&
            mouse_over(
                pull_stack_opencard.position.x,
                pull_stack_opencard.position.y,
                DESIGN.CARD.SIZE.X,
                DESIGN.CARD.SIZE.Y
            )) {
            hovered_card = pull_stack_opencard
            hovered_stack = {
                where: 'pull_stack',
                x: opencard_index,
                target_stack: pull_stack[opencard_index]
            }
        }
    }

    // go through put_stacks to check for drag (uppermost one counts)
    if (
        !hovered_card &&
        mouse_position.y < DESIGN.MAIN_STACKS[0].POSITION.Y &&
        mouse_position.x >= DESIGN.PUT_STACKS[3].POSITION.X
    ) {
        for (let x = 0; x < put_stacks.length; x++) {
            // if base is hovered
            if (mouse_over(
                DESIGN.PUT_STACKS[x].POSITION.X,
                DESIGN.PUT_STACKS[x].POSITION.Y,
                DESIGN.CARD.SIZE.X,
                DESIGN.CARD.SIZE.Y
            )) {
                hovered_stack = {
                    where: 'put_stack',
                    x: x,
                    target_stack: put_stacks[x]
                }
                hovered_card = put_stacks[x].at(-1)
                break
            }
        }
    }

    // go through main_stacks to check for drag (uppermost one counts)
    if (
        !hovered_card &&
        mouse_position.y > DESIGN.MAIN_STACKS[0].POSITION.Y
    ) {
        for (let x = 0; x < main_stacks.length; x++) {
            // if stack has cards
            if (main_stacks[x].length > 0) {
                // check if any card is hovered
                for (let y = main_stacks[x].length - 1; y >= 0; y--) {
                    let card = main_stacks[x][y]

                    // if card is hovered, has position, and is open
                    if (
                        card.open &&
                        'position' in card &&
                        mouse_over(
                            card.position.x,
                            card.position.y,
                            DESIGN.CARD.SIZE.X,
                            DESIGN.CARD.SIZE.Y
                        )
                    ) {
                        hovered_stack = {
                            where: 'main_stack',
                            x: x,
                            y: y,
                            target_stack: main_stacks[x]
                        }
                        hovered_card = card
                        break
                    }
                }

                // break if found
                if (hovered_card) break
            } else {
                // if stack is empty, check if stack is hovered
                if (
                    mouse_over(
                        DESIGN.MAIN_STACKS[x].POSITION.X,
                        DESIGN.MAIN_STACKS[x].POSITION.Y,
                        DESIGN.CARD.SIZE.X,
                        DESIGN.CARD.SIZE.Y
                    )
                ) {
                    hovered_stack = {
                        where: 'main_stack',
                        x: x,
                        y: 0,
                        target_stack: main_stacks[x]
                    }
                    break
                }
            }
        }
    }

    return {
        hovered_card: hovered_card,
        hovered_stack: hovered_stack
    }
}

// if started dragging
function handle_drag_start() {
    // check if a card and which one is being dragged
    let hover_target = get_hover_target()

    // if cards are being dragged
    if (hover_target.hovered_card) {
        // update drag target
        drag_target = hover_target.hovered_stack

        // if a card from main_stacks is dragged, check if there are cards on top
        if (hover_target.hovered_stack.where == 'main_stack') {
            // get hovered stack
            let hovered_stack = main_stacks[hover_target.hovered_stack.x]

            // if not last card of stack
            if (hover_target.hovered_stack.y < hovered_stack.length - 1) {
                // set the drag stack to all cards starting from dragged card
                drag_stack = [...hovered_stack].splice(hover_target.hovered_stack.y)
            } else {
                drag_stack = [hover_target.hovered_card]
            }
        } else drag_stack = [hover_target.hovered_card]

        // update drag position
        drag_position.x = mouse_position.x
        drag_position.y = mouse_position.y

        // render everything except drag stack
        render_board()
        render_pull_stack()
        render_put_stacks()
        render_main_stacks()

        // save the current render
        snapshot = CTX.getImageData(0, 0, WIDTH * SCALE, HEIGHT * SCALE)
    } else mouse_down = false
}

// while dragging, render drag stack on top of still image of board before draggin
function handle_drag() {
    // render board
    CTX.putImageData(snapshot, 0, 0)

    // update card positions
    update_card_positions()

    // render drack stack
    render_drag_stack()
}

// if stopped dragging
function handle_drag_end() {
    // get hovered stack
    let hover_target = get_hover_target()

    // delete canvas snapshot
    snapshot = null

    // if dropping on put or main stack and dropping on a different stack than starting stack
    if (
        hover_target.hovered_stack &&
        ['put_stack', 'main_stack'].includes(hover_target.hovered_stack.where) &&
        (
            hover_target.hovered_stack.where != drag_target.where ||
            hover_target.hovered_stack.x != drag_target.x
        )
    ) {
        // get drag stack
        let popped_cards = [...drag_stack]

        // check if move is valid
        if (check_for_match(hover_target.hovered_stack, popped_cards[0])) {
            // save action
            if (drag_target.where == 'pull_stack')
                last_action = {
                    action: 'drop',
                    drag_target: drag_target,
                    drop_target: hover_target.hovered_stack,
                    popped_cards: popped_cards,
                    opened_card: false,
                    old_open_pull_stack_cards: open_pull_stack_cards,
                    last_action: last_action
                }
            else
                last_action = {
                    action: 'drop',
                    drag_target: drag_target,
                    drop_target: hover_target.hovered_stack,
                    popped_cards: popped_cards,
                    opened_card: false,
                    last_action: last_action
                }

            // enable undo button
            UI.BTN_UNDO.setAttribute('disabled', false)

            // increment move count and update move display
            UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

            // start timer
            if (!started) on_start()

            // remove card from old stack
            if (drag_target.where == 'main_stack') {
                // remove cards from mainstack
                main_stacks[drag_target.x].splice(drag_target.y)
                // open uppermost card of drag target if it has one left
                if (main_stacks[drag_target.x].length > 0) {
                    main_stacks[drag_target.x].at(-1).open = true
                    last_action.opened_card = true
                }
            } else if (drag_target.where == 'put_stack') {
                // remove card from putstack
                put_stacks[drag_target.x].splice(put_stacks[drag_target.x].length - 1)
            } else if (drag_target.where == 'pull_stack') {
                // remove card from pull_stack
                pull_stack.splice(drag_target.x, 1)
                // decrement open pull_stack cards amount
                open_pull_stack_cards--
            }

            // push cards to new stack
            if (hover_target.hovered_stack.where == 'main_stack') main_stacks[hover_target.hovered_stack.x].push(...popped_cards)
            else if (hover_target.hovered_stack.where == 'put_stack') put_stacks[hover_target.hovered_stack.x].push(...popped_cards)

            // check if won/lost
            check_gameover()
        }
    }

    // empty drag_stack
    drag_stack = []

    // empty drag target
    drag_target = null

    // set mouse_down flag as false (complete drag)
    mouse_down = false

    // rerender
    render()
}

/* check if game is in a state where only the remaining main stacks cards
 would have to be dragged to put stacks in order to finish it */
function game_finishable() {
    // finishable if no pull stack cards left and all main stack cards are open
    return pull_stack.length == 0 && !main_stacks.some(stack => stack.some(card => card.open == false))
}

// get an array of possible moves
function get_possible_moves() {
    let possible_moves = []

    // check pull stack cards
    pull_stack.forEach((_card, x) => {
        // get card
        let card = pull_stack[pull_stack.length - 1 - x]

        // check for put stack matches 
        put_stacks.forEach((put_stack, x2) => {
            if (check_for_match({ where: 'put_stack', x: x2, target_stack: put_stack }, card))
                possible_moves.push({
                    drop_target: { where: 'put_stack', x: x2, target_stack: put_stack },
                    drop_card: card
                })
        })

        // check for main stack matches
        main_stacks.forEach((main_stack, x2) => {
            if (check_for_match({ where: 'main_stack', x: x2, target_stack: main_stack }, card))
                possible_moves.push({
                    drop_target: { where: 'main_stack', x: x2, target_stack: main_stack },
                    drop_card: card
                })
        })
    })

    // check main stack cards
    main_stacks.forEach(current_main_stack => {
        // skip if this stack is empty
        if (current_main_stack.length == 0) return

        // go through cards
        current_main_stack.forEach((card, y) => {
            // skip if card isn't open
            if (!card.open) return

            // check for put stack matches 
            put_stacks.forEach((put_stack, x2) => {
                if (check_for_match({ where: 'put_stack', x: x2, target_stack: put_stack }, card))
                    possible_moves.push({
                        drop_target: { where: 'put_stack', x: x2, target_stack: put_stack },
                        drop_card: card
                    })
            })

            // check for main stack matches
            main_stacks.forEach((main_stack, x2) => {
                // skip if drop single king on empty main stack
                if (main_stack.length == 0 && card.value == 'K' && y == 0) return

                if (check_for_match({ where: 'main_stack', x: x2, target_stack: main_stack }, card))
                    possible_moves.push({
                        drop_target: { where: 'main_stack', x: x2, target_stack: main_stack },
                        drop_card: card
                    })
            })
        })
    })

    console.log('possible moves:', possible_moves)

    return possible_moves
}

// check if won or game is unsolvable
function check_gameover() {
    if (!put_stacks.some(stack => stack.length != 13)) {
        // game won if put stacks all contain 13 cards
        gameover = true

        // disable undo button
        UI.BTN_UNDO.setAttribute('disabled', true)

        // stop timer
        stop_timer()

        // trigger rerender so card falls in place first
        render()

        // start the win animation
        start_win_animation()
    } else if (game_finishable()) {
        // enable finish button if game finishable
        UI.BTN_FINISH.setAttribute('disabled', false)
    } else if (get_possible_moves().length == 0) {
        // game lost
        gameover = true

        // disable undo button
        UI.BTN_UNDO.setAttribute('disabled', true)

        // stop timer
        stop_timer()

        // trigger rerender so card falls in place first
        render()

        // start the lost animation
        start_win_animation()
    }
}

// check if a card can be dropped on a target
function check_for_match(drop_target, drop_card) {
    if (!drop_card || !drop_target) return false
    else if (drop_target.where == 'put_stack') {
        let target_stack = drop_target.target_stack
        // can't drop card on already full putstack
        if (target_stack.length == 13) return false
        // can only drop single card on putstack
        if (drag_stack.length > 1) return false
        // if putstack empty, only ace drop is allowed
        if (target_stack.length == 0) return drop_card.value == 'A'
        // drop only same color and value one higher on non-empty putstack
        let top_card = target_stack.at(-1)
        if (
            top_card.color == drop_card.color &&
            CARD_VALUES.indexOf(top_card.value) == CARD_VALUES.indexOf(drop_card.value) - 1
        ) return true
    } else if (drop_target.where == 'main_stack') {
        let target_stack = drop_target.target_stack
        // if mainstack empty, only king drop is allowed
        if (target_stack.length == 0) return drop_card.value == 'K'
        // drop only opposite color and value one lower on non-empty mainstack
        let top_card = target_stack.at(-1)
        if (
            CARD_COLOR_MATCH[top_card.color].includes(drop_card.color) &&
            CARD_VALUES.indexOf(top_card.value) == CARD_VALUES.indexOf(drop_card.value) + 1
        ) return true
    }

    // else, no match
    return false
}

// first action was taken
function on_start() {
    // enable reset button
    UI.BTN_RESTART.setAttribute('disabled', false)

    // start timing
    start_timer()

    // set flag
    started = true
}

// start the timer
function start_timer() {
    start_time = new Date().getTime()
    timer = setInterval(() => {
        let t = new Date().getTime() - start_time
        let h = Math.floor(t / 3600000)
        h = h.toString().length == 1 ? '0' + h : h
        t -= h * 3600000
        let m = Math.floor(t / 60000)
        m = m.toString().length == 1 ? '0' + m : m
        t -= m * 60000
        let s = Math.floor(t / 1000)
        s = s.toString().length == 1 ? '0' + s : s
        t -= s * 1000

        UI.LABEL_TIMER.textContent = `Time: ${h}:${m}:${s}`
    }, 100)
    started = true
}

// stop the timer
function stop_timer() {
    if (timer) clearInterval(timer)
}

// reset the timer
function reset_timer() {
    if (timer) clearInterval(timer)
    UI.LABEL_TIMER.textContent = 'Time: 00:00:00'
}

// pull a card
function pull_card() {
    // ignore if no cards in pull stack
    if (pull_stack.length == 0) return

    // save action
    last_action = {
        action: 'pull',
        old_open_pull_stack_cards: open_pull_stack_cards,
        last_action: last_action
    }

    // enable undo button
    UI.BTN_UNDO.setAttribute('disabled', false)

    // increment move count and update move display
    UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

    // start timer
    if (!started) on_start()

    // pull a card
    open_pull_stack_cards = open_pull_stack_cards == pull_stack.length ? 0 : open_pull_stack_cards + 1

    // rerender
    render()
}

// handle click in canvas
function handle_click() {
    // for drag check
    mouse_down = false

    if (loading || gameover) return // skip if loading or game over

    // pull card on pull_stack left side click
    if (mouse_over(
        DESIGN.PULL_STACK.POSITION.X, DESIGN.PULL_STACK.POSITION.Y,
        DESIGN.CARD.SIZE.X, DESIGN.CARD.SIZE.Y)
    ) pull_card()
}

// place a card on available stack
function place_card(hover_target) {
    if (hover_target.hovered_stack.where == 'main_stack') {
        // if main stack double clicked
        if (hover_target.hovered_card.value == 'A') {
            // stack to pull card from
            let main_stack = main_stacks[hover_target.hovered_stack.x]

            // find free put stack
            let free_put_stack_index = [...put_stacks].findIndex(stack => stack.length == 0)
            let free_put_stack = put_stacks[free_put_stack_index]

            // remove card and put into put stacks
            let popped_card = main_stack.pop()
            free_put_stack.push(popped_card)

            // reveal uppermost card of main stack if has any
            let opened_card = false
            if (main_stack.length > 0) {
                opened_card = true
                main_stack.at(-1).open = true
            }

            // save action
            last_action = {
                action: 'drop',
                drag_target: hover_target.hovered_stack,
                drop_target: {
                    where: 'put_stack',
                    x: free_put_stack_index,
                    y: free_put_stack.length - 1
                },
                popped_cards: [popped_card],
                opened_card: opened_card,
                last_action: last_action
            }

            // enable undo button
            UI.BTN_UNDO.setAttribute('disabled', false)

            // increment move count and update move display
            UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

            // start timer
            if (!started) on_start()

            // rerender
            render()

            // check if won/lost
            check_gameover()
        } else {
            // place the card on a matching stack
            let target_stack

            // go through put stacks to find a match
            for (let x = 0; x < put_stacks.length; x++) {
                // if matches
                if (check_for_match({ where: 'put_stack', target_stack: put_stacks[x] }, hover_target.hovered_card)) {
                    // set target stack
                    target_stack = {
                        where: 'put_stack',
                        x: x
                    }
                    break
                }
            }

            // go through main stacks to find a match
            if (!target_stack) {
                for (let x = 0; x < main_stacks.length; x++) {
                    if (check_for_match({ where: 'main_stack', target_stack: main_stacks[x] }, hover_target.hovered_card)) {
                        // set target stack
                        target_stack = {
                            where: 'main_stack',
                            x: x
                        }
                        break
                    }
                }
            }

            if (target_stack) {
                // stack to pull card from
                let main_stack = main_stacks[hover_target.hovered_stack.x]

                // the card
                let popped_cards = main_stack.splice(hover_target.hovered_stack.y)

                // remove card and push to desired stack
                if (target_stack.where == 'put_stack') put_stacks[target_stack.x].push(...popped_cards)
                else if (target_stack.where == 'main_stack') main_stacks[target_stack.x].push(...popped_cards)

                // reveal uppermost card if has a closed card on top
                let opened_card = false
                if (main_stack.length > 0 && !main_stack.at(-1).open) main_stack.at(-1).open = opened_card = true

                if (target_stack.where == 'put_stack')
                    // save action
                    last_action = {
                        action: 'drop',
                        drag_target: hover_target.hovered_stack,
                        drop_target: {
                            where: 'put_stack',
                            x: target_stack.x,
                            y: put_stacks[target_stack.x].length - 1
                        },
                        popped_cards: popped_cards,
                        opened_card: opened_card,
                        last_action: last_action
                    }
                else if (target_stack.where == 'main_stack') last_action = {
                    action: 'drop',
                    drag_target: hover_target.hovered_stack,
                    drop_target: {
                        where: 'main_stack',
                        x: target_stack.x,
                        y: main_stacks[target_stack.x].length - 1
                    },
                    popped_cards: popped_cards,
                    opened_card: opened_card,
                    last_action: last_action
                }

                // enable undo button
                UI.BTN_UNDO.setAttribute('disabled', false)

                // increment move count and update move display
                UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

                // start timer
                if (!started) on_start()

                // rerender
                render()

                // check if won/lost
                check_gameover()
            }
        }
    } else if (hover_target.hovered_stack.where == 'pull_stack') {
        // if pull stack double clicked
        if (hover_target.hovered_card.value == 'A') {
            // find free put stack
            let free_put_stack_index = [...put_stacks].findIndex(stack => stack.length == 0)
            let free_put_stack = put_stacks[free_put_stack_index]

            // remove card from pull_stack and put into free put_stack
            let popped_cards = pull_stack.splice(hover_target.hovered_stack.x, 1)
            free_put_stack.push(...popped_cards)

            // open card
            free_put_stack.at(-1).open = true

            // save action
            last_action = {
                action: 'drop',
                drag_target: hover_target.hovered_stack,
                drop_target: {
                    where: 'put_stack',
                    x: free_put_stack_index,
                    y: free_put_stack.length - 1
                },
                popped_cards: popped_cards,
                opened_card: false,
                old_open_pull_stack_cards: open_pull_stack_cards,
                last_action: last_action
            }

            // decrement open pull_stack cards amount
            open_pull_stack_cards--

            // enable undo button
            UI.BTN_UNDO.setAttribute('disabled', false)

            // increment move count and update move display
            UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

            // start timer
            if (!started) on_start()

            render()

            // check if won/lost
            check_gameover()
        } else {
            // place the card on a matching stack
            let target_stack

            // go through put stacks to find a match
            for (let x = 0; x < put_stacks.length; x++) {
                // if matches
                if (check_for_match({ where: 'put_stack', target_stack: put_stacks[x] }, hover_target.hovered_card)) {
                    // set target stack
                    target_stack = {
                        where: 'put_stack',
                        x: x
                    }
                    break
                }
            }

            // go through main stacks to find a match
            if (!target_stack) {
                for (let x = 0; x < main_stacks.length; x++) {
                    if (check_for_match({ where: 'main_stack', target_stack: main_stacks[x] }, hover_target.hovered_card)) {
                        // set target stack
                        target_stack = {
                            where: 'main_stack',
                            x: x
                        }
                        break
                    }
                }
            }

            if (target_stack) {
                // remove card from pull_stack
                let popped_cards = pull_stack.splice(hover_target.hovered_stack.x, 1)

                // push to desired stack
                if (target_stack.where == 'put_stack') put_stacks[target_stack.x].push(...popped_cards)
                else if (target_stack.where == 'main_stack') main_stacks[target_stack.x].push(...popped_cards)

                if (target_stack.where == 'put_stack')
                    // save action
                    last_action = {
                        action: 'drop',
                        drag_target: hover_target.hovered_stack,
                        drop_target: {
                            where: 'put_stack',
                            x: target_stack.x,
                            y: put_stacks[target_stack.x].length - 1
                        },
                        popped_cards: popped_cards,
                        opened_card: false,
                        old_open_pull_stack_cards: open_pull_stack_cards,
                        last_action: last_action
                    }
                else if (target_stack.where == 'main_stack') last_action = {
                    action: 'drop',
                    drag_target: hover_target.hovered_stack,
                    drop_target: {
                        where: 'main_stack',
                        x: target_stack.x,
                        y: main_stacks[target_stack.x].length - 1
                    },
                    popped_cards: popped_cards,
                    opened_card: false,
                    old_open_pull_stack_cards: open_pull_stack_cards,
                    last_action: last_action
                }

                open_pull_stack_cards--

                // enable undo button
                UI.BTN_UNDO.setAttribute('disabled', false)

                // increment move count and update move display
                UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

                // start timer
                if (!started) on_start()

                // rerender
                render()

                // check if won/lost
                check_gameover()
            }
        }
    } else if (hover_target.hovered_stack.where == 'put_stack') {
        // if put stack double clicked
        // place the card on a matching stack
        let target_stack

        // go through main stacks to find a match
        for (let x = 0; x < main_stacks.length; x++) {
            if (check_for_match({ where: 'main_stack', target_stack: main_stacks[x] }, hover_target.hovered_card)) {
                // set target stack
                target_stack = {
                    where: 'main_stack',
                    x: x
                }
                break
            }
        }

        if (target_stack) {
            // stack to pull card from
            let put_stack = put_stacks[hover_target.hovered_stack.x]

            // remove card
            let popped_card = put_stack.pop()

            // push card to desired stack
            main_stacks[target_stack.x].push(popped_card)

            // save last action
            last_action = {
                action: 'drop',
                drag_target: hover_target.hovered_stack,
                drop_target: {
                    where: 'main_stack',
                    x: target_stack.x,
                    y: main_stacks[target_stack.x].length - 1
                },
                popped_cards: [popped_card],
                opened_card: false,
                last_action: last_action
            }

            // enable undo button
            UI.BTN_UNDO.setAttribute('disabled', false)

            // increment move count and update move display
            UI.LABEL_MOVES.textContent = `Moves: ${++moves}`

            // start timer
            if (!started) on_start()

            // rerender
            render()

            // check if won/lost
            check_gameover()
        }
    }
}

// handle doubleclick
function handle_doubleclick() {
    // for drag check
    mouse_down = false

    if (loading || gameover) return // skip if loading or game over

    // get hovered card
    let hover_target = get_hover_target()

    // if a card is hovered & card is open, automaticaly place
    if (hover_target.hovered_card?.open) place_card(hover_target)
}

// handle mousedown
function handle_mousedown() {
    mouse_down = true
}

// handle mouseup
function handle_mouseup() {
    if (drag_stack.length > 0) handle_drag_end()
    mouse_down = false
}

// start animation for putting remaining cards on putstack
function finish() {
    // cancel drag and drop
    mouse_down = false
    drag_stack = []

    // set gameover flag to disable interaction
    gameover = true

    // disable undo button
    UI.BTN_UNDO.setAttribute('disabled', true)

    // start the animation
    start_finish_animation()
}

// update mouse position and check for drag
document.addEventListener('mousemove', e => {
    if (loading || gameover) return // skip if loading or game over

    // get mouse coordinates
    const RECT = UI.CANVAS.getBoundingClientRect()
    mouse_position.x = (e.clientX - RECT.left) * SCALE
    mouse_position.y = (e.clientY - RECT.top) * SCALE

    // drag start check only when inside canvas, mouse down and not already dragging
    if (mouse_over(0, 0, WIDTH * SCALE, HEIGHT * SCALE) && mouse_down && !drag_target) handle_drag_start()
    // handle drag always
    else if (drag_stack.length > 0) handle_drag()
})

// check for click in canvas
UI.CANVAS.addEventListener('click', e => {
    // ignore if doubleclicked    
    click_timer = setTimeout(() => {
        if (!click_prevent) handle_click()
        click_prevent = false
    }, CLICK_DELAY)
})

// check for doubleclick in canvas
UI.CANVAS.addEventListener('dblclick', e => {
    clearTimeout(click_timer)
    click_prevent = true
    handle_doubleclick()
})

// check mouse down/up for drag and drop
UI.CANVAS.addEventListener('mousedown', handle_mousedown)
document.addEventListener('mouseup', handle_mouseup)

// button actions
UI.BTN_UNDO.addEventListener('click', () => {
    if (UI.BTN_UNDO.getAttribute('disabled') == 'false') undo()
})
UI.BTN_FINISH.addEventListener('click', () => {
    if (UI.BTN_FINISH.getAttribute('disabled') == 'false' && game_finishable()) finish()
})
UI.BTN_RESTART.addEventListener('click', restart)
UI.BTN_NEW_GAME.addEventListener('click', new_game)

// set width of button container
UI.CONTAINER_CONTROLS.style.width = `${WIDTH}px`

// start
setup()