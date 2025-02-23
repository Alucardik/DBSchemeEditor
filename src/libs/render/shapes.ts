import { Square } from "@/libs/utils/math"

class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    Set(this: Point, x: number, y: number) {
        this.x = x
        this.y = y
    }

    Translate(this: Point, xOffset: number, yOffset: number) {
        return new Point(this.x + xOffset, this.y + yOffset)
    }
}

interface Shape {
    GetPivotPoint(): Point
    ContainsPoint(point: Point): boolean
    Render(ctx: CanvasRenderingContext2D, withOutline: boolean): void
}

class Rectangle implements Shape {
    topLeftCorner: Point
    width: number
    height: number

    constructor(topLeftCornerX: number, topLeftCornerY: number, width: number, height: number) {
        this.topLeftCorner = new Point(topLeftCornerX, topLeftCornerY)
        this.width = width
        this.height = height
    }

    GetPivotPoint(this: Rectangle): Point {
        return this.topLeftCorner.Translate(0, 0)
    }

    ContainsPoint(this: Rectangle, point: Point): boolean {
        return (point.x >= this.topLeftCorner.x && point.x <= this.topLeftCorner.x + this.width) &&
            (point.y >= this.topLeftCorner.y && point.y <= this.topLeftCorner.y + this.height)
    }

    Render(this: Rectangle, ctx: CanvasRenderingContext2D, withOutline: boolean = false): void {
        ctx.fillRect(this.topLeftCorner.x, this.topLeftCorner.y, this.width, this.height)
        if (withOutline) {
            ctx.strokeRect(this.topLeftCorner.x, this.topLeftCorner.y, this.width, this.height)
        }
    }
}

class Ellipse implements Shape {
    center: Point
    xRadius: number
    yRadius: number

    constructor(center: Point, xRadius: number, yRadius: number) {
        this.center = center
        this.xRadius = xRadius
        this.yRadius = yRadius
    }

    GetPivotPoint(this: Ellipse): Point {
        return this.center.Translate(0, 0)
    }

    ContainsPoint(this: Ellipse, point: Point): boolean {
        return Square(point.x - this.center.x) / Square(this.xRadius) +
            Square(point.y - this.center.y) / Square(this.yRadius) <= 1
    }

    Render(this: Ellipse, ctx: CanvasRenderingContext2D, withOutline: boolean = false): void {
        ctx.beginPath()
        ctx.ellipse(this.center.x, this.center.y, this.xRadius, this.yRadius, 0, 0, Math.PI * 2, false)
        ctx.fill()
        if (withOutline) {
            ctx.stroke()
        }
        ctx.closePath()
    }
}

// class MultiShape implements Shape {
//     private shapes: Shape[]
//
//     AddShapes(this: MultiShape, ...shapes: Shape[]) {
//         this.shapes.push(...shapes)
//     }
//
//     GetPivotPoint(this: MultiShape): Point {
//         if (this.shapes.length > 0) {
//             return this.shapes[0].GetPivotPoint()
//         }
//
//         return new Point(-1, -1)
//     }
//
//     ContainsPoint(this: MultiShape, point: Point): boolean {
//         return this.shapes
//     }
//
//     Render(this: MultiShape, ctx: CanvasRenderingContext2D, withOutline: boolean = false): void {
//
//     }
//
// }



export type {
    Shape,
}

export {
    Point,
    Rectangle,
    Ellipse,
}