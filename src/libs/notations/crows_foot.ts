import { BaseEntity, EntityPart } from "@/libs/erd/base_entity"
import { Point, Rectangle } from "@/libs/render/shapes"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import type { Optional } from "@/libs/utils/types"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFoot"
    }

    export class Entity extends BaseEntity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 50
        private readonly headerHeight = 30

        private readonly header:  EntityPart<Rectangle>
        private readonly attributesContainer: EntityPart<Rectangle>
        private selectedPartName: Optional<string>
        // TODO: save styles, related to each entity rather than context

        constructor(name: string, x: number = 0, y: number = 0) {
            super(name)

            this.header = new EntityPart("header", new Rectangle(x, y, this.minWidth, this.headerHeight))
            this.attributesContainer = new EntityPart("attributes", new Rectangle(x, y + this.headerHeight, this.minWidth, this.minAttributesHeight))
            this.selectedPartName = null

            this.header.SetText(this.name)
        }

        private GetHeaderTextPosition(): Point {
            return this.header.shape.GetPivotPoint().Translate(
                this.header.shape.width / 2,
                this.header.shape.height / 2,
            )
        }

        private GetAttributesTextPosition(): Point {
            return this.attributesContainer.shape.GetPivotPoint().Translate(
                this.attributesContainer.shape.width / 2,
                this.attributesContainer.shape.height / 2,
            )
        }

        private RenderHeader(this: Entity, ctx: CanvasRenderingContext2D) {
            const headerTextPos = this.GetHeaderTextPosition()

            ctx.fillStyle = "white"
            this.header.shape.Render(ctx, true)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.header.GetText(), headerTextPos.x, headerTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx)
        }

        private RenderAttributes(this: Entity, ctx: CanvasRenderingContext2D) {
            const attributesTextPos = this.GetAttributesTextPosition()

            ctx.fillStyle = "white"
            this.attributesContainer.shape.Render(ctx, true)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.attributesContainer.GetText(), attributesTextPos.x, attributesTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx)
        }

        override SetName(this: Entity, name: string) {
            super.SetName(name)
            this.header.SetText(name)
        }

        GetPosition(): Point {
            return this.header.shape.GetPivotPoint()
        }

        SetPosition(x: number, y: number) {
            this.header.shape.topLeftCorner.Set(x, y)
            this.attributesContainer.shape.topLeftCorner.Set(x, y + this.header.shape.height)
        }

        GetInteractedPart(this: Entity, p: Point): Optional<EntityPart<Rectangle>> {
            if (this.header.shape.ContainsPoint(p)) {
                return this.header
            }

            if (this.attributesContainer.shape.ContainsPoint(p)) {
                return this.attributesContainer
            }

            return null
        }

        SelectPart(this: Entity, partName: string, ctx: CanvasRenderingContext2D) {
            if (partName !== this.header.name) {
                this.selectedPartName = null
                return
            }

            this.selectedPartName = this.header.name

            const textWidth = ctx.measureText(this.header.GetText()).width + 8
            const headerTextPos = this.GetHeaderTextPosition()
            const fontHeight = 10

            ctx.globalAlpha = 0.2
            ctx.fillStyle = "blue"

            // TODO: parse height from font
            ctx.fillRect(headerTextPos.x - textWidth / 2, headerTextPos.y - fontHeight + 1, textWidth, fontHeight + 2)

            resetCanvasContextProps(ctx)
        }

        GetSelectedPart(this: Entity): Optional<EntityPart<Rectangle>> {
            switch (this.selectedPartName) {
                case this.header.name:
                    return this.header
                case this.attributesContainer.name:
                    return this.attributesContainer
                default:
                    return null
            }
        }

        // TODO: merge with the method above
        GetSelectedPartTextPosition(this: Entity): Optional<Point> {
            switch (this.selectedPartName) {
                case this.header.name:
                    return this.GetHeaderTextPosition()
                case this.attributesContainer.name:
                    return this.GetAttributesTextPosition()
                default:
                    return null
            }
        }

        GetWidth(this: Entity): number {
            return Math.max(this.header.shape.width, this.attributesContainer.shape.width)
        }

        GetHeight(this: Entity): number {
            return this.header.shape.height + this.attributesContainer.shape.height
        }

        Render(this: Entity, ctx: CanvasRenderingContext2D) {
            this.RenderHeader(ctx)
            this.RenderAttributes(ctx)
        }

        Clear(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.clearRect(this.header.shape.topLeftCorner.x, this.header.shape.topLeftCorner.y, this.GetWidth(), this.GetHeight())
        }
    }
}