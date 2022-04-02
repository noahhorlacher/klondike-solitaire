// all shortcuts
let shortcuts = {
    'N': new_game,
    'R': e => {
        if (started) restart()
    },
    'U': undo,
    'Z': undo,
    ' ': e => {
        e.preventDefault()
        pull_card()
    },
    'F': e => {
        if (game_finishable()) finish()
    }
}

// execute shortcuts on keypress
document.addEventListener('keydown', e => {
    if (e.key.toUpperCase() in shortcuts) shortcuts[e.key.toUpperCase()](e)
})