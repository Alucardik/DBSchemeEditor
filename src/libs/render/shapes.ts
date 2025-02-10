export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    Translate(this: Point, xOffset: number, yOffset: number) {
        return new Point(this.x + xOffset, this.y + yOffset)
    }
}

export class Rectangle {
    topLeftCorner: Point
    width: number
    height: number

    constructor(topLeftCorner: Point, width: number, height: number) {
        this.topLeftCorner = topLeftCorner
        this.width = width
        this.height = height
    }
}