import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Point } from "@/libs/render/shapes"
import type { KeyboardEvent } from "react"
import { Key } from "../utils/keys_enums"

export class Cursor {
    private readonly updateDurationMS = 500
    private updateTimestampMS = 0
    private letterIndex = -1
    private visible = true
    private position = new Point(-1, -1)
    private editedString: string = ""
    private wholeTextSelected: boolean = true

    private MoveLetterIndex(this: Cursor, delta: number) {
        this.letterIndex += delta
        this.letterIndex = Math.max(0, this.letterIndex)

        if (this.editedString.length > 0) {
            this.letterIndex = Math.min(this.letterIndex, this.editedString.length)
        }
    }

    IsUnset(this: Cursor) {
        return this.letterIndex === -1
    }

    Reset(this: Cursor) {
        this.letterIndex = -1
        this.updateTimestampMS = 0
        this.visible = true
        this.position.Set(-1, -1)
        this.wholeTextSelected = true
    }

    GetEditedString(this: Cursor): string {
        return this.editedString
    }

    SetEditedString(this: Cursor, editedString: string) {
        this.editedString = editedString
        this.letterIndex = this.editedString.length
    }

    HandleKeyInput(this: Cursor, e: KeyboardEvent): boolean {
        let metaAPressed = false

        switch (e.key) {
            case Key.Backspace:
                if (this.wholeTextSelected) {
                    this.editedString = ""
                    this.letterIndex = 0
                    break
                }

                this.editedString = this.editedString.slice(0, this.letterIndex-1) + this.editedString.slice(this.letterIndex)
                this.MoveLetterIndex(-1)
                break
            case Key.ArrowLeft:
                this.wholeTextSelected ?
                    this.letterIndex = 0 :
                    this.MoveLetterIndex(-1)
                break
            case Key.ArrowRight:
                this.wholeTextSelected ?
                    this.letterIndex = this.editedString.length :
                    this.MoveLetterIndex(1)
                break
            case "a":
                if (e.metaKey) {
                    metaAPressed = true
                    this.Reset()
                    break
                }
            default:
                if (this.wholeTextSelected) {
                    this.editedString = e.key
                    this.letterIndex = 1
                } else {
                    this.editedString = this.editedString.slice(0, this.letterIndex) + e.key + this.editedString.slice(this.letterIndex)
                    this.letterIndex >= 0 ? this.MoveLetterIndex(1) : this.letterIndex = this.editedString.length
                }
        }

        this.wholeTextSelected = metaAPressed

        return metaAPressed
    }

    IsUpdateNeeded(this: Cursor) {
        return Date.now() - this.updateTimestampMS >= this.updateDurationMS && !this.wholeTextSelected
    }

    UpdatePosition(this: Cursor, textPosition: Point, ctx: CanvasRenderingContext2D, isTextCentered: boolean = false) {
        const wholeTextInfo = ctx.measureText(this.editedString)
        const offsetTextInfo = ctx.measureText(this.editedString.slice(this.letterIndex))

        // TODO: parse font height
        this.position.x = textPosition.x - offsetTextInfo.width
        this.position.y = textPosition.y - 8

        isTextCentered ?
            this.position.x += wholeTextInfo.width / 2 :
            this.position.x += wholeTextInfo.width
    }

    Render(this: Cursor, ctx: CanvasRenderingContext2D, forceVisible: boolean = false) {
        this.updateTimestampMS = Date.now()

        this.visible = !this.visible
        if (forceVisible) {
            this.visible = true
        }

        this.visible ? ctx.fillStyle = "black" : ctx.fillStyle = "transparent"
        // TODO: parse font height
        ctx.fillRect(this.position.x, this.position.y, 1, 10)
        resetCanvasContextProps(ctx)
    }
}