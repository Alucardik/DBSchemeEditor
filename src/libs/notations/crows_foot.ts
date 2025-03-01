import { BaseEntity, BaseEntityAttribute, EntityPart } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Ellipse, Point, Rectangle } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFoot"
    }

    class EntityAttribute extends BaseEntityAttribute<Rectangle> {
        private readonly relationConnectorRadius: number = 3
        private readonly modifierOffset = 15
        private relationConnectors: [Ellipse, Ellipse]
        private primaryKey: boolean = false
        private foreignKey: boolean = false

        constructor(name: string, rectangle: Rectangle, text: string = "") {
            super(name, rectangle, text, (r: Rectangle) => [r.GetPivotPoint().Translate(r.width / 10, r.height / 2), false])
            this.relationConnectors = [
                new Ellipse(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
                new Ellipse(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
            ]
        }

        SetAsPrimaryKey(this: EntityAttribute) {
            this.primaryKey = true
            this.foreignKey = false

        }

        IsPrimaryKey(this: EntityAttribute): boolean {
            return this.primaryKey
        }

        SetAsForeignKey(this: EntityAttribute) {
            this.foreignKey = true
            this.primaryKey = false
        }

        IsForeignKey(this: EntityAttribute): boolean {
            return this.foreignKey
        }

        RemoveModifiers(this: EntityAttribute) {
            this.primaryKey = false
            this.foreignKey = false
        }

        SetPosition(this: EntityAttribute, x: number, y: number) {
            this.shape.topLeftCorner.x = x
            this.shape.topLeftCorner.y = y
            const [textPos] = this.GetTextPosition()

            for (const connector of this.relationConnectors) {
                connector.center.x = x
                connector.center.y = textPos.y
            }

            this.relationConnectors[1].center.x += this.shape.width
        }

        Render(this: EntityAttribute, ctx: CanvasRenderingContext2D) {
            const [attrTextPos] = this.GetTextPosition()
            let supportsRelationships = this.primaryKey || this.foreignKey

            ctx.fillStyle = "black"
            ctx.textAlign = "left"

            ctx.fillText(this.GetText(), attrTextPos.x, attrTextPos.y, this.shape.width)

            if (this.primaryKey) {
                const pkTextInfo = ctx.measureText("PK")
                ctx.fillText("PK", attrTextPos.x + this.shape.width - pkTextInfo.width - this.modifierOffset, attrTextPos.y)
            }

            if (this.foreignKey) {
                const fkTextInfo = ctx.measureText("FK")
                ctx.fillText("FK", attrTextPos.x + this.shape.width - fkTextInfo.width - this.modifierOffset, attrTextPos.y)
            }

            if (supportsRelationships) {
                ctx.fillStyle = "blue"
                for (const connector of this.relationConnectors) {
                    connector.Render(ctx, true)
                }
            }

            resetCanvasContextProps(ctx)
        }
    }

    export class Entity extends BaseEntity {
        private readonly minWidth = 100
        private readonly minAttributesHeight = 65
        private readonly attributeHeight  = 20
        private readonly firstAttributeOffset = 5
        private readonly headerHeight = 30

        private readonly header:  EntityPart<Rectangle>
        private readonly attributesContainer: EntityPart<Rectangle>
        private attributes: EntityAttribute[] = []
        private selectedPart: Optional<EntityPart<Rectangle>> = null

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

            // TODO: use partial reset
            ctx.fillStyle = "black"

            for (const attribute of this.attributes) {
                attribute.Render(ctx)
            }
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
                attribute.SetPosition(
                    this.attributesContainer.shape.topLeftCorner.x,
                    this.attributesContainer.shape.topLeftCorner.y + this.firstAttributeOffset + i * this.attributeHeight,
                )
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
                this.selectedPart = this.header
            }

            // TODO: maybe store attributes name -> index mapping separately
            if (!partTextPos) {
                const attr = this.attributes.find((attr) => attr.name === partName)
                if (attr) {
                    [partTextPos] = attr.GetTextPosition()
                    text = attr.GetText()
                    this.selectedPart = attr
                }
            }

            if (!partTextPos) {
                this.selectedPart = null
                return
            }

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

        GetSelectedAttribute(this: Entity): Optional<EntityAttribute> {
            if (this.selectedPart instanceof EntityAttribute) {
                return this.selectedPart
            }

            return null
        }

        GetSelectedPart(this: Entity): Optional<EntityPart<Rectangle>> {
            return this.selectedPart
        }

        Unselect(this: Entity): void {
            this.selectedPart = null
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

    export enum RelationType {
        SingleOptional,
        SingleRequired,
        ManyOptional,
        ManyRequired,
    }

    export class Relationship extends BaseRelationship<RelationType> {}
}