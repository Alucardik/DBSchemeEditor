import { Entity } from "@/libs/erd/entity"

export class CrowsFootNotation {
    static Entity = class extends Entity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 50
        private readonly headerHeight = 30
        private curWidth = this.minWidth
        private curAttributesHeight = this.minAttributesHeight

        Render(ctx: CanvasRenderingContext2D) {
            const centeredX = this.x - this.minWidth / 2
            const centeredY = this.y - this.headerHeight / 2

            ctx.strokeRect(centeredX, centeredY, this.curWidth, this.headerHeight)
            ctx.strokeRect(centeredX, centeredY + this.headerHeight, this.curWidth, this.curAttributesHeight)

            ctx.textAlign = "center"
            // ctx.fillStyle = "black"
            ctx.fillText(this.name, this.x, this.y, this.curWidth)
        }
    }
}