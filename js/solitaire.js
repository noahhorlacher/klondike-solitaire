// display settings
const WIDTH = 20 + 7 * 120, HEIGHT = 800;
const DESIGN = {
    BACKGROUND: {
        COLOR: "#68ab68"
    },
    STACK: {
        COLOR: "#fffb",
        LINEWIDTH: 2
    },
    PULLSTACK: {
        POSITION: {
            X: 20,
            Y: 20
        },
        STACKING_OFFSET: 20
    },
    PUTSTACKS: [
        { POSITION: { X: WIDTH - 1 * 120, Y: 20 } },
        { POSITION: { X: WIDTH - 2 * 120, Y: 20 } },
        { POSITION: { X: WIDTH - 3 * 120, Y: 20 } },
        { POSITION: { X: WIDTH - 4 * 120, Y: 20 } }
    ],
    MAINSTACKS: [
        { POSITION: { X: 20 + 0 * 120, Y: 240 } },
        { POSITION: { X: 20 + 1 * 120, Y: 240 } },
        { POSITION: { X: 20 + 2 * 120, Y: 240 } },
        { POSITION: { X: 20 + 3 * 120, Y: 240 } },
        { POSITION: { X: 20 + 4 * 120, Y: 240 } },
        { POSITION: { X: 20 + 5 * 120, Y: 240 } },
        { POSITION: { X: 20 + 6 * 120, Y: 240 } }
    ],
    CARD: {
        SIZE: {
            X: 100,
            Y: 140
        },
        RADIUS: 6,
        STACKING_OFFSET: {
            OPEN: 35,
            CLOSED: 10
        }
    },
    CARDS: []
}

// mouse position
let mouse_position = {
    x: null,
    y: null
}

// get canvas and context
const CANVAS = document.querySelector('canvas')
const CTX = CANVAS.getContext('2d')

// set width and height
CANVAS.width = WIDTH
CANVAS.height = HEIGHT

const CARD_VALUES = 'A23456789TJQK'.split('')
const CARD_COLORS = 'CDHS'.split('')

// game variables
let initial_card_states = []

// all card images for copying
let card_images = {}

// stacks for cards
let pullstack // top left, draw new cards
let putstacks // top right, final place for cards
let mainstacks // playing field

// how many cards of the pullstack lie open
let open_pullstack_cards

// drag and drop
let mousedown
let dragstack
let drag_position = {
    x: null,
    y: null
}

// flag if game is loading to skip rendering
let loading = true

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
    CTX.fillRect(0, 0, WIDTH, HEIGHT)

    // render stacks
    CTX.strokeStyle = DESIGN.STACK.COLOR
    CTX.lineWidth = DESIGN.STACK.LINEWIDTH

    // drawstack
    const STROKE_OFFSET = DESIGN.STACK.LINEWIDTH / 2
    CTX.roundRect(
        DESIGN.PULLSTACK.POSITION.X - STROKE_OFFSET,
        DESIGN.PULLSTACK.POSITION.Y - STROKE_OFFSET,
        DESIGN.CARD.SIZE.X + DESIGN.STACK.LINEWIDTH,
        DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINEWIDTH,
        DESIGN.CARD.RADIUS
    )
    CTX.stroke()

    // putstacks
    for (let putstack of DESIGN.PUTSTACKS) {
        CTX.roundRect(
            putstack.POSITION.X - STROKE_OFFSET,
            putstack.POSITION.Y - STROKE_OFFSET,
            DESIGN.CARD.SIZE.X + DESIGN.STACK.LINEWIDTH,
            DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINEWIDTH,
            DESIGN.CARD.RADIUS
        )
        CTX.stroke()
    }

    // main stacks
    for (let mainstack of DESIGN.MAINSTACKS) {
        CTX.roundRect(
            mainstack.POSITION.X - STROKE_OFFSET,
            mainstack.POSITION.Y - STROKE_OFFSET,
            DESIGN.CARD.SIZE.X + DESIGN.STACK.LINEWIDTH,
            DESIGN.CARD.SIZE.Y + DESIGN.STACK.LINEWIDTH,
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

// render the stack to pull from top left
function render_pullstack() {
    // render left pullstack side as one closed card
    if (pullstack.length - open_pullstack_cards > 0) {
        draw_card(
            null,
            DESIGN.PULLSTACK.POSITION.X,
            DESIGN.PULLSTACK.POSITION.Y
        )
    }

    // render right pullstack side
    if (open_pullstack_cards > 0) {
        const RIGHT_SIDE = [...pullstack].splice(
            pullstack.length - open_pullstack_cards,
            Math.min(open_pullstack_cards, 3) // max 3 cards
        )

        // open right side cards
        RIGHT_SIDE.forEach(card => card.open = true)
        // close all other cards
        pullstack.filter(card => !RIGHT_SIDE.includes(card)).forEach(card => card.open = false)

        // skip rendering cards that are in dragstack
        for (let i = 0; i < RIGHT_SIDE.length; i++) {
            let card = RIGHT_SIDE[RIGHT_SIDE.length - 1 - i]
            if (!dragstack.includes(card)) draw_card(
                card,
                DESIGN.PULLSTACK.POSITION.X + DESIGN.CARD.SIZE.X + 20 + i * DESIGN.PULLSTACK.STACKING_OFFSET,
                DESIGN.PULLSTACK.POSITION.Y
            )
            // save card position for drag and drop
            card.position = {
                x: DESIGN.PULLSTACK.POSITION.X + DESIGN.CARD.SIZE.X + 20 + i * DESIGN.PULLSTACK.STACKING_OFFSET,
                y: DESIGN.PULLSTACK.POSITION.Y
            }
        }
    }
}

// render the main playing stacks bottom
function render_mainstacks() {
    // render mainstacks
    for (let x = 0; x < 7; x++) {
        let current_offset = 0
        mainstacks[x].forEach((card, y) => {
            // save card position for drag and drop
            card.position = {
                x: DESIGN.MAINSTACKS[x].POSITION.X,
                y: DESIGN.MAINSTACKS[x].POSITION.Y + current_offset
            }

            // skip cards that are in dragstack
            if (!dragstack.includes(card)) {
                draw_card(
                    card, // show last card open
                    DESIGN.MAINSTACKS[x].POSITION.X,
                    DESIGN.MAINSTACKS[x].POSITION.Y + current_offset
                )
                if (y < mainstacks[x].length - 1) current_offset += DESIGN.CARD.STACKING_OFFSET[card.open ? 'OPEN' : 'CLOSED']
            }
        })
    }
}

// render the final stacks top right
function render_putstacks() {
    for (let x = 0; x < 4; x++) {
        if (putstacks[x].length > 0) {
            let card = putstacks[x][putstacks[x].length - 1]
            // skip rendering if in dragstack
            if (!dragstack.includes(card))
                draw_card(card, DESIGN.PUTSTACKS[i].POSITION.X, DESIGN.PUTSTACKS[i].POSITION.Y)

            // save card position for drag and drop
            card.position = {
                x: DESIGN.MAINSTACKS[x].POSITION.X,
                y: DESIGN.MAINSTACKS[x].POSITION.Y + current_offset
            }
        }
    }
}

// render the currently dragged stack
function render_dragstack() {
    dragstack.forEach(card => {
        let offset = {
            x: drag_position.x - card.position.x,
            y: drag_position.y - card.position.y
        }
        draw_card(card, mouse_position.x - offset.x, mouse_position.y - offset.y)
        delete card.position
    })
}

// render all cards
function render_cards() {
    render_pullstack()
    render_mainstacks()
    render_putstacks()
    render_dragstack()
}

// reset the game
function reset() {
    // reset game variables
    loading = true
    open_pullstack_cards = 0
    dragstack = []
    drag_position.x = drag_position.y = null

    // initialize stacks
    pullstack = []
    putstacks = [[], [], [], []]
    mainstacks = [[], [], [], [], [], [], []]

    // reset cards
    initial_card_states.forEach(card => card.open = false)

    // inject cards
    let cards = [...initial_card_states]

    // shuffle cards
    cards.shuffle()

    // put first 24 cards in pullstack
    pullstack = cards.splice(0, 24)

    // close pullstack cards
    pullstack.forEach(card => card.open = false)

    // put rest in mainstacks
    for (let i = 0; i < 7; i++) mainstacks[i] = cards.splice(0, i + 1)

    // open mainstack cards
    for (let i = 0; i < 7; i++) mainstacks[i][i].open = true

    loading = false

    // start rendering
    render()
}

// setup the game
async function setup() {
    // load card images
    // path prefix for card images
    const card_images_root = '/cards/'

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
    reset()
    /* TESTING */
    mainstacks[6][5].open = true
    render()
}

// if started dragging
function ondragstart() {
    // check if a card and which one is being dragged
    let dragcard

    // go through pullstack to check for drag (uppermost one counts)
    if (open_pullstack_cards > 0) {
        let pullstack_opencards = [...pullstack].filter(c => c.open === true)
        let pullstack_opencard = pullstack_opencards[0]
        if (mouse_over(
            pullstack_opencard.position.x,
            pullstack_opencard.position.y,
            DESIGN.CARD.SIZE.X,
            DESIGN.CARD.SIZE.Y
        )) dragcard = [pullstack_opencard]
    }

    // go through mainstacks to check for drag (uppermost one counts)
    for (let mainstack of mainstacks) {
        for (let card of mainstack.filter(c => c.open === true).reverse()) {
            if (mouse_over(
                card.position.x,
                card.position.y,
                DESIGN.CARD.SIZE.X,
                DESIGN.CARD.SIZE.Y
            )) {
                dragcard = [card]
                break
            }
        }
    }

    // go through putstacks to check for drag (uppermost one counts)
    for (let putstack of putstacks) {
        for (let card of putstack.filter(c => c.open === true).reverse()) {
            if (mouse_over(
                card.position.x,
                card.position.y,
                DESIGN.CARD.SIZE.X,
                DESIGN.CARD.SIZE.Y
            )) {
                dragcard = [card]
                break
            }
        }
    }

    // if cards are being dragged
    if (dragcard) {
        // if a card from mainstacks is dragged, check if there are cards on top
        if (mainstacks.some(s => s.includes(dragcard[0]))) {
            // get stack index
            let i = mainstacks.findIndex(s => s.includes(dragcard[0]))

            // if not last card of stack
            if (dragcard != [...mainstacks[i]].reverse()[0]) {
                // get card index
                let j = mainstacks[i].findIndex(c => c == dragcard[0])
                dragstack = [...mainstacks[i]].splice(j)
            }
        }

        drag_position.x = mouse_position.x
        drag_position.y = mouse_position.y
    } else {
        mousedown = false
    }
}

// while dragging
function ondrag() {
    render()
}

// if stopped dragging
function ondragend() {


    dragstack = []
}

// update mouse position and check for drag
document.addEventListener('mousemove', e => {
    // skip if loading
    if (loading) return

    // get mouse coordinates
    const RECT = CANVAS.getBoundingClientRect()
    mouse_position.x = e.clientX - RECT.left
    mouse_position.y = e.clientY - RECT.top

    // drag check
    if (dragstack.length > 0) ondrag()
    else if (mousedown) ondragstart()
})

// event checking
CANVAS.addEventListener('click', e => {
    // for drag check
    mousedown = false

    // skip if loading
    if (loading) return

    if (mouse_over(DESIGN.PULLSTACK.POSITION.X, DESIGN.PULLSTACK.POSITION.Y, DESIGN.CARD.SIZE.X, DESIGN.CARD.SIZE.Y)) {
        // clicked on pullstack left side
        // pull a card
        open_pullstack_cards = open_pullstack_cards == pullstack.length ? 0 : open_pullstack_cards + 1
    }

    render()
})

// check for drag and drop
CANVAS.addEventListener('mousedown', e => {
    mousedown = true
})
CANVAS.addEventListener('mouseup', e => {
    if (dragstack.length > 0) ondragend()
    mousedown = false
})

// reset button
document.querySelector('btn').addEventListener('click', reset)

// start
setup()