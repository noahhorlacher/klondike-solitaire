// all shortcuts
let shortcuts = {
    'N': reset,
    'R': reset,
    'U': undo,
    'Z': undo,
    ' ': e => {
        e.preventDefault()
        pull_card()
    },
    'F': f => {
        if (game_finishable()) finish()
    }
}

// execute shortcuts on keypress
document.addEventListener('keydown', e => {
    if (e.key.toUpperCase() in shortcuts) shortcuts[e.key.toUpperCase()](e)
})