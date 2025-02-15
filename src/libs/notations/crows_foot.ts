import { BaseEntity } from "@/libs/erd/base_entity"
import { Point } from "@/libs/render/shapes"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFootNotation"
    }

    export class Entity extends BaseEntity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 50
        private readonly headerHeight = 30

        private curWidth = this.minWidth
        private curAttributesHeight = this.minAttributesHeight
        // TODO: save styles, related to each entity rather than context

        HighlightHeader(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.globalAlpha = 0.2
            ctx.fillStyle = "blue"
            // TODO: parse height from font
            const textWidth = ctx.measureText(this.name).width + 8
            const fontHeight = 10
            ctx.fillRect(this.position.x - textWidth / 2, this.position.y - fontHeight + 1, textWidth, fontHeight + 2)

            ctx.globalAlpha = 1
            ctx.fillStyle = "black"
        }

        GetHeaderHeight(this: Entity): number {
            return this.headerHeight
        }

        GetCenteredPosition(this: Entity): Point {
            return this.position.Translate(-this.curWidth / 2, -this.headerHeight / 2)
        }

        GetWidth(this: Entity): number {
            return this.curWidth
        }

        GetHeight(this: Entity): number {
            return this.headerHeight + this.curAttributesHeight
        }

        Render(this: Entity, ctx: CanvasRenderingContext2D) {
            const centeredPos = this.GetCenteredPosition()

            // TODO: write function to reset fill styles to default values
            ctx.fillStyle = "white"

            // header
            ctx.fillRect(centeredPos.x, centeredPos.y, this.curWidth, this.headerHeight)
            ctx.strokeRect(centeredPos.x, centeredPos.y, this.curWidth, this.headerHeight)

            // attributes
            ctx.fillRect(centeredPos.x, centeredPos.y + this.headerHeight, this.curWidth, this.curAttributesHeight)
            ctx.strokeRect(centeredPos.x, centeredPos.y + this.headerHeight, this.curWidth, this.curAttributesHeight)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.name, this.position.x, this.position.y, this.curWidth)
        }
    }
}