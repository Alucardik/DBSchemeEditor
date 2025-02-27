import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Point } from "@/libs/render/shapes"

export class BaseRelationship {
    private firstPoint: Point
    private secondPoint: Point

    constructor(leftPoint: Point, rightPoint: Point) {
        this.firstPoint = leftPoint
        this.secondPoint = rightPoint
    }

    SetFirstPoint(point: Point) {
        this.firstPoint = point
    }

    SetSecondPoint(point: Point) {
        this.secondPoint = point
    }

    Render(this: BaseRelationship, ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"

        // TODO: prevent lines from crossing entities (add minYOffset / maxLevel?)
        const offsetX = Math.abs(this.secondPoint.x - this.firstPoint.x) / 2
        if (this.firstPoint.x > this.secondPoint.x) {
            const yOffset = (this.secondPoint.y - this.firstPoint.y) / 2

            ctx.beginPath()
            ctx.moveTo(this.firstPoint.x, this.firstPoint.y)
            ctx.lineTo(this.firstPoint.x + offsetX, this.firstPoint.y)
            ctx.moveTo(this.firstPoint.x + offsetX, this.firstPoint.y)
            ctx.lineTo(this.firstPoint.x + offsetX, this.firstPoint.y + yOffset)
            ctx.moveTo(this.firstPoint.x + offsetX, this.firstPoint.y + yOffset)
            ctx.lineTo(this.secondPoint.x - offsetX, this.firstPoint.y + yOffset)
            ctx.moveTo(this.secondPoint.x - offsetX, this.firstPoint.y + yOffset)
            ctx.lineTo(this.secondPoint.x - offsetX, this.secondPoint.y)
            ctx.moveTo(this.secondPoint.x - offsetX, this.secondPoint.y)
            ctx.lineTo(this.secondPoint.x, this.secondPoint.y)
            ctx.stroke()
        } else {
            const middlePointX = this.firstPoint.x + offsetX

            ctx.beginPath()
            ctx.moveTo(this.firstPoint.x, this.firstPoint.y)
            ctx.lineTo(middlePointX, this.firstPoint.y)
            ctx.moveTo(middlePointX, this.firstPoint.y)
            ctx.lineTo(middlePointX, this.secondPoint.y)
            ctx.moveTo(middlePointX, this.secondPoint.y)
            ctx.lineTo(this.secondPoint.x, this.secondPoint.y)
            ctx.stroke()
        }

        resetCanvasContextProps(ctx)
    }
}