// start loading animation
function start_load_animation() {
    // start animation only if still loading after 0.5 seconds
    let load_timeout = setTimeout(() => {
        if (loading) {
            // render the board
            render_board()

            // show loader 
            UI.CONTAINER_LOADER.style.display = null

            // start css animation
            UI.CONTAINER_LOADER.classList.add('loading')
        }
    }, 500)
}

// stop loading animation
function stop_load_animation() {
    // stop css animation
    UI.CONTAINER_LOADER.classList.remove('loading')

    // set display to none after fade out
    setTimeout(() => UI.CONTAINER_LOADER.style.display = 'none', 500)
}