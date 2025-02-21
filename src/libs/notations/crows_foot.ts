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

        private readonly headerPart:  EntityPart<Rectangle>
        private readonly attributesPart: EntityPart<Rectangle>
        private selectedPartName: Optional<string>
        // TODO: save styles, related to each entity rather than context

        constructor(name: string, x: number = 0, y: number = 0) {
            super(name, x, y)
            this.headerPart = new EntityPart("header", new Rectangle(x, y, this.minWidth, this.headerHeight))
            this.attributesPart = new EntityPart("attributes", new Rectangle(x, y + this.headerHeight, this.minWidth, this.minAttributesHeight))
            this.selectedPartName = null
        }

        private GetHeaderTextPosition(): Point {
            return this.headerPart.shape.GetPivotPoint().Translate(
                this.headerPart.shape.width / 2,
                this.headerPart.shape.height / 2,
            )
        }

        private GetAttributesTextPosition(): Point {
            return this.attributesPart.shape.GetPivotPoint().Translate(0, 0)
        }

        GetPosition(): Point {
            return this.headerPart.shape.GetPivotPoint()
        }

        SetPosition(x: number, y: number) {
            this.headerPart.shape.topLeftCorner.Set(x, y)
            this.attributesPart.shape.topLeftCorner.Set(x, y + this.headerPart.shape.height)
        }

        GetInteractedPart(this: Entity, p: Point): Optional<EntityPart<Rectangle>> {
            if (this.headerPart.shape.ContainsPoint(p)) {
                return this.headerPart
            }

            if (this.attributesPart.shape.ContainsPoint(p)) {
                return this.attributesPart
            }

            return null
        }

        SelectPart(this: Entity, partName: string, ctx: CanvasRenderingContext2D) {
            if (partName !== this.headerPart.name) {
                this.selectedPartName = null
                return
            }

            this.selectedPartName = this.headerPart.name

            const textWidth = ctx.measureText(this.name).width + 8
            const headerTextPos = this.GetHeaderTextPosition()
            const fontHeight = 10

            ctx.globalAlpha = 0.2
            ctx.fillStyle = "blue"

            // TODO: parse height from font
            ctx.fillRect(headerTextPos.x - textWidth / 2, headerTextPos.y - fontHeight + 1, textWidth, fontHeight + 2)

            resetCanvasContextProps(ctx)
        }

        GetSelectedPartName(this: Entity): Optional<string> {
            return this.selectedPartName
        }

        GetSelectedPartTextPosition(this: Entity): Optional<Point> {
            switch (this.selectedPartName) {
                case this.headerPart.name:
                    return this.GetHeaderTextPosition()
                case this.attributesPart.name:
                    return this.GetAttributesTextPosition()
                default:
                    return null
            }
        }

        GetWidth(this: Entity): number {
            return Math.max(this.headerPart.shape.width, this.attributesPart.shape.width)
        }

        GetHeight(this: Entity): number {
            return this.headerPart.shape.height + this.attributesPart.shape.height
        }

        Render(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            this.headerPart.shape.Render(ctx, true)
            this.attributesPart.shape.Render(ctx, true)

            const headerTextPos = this.GetHeaderTextPosition()
            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.name, headerTextPos.x, headerTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx)
        }

        Clear(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.clearRect(this.headerPart.shape.topLeftCorner.x, this.headerPart.shape.topLeftCorner.y, this.GetWidth(), this.GetHeight())
        }
    }
}