// shuffle an array
Array.prototype.shuffle = function () {
    this.sort(() => (Math.random() > 0.5) ? 1 : -1)
    return this
}

// get a random element from an array
function random_element(array) {
    return array[random_range_i(0, array.length - 1)]
}

// draw a rectangle with rounded corners
CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
}

// load an image asynchronously
function load_image(path) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous' // to avoid CORS if used with Canvas
        img.src = path
        img.onload = () => {
            resolve(img)
        }
        img.onerror = e => {
            reject(e)
        }
    })
}

// random float between min and max inclusive
function random_range(min, max) {
    return min + (Math.random() * (max - min))
}

// random int between min and max inclusive
function random_range_i(min, max) {
    return Math.floor(min + (Math.random() * ((max + 1) - min)))
}

// check if mouse is in rectangle
function mouse_over(pos_x, pos_y, size_x, size_y) {
    return mouse_position.x >= pos_x && mouse_position.x <= pos_x + size_x && mouse_position.y >= pos_y && mouse_position.y <= pos_y + size_y
}

// deep clones a stack
function clone_stack(stack) {
    // create copy
    let copy = JSON.parse(JSON.stringify(stack))

    // set images
    if (copy[0].length && copy[0].length > 0) {
        for (let stack of copy) for (let card of stack) card.image = card_images[`${card.value}${card.color}`]
    } else for (let card of copy) card.image = card_images[`${card.value}${card.color}`]

    return copy
}

// linear interpolation for vectors
function vector_lerp(start, end, time) {
    return {
        x: (1 - time) * start.x + time * end.x,
        y: (1 - time) * start.y + time * end.y
    }
}