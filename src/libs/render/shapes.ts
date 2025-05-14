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

    Move(this: Point, xOffset: number, yOffset: number) {
        this.x += xOffset
        this.y += yOffset
    }

    Expand(this: Point): [number, number] {
        return [this.x, this.y]
    }
}

enum ShapeRenderMode {
    BodyOnly,
    OutlineOnly,
    BodyWithOutline,
}

interface Shape {
    GetPivotPoint(): Point
    ContainsPoint(point: Point): boolean
    Render(ctx: CanvasRenderingContext2D, renderMode: ShapeRenderMode): void
}

class Rectangle implements Shape {
    topLeftCorner: Point
    width: number
    height: number

    constructor(
        topLeftCornerX: number = 0,
        topLeftCornerY: number = 0,
        width: number = 0,
        height: number = 0,
    ) {
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

    Render(this: Rectangle, ctx: CanvasRenderingContext2D, renderMode: ShapeRenderMode = ShapeRenderMode.BodyWithOutline): void {
        if (renderMode !== ShapeRenderMode.OutlineOnly) {
            ctx.fillRect(this.topLeftCorner.x, this.topLeftCorner.y, this.width, this.height)
        }

        if (renderMode !== ShapeRenderMode.BodyOnly) {
            ctx.strokeRect(this.topLeftCorner.x, this.topLeftCorner.y, this.width, this.height)
        }
    }
}

class Ellipse implements Shape {
    center: Point
    xRadius: number
    yRadius: number

    constructor(center: Point = new Point(0, 0), xRadius: number = 0, yRadius: number = 0) {
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

    Render(this: Ellipse, ctx: CanvasRenderingContext2D, renderMode: ShapeRenderMode = ShapeRenderMode.BodyWithOutline ): void {
        ctx.beginPath()

        if (renderMode !== ShapeRenderMode.OutlineOnly) {
            ctx.ellipse(this.center.x, this.center.y, this.xRadius, this.yRadius, 0, 0, Math.PI * 2, false)
            ctx.fill()
        }

        if (renderMode !== ShapeRenderMode.BodyOnly) {
            ctx.stroke()
        }
    }
}

export type {
    Shape,
}

export {
    Point,
    ShapeRenderMode,
    Rectangle,
    Ellipse,
}