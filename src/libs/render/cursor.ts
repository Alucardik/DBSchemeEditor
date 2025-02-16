import { Point } from "@/libs/render/shapes"

export class Cursor {
    private readonly updateDurationMS = 500
    private updateTimestampMS = 0
    private letterIndex = -1
    private state = 1
    private position = new Point(-1, -1)

    Reset(this: Cursor) {
        this.letterIndex = -1
        this.updateTimestampMS = 0
        this.state = 1
        this.position.Set(-1, -1)
    }

    GetLetterIndex(this: Cursor) {
        return this.letterIndex
    }

    IsLetterIndexUnset(this: Cursor) {
        return this.letterIndex === -1
    }

    SetLetterIndex(this: Cursor, index: number) {
        this.letterIndex = index
    }

    MoveLetterIndex(this: Cursor, delta: number, maxLetterIndex: number = -1) {
        this.letterIndex += delta
        this.letterIndex = Math.max(0, this.letterIndex)
        
        if (maxLetterIndex > 0) {
            this.letterIndex = Math.min(this.letterIndex, maxLetterIndex)
        }

    }

    IsUpdateNeeded(this: Cursor) {
        return Date.now() - this.updateTimestampMS >= this.updateDurationMS
    }

    Update(this: Cursor, ctx: CanvasRenderingContext2D, force: boolean = false) {
        this.updateTimestampMS = Date.now()

        this.state = (this.state + 1) % 2
        if (force) {
            this.state = 1
        }

        this.state ? ctx.fillStyle = "black" : ctx.fillStyle = "transparent"

        ctx.fillRect(this.position.x, this.position.y, 1, 10)
        ctx.fillStyle = "black"
    }

    SetPosition(this: Cursor, position: Point) {
        this.position = position
    }
}