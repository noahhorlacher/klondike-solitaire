// shuffle an array
Array.prototype.shuffle = function () {
    this.sort(() => (Math.random() > 0.5) ? 1 : -1)
    return this
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

// check if mouse is in rectangle
function mouse_over(pos_x, pos_y, size_x, size_y) {
    return mouse_position.x >= pos_x && mouse_position.x <= pos_x + size_x && mouse_position.y >= pos_y && mouse_position.y <= pos_y + size_y
}