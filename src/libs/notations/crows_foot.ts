import { Entity } from "@/libs/erd/entity"
import { Point } from "@/libs/render/shapes"

export class CrowsFootNotation {
    static Entity = class extends Entity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 50
        private readonly headerHeight = 30

        private curWidth = this.minWidth
        private curAttributesHeight = this.minAttributesHeight

        override GetPosition(): Point {
            return this.position.Translate(-this.curWidth / 2, -this.headerHeight / 2)
        }

        GetWidth(): number {
            return this.curWidth
        }

        GetHeight(): number {
            return this.headerHeight + this.curAttributesHeight
        }

        Render(ctx: CanvasRenderingContext2D) {
            const centeredPos = this.position.Translate(-this.curWidth / 2, -this.headerHeight / 2)

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