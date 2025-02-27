import { BaseEntity, EntityPart } from "@/libs/erd/base_entity"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Point, Rectangle } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFoot"
    }

    class EntityAttribute extends EntityPart<Rectangle> {
        private primaryKey: boolean = false
        private foreignKey: boolean = false

        constructor(name: string, rectangle: Rectangle, text: string = "") {
            super(name, rectangle, text, (r: Rectangle) => [r.GetPivotPoint().Translate(r.width / 10, r.height / 2), false])
        }

        SetAsPrimaryKey(this: EntityAttribute) {
            this.primaryKey = true
            this.foreignKey = false
        }
    }

    export class Entity extends BaseEntity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 65
        private readonly firstAttributeOffset = 5
        private readonly attributeHeight  = 20
        private readonly headerHeight = 30

        private readonly header:  EntityPart<Rectangle>
        private readonly attributesContainer: EntityPart<Rectangle>
        private attributes: EntityAttribute[]

        private selectedPartName: Optional<string>
        // TODO: save styles, related to each entity rather than context

        constructor(name: string, x: number = 0, y: number = 0) {
            super(name)

            this.header = new EntityPart(
                "header",
                new Rectangle(x, y, this.minWidth, this.headerHeight),
                this.name,
                (r: Rectangle) => [r.GetPivotPoint().Translate(
                    r.width / 2,
                    r.height / 2,
                ), true]
            )
            this.attributesContainer = new EntityPart(
                "attributes",
                new Rectangle(x, y + this.headerHeight, this.minWidth, this.minAttributesHeight),
            )
            this.attributes = []
            this.selectedPartName = null
        }

        private RenderHeader(this: Entity, ctx: CanvasRenderingContext2D) {
            const [headerTextPos] = this.header.GetTextPosition()

            ctx.fillStyle = "white"
            this.header.shape.Render(ctx, true)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.header.GetText(), headerTextPos.x, headerTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx)
        }

        private RenderAttributes(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            this.attributesContainer.shape.Render(ctx, true)

            ctx.fillStyle = "black"
            ctx.textAlign = "left"

            for (const attribute of this.attributes) {
                const [attrTextPos] = attribute.GetTextPosition()
                ctx.fillText(attribute.GetText(), attrTextPos.x, attrTextPos.y, this.GetWidth())
            }

            resetCanvasContextProps(ctx)
        }

        override SetName(this: Entity, name: string) {
            super.SetName(name)
            this.header.SetText(name)
        }

        AddAttribute(this: Entity, attributeName: string, ...extraArgs: [string]) {
            const [attributeType] = extraArgs

            // TODO: don't hardcode height
            this.attributes.push(new EntityAttribute(
                "attribute" + this.attributes.length.toString(),
                new Rectangle(
                    this.attributesContainer.shape.topLeftCorner.x,
                    this.attributesContainer.shape.topLeftCorner.y + this.firstAttributeOffset + this.attributes.length * this.attributeHeight,
                    this.attributesContainer.shape.width,
                    this.attributeHeight,
                ),
                attributeName,
            ))
        }

        GetPosition(): Point {
            return this.header.shape.GetPivotPoint()
        }

        SetPosition(x: number, y: number) {
            this.header.shape.topLeftCorner.Set(x, y)
            this.attributesContainer.shape.topLeftCorner.Set(x, y + this.header.shape.height)
            this.attributes.forEach((attribute, i) => {
                attribute.shape.topLeftCorner.x = this.attributesContainer.shape.topLeftCorner.x
                attribute.shape.topLeftCorner.y = this.attributesContainer.shape.topLeftCorner.y + this.firstAttributeOffset + i * this.attributeHeight
            })
        }

        GetInteractedPart(this: Entity, p: Point): Optional<EntityPart<Rectangle>> {
            if (this.header.shape.ContainsPoint(p)) {
                return this.header
            }

            const editedAttribute = this.attributes.find((attr) => attr.shape.ContainsPoint(p))
            if (editedAttribute) {
                return editedAttribute
            }

            if (this.attributesContainer.shape.ContainsPoint(p)) {
                return this.attributesContainer
            }

            return null
        }

        SelectPart(this: Entity, partName: string, ctx: CanvasRenderingContext2D) {
            let partTextPos: Optional<Point> = null
            let text = ""

            if (partName === this.header.name) {
                [partTextPos] = this.header.GetTextPosition()
                text = this.header.GetText()
            }

            // TODO: maybe store attributes name -> index mapping separately
            if (!partTextPos) {
                const attr = this.attributes.find((attr) => attr.name === partName)
                if (attr) {
                    [partTextPos] = attr.GetTextPosition()
                    text = attr.GetText()
                }
            }

            if (!partTextPos) {
                this.selectedPartName = null
                return
            }

            this.selectedPartName = partName
            // remove highlighting from the other parts of the entity
            this.Render(ctx)

            // offset for highlighting
            const textWidth = ctx.measureText(text).width + 8
            // TODO: parse height from font
            const fontHeight = 10

            ctx.globalAlpha = 0.2
            ctx.fillStyle = "blue"

            partName === this.header.name ?
                partTextPos.x -= textWidth / 2 :
                partTextPos.x -= 2

            partTextPos.y = partTextPos.y - fontHeight + 1

            ctx.fillRect(partTextPos.x, partTextPos.y, textWidth, fontHeight + 2)

            resetCanvasContextProps(ctx)
        }

        // TODO: maybe save selected part reference instead of name
        GetSelectedPart(this: Entity): Optional<EntityPart<Rectangle>> {
            if (this.selectedPartName === this.header.name) {
                return this.header
            }

            const attr = this.attributes.find((attr) => attr.name === this.selectedPartName)
            if (attr) {
                return attr
            }

            return null
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