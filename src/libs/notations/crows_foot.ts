import { relationEditingStarted } from "@/app/events"
import { BaseEntity, BaseEntityAttribute, EntityPart } from "@/libs/erd/base_entity"
import { BaseRelationship, ParticipantType, RelationshipParticipant } from "@/libs/erd/base_relationship"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Ellipse, Point, Rectangle, ShapeRenderMode } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFoot"
    }

    class EntityRelationConnector extends Ellipse {
        private isActive: boolean = false

        SetActive(this: EntityRelationConnector): void {
            this.isActive = true
        }

        SetIncactive(this: EntityRelationConnector): void {
            this.isActive = false
        }

        IsActive(this: EntityRelationConnector): boolean {
            return this.isActive
        }

        override Render(this: EntityRelationConnector, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = this.isActive ? "red" : "blue"
            super.Render(ctx)
            resetCanvasContextProps(ctx)
        }
    }

    class EntityAttribute extends BaseEntityAttribute<Rectangle> {
        private readonly relationConnectorRadius: number = 3
        private readonly modifierOffset = 15
        private relationConnectors: [EntityRelationConnector, EntityRelationConnector]
        private primaryKey: boolean = false
        private foreignKey: boolean = false
        // FIXME: support multiple relationships
        // private associatedRelationship: Optional<Relationship> = null
        private associatedRelationships: Map<number, [Relationship, number]> = new Map()

        constructor(name: string, rectangle: Rectangle, text: string = "") {
            super(name, rectangle, text, (r: Rectangle) => [r.GetPivotPoint().Translate(r.width / 10, r.height / 2), false])
            this.relationConnectors = [
                new EntityRelationConnector(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
                new EntityRelationConnector(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
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

            this.associatedRelationships.forEach(([relationship, connectorIdx]) => {
                const participant = relationship.CheckAttributeParticipation(this)
                participant?.SetPosition(this.relationConnectors[connectorIdx].GetPivotPoint())
            })
        }

        AttachToRelationship(this: EntityAttribute, relationship: Relationship, mousePos: Point) {
            if (!this.primaryKey && !this.foreignKey) {
                console.info("Can only attach to PK or FK")
                return
            }

            const spareParticipants = relationship.GetSpareParticipants()
            if (spareParticipants.length === 0) {
                console.warn("Tried to attach a participant to a closed relationship")
                return
            }

            let connectorIdx = this.relationConnectors.findIndex(connector => connector.ContainsPoint(mousePos))
            if (connectorIdx === -1) {
                console.warn("No connector found for relationship")
                return
            }

            if (spareParticipants[0] === ParticipantType.First) {
                relationship.SetFirstParticipant(new RelationshipParticipant(
                    RelationType.SingleOptional,
                    this.relationConnectors[connectorIdx].GetPivotPoint(),
                    this,
                ))
            } else {
                relationship.SetSecondParticipant(new RelationshipParticipant(
                    RelationType.SingleOptional,
                    this.relationConnectors[connectorIdx].GetPivotPoint(),
                    this,
                ))
            }

            this.associatedRelationships.set(relationship.GetID(), [relationship, connectorIdx])
        }

        DetachFromRelationship(this: EntityAttribute, relationship: Relationship) {
            if (!this.associatedRelationships.has(relationship.GetID())) {
                return
            }

            const participantType = relationship.CheckAttributeParticipationType(this)
            if (participantType === ParticipantType.First) {
                relationship.UnsetFirstParticipant()
            } else if (participantType === ParticipantType.Second) {
                relationship.UnsetSecondParticipant()
            }

            this.associatedRelationships.delete(relationship.GetID())
        }

        DetachAllRelationships(this: EntityAttribute) {
            this.associatedRelationships.forEach(([relationship]) => {
                const participantType = relationship.CheckAttributeParticipationType(this)
                if (participantType === ParticipantType.First) {
                    relationship.UnsetFirstParticipant()
                    return
                }

                if (participantType === ParticipantType.Second) {
                    relationship.UnsetSecondParticipant()
                    return
                }
            })

            this.associatedRelationships.clear()
        }

        CheckInteraction(this: EntityAttribute, p : Point): boolean {
            if (this.primaryKey || this.foreignKey) {
                for (const [idx, connector] of this.relationConnectors.entries()) {
                    if (!connector.ContainsPoint(p)) {
                        continue
                    }

                    const relationship = new Relationship()
                    relationship.SetFirstParticipant(new RelationshipParticipant(RelationType.SingleOptional, connector.GetPivotPoint(), this))
                    relationship.SetSecondParticipant(new RelationshipParticipant(RelationType.SingleOptional))

                    connector.SetActive()
                    this.associatedRelationships.set(relationship.GetID(), [relationship, idx])
                    relationEditingStarted.Dispatch({ relationship, participantType: ParticipantType.First })

                    return true
                }
            }

            return this.shape.ContainsPoint(p)

        }

        Render(this: EntityAttribute, ctx: CanvasRenderingContext2D) {
            const [attrTextPos] = this.GetTextPosition()
            const supportsRelationships = this.primaryKey || this.foreignKey

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
                for (const connector of this.relationConnectors) {
                    connector.Render(ctx)
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
            this.header.shape.Render(ctx)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.header.GetText(), headerTextPos.x, headerTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx)
        }

        private RenderAttributes(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            this.attributesContainer.shape.Render(ctx)

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

        Highlight(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            ctx.strokeStyle = "blue"

            this.attributesContainer.shape.Render(ctx, ShapeRenderMode.OutlineOnly)
            this.header.shape.Render(ctx, ShapeRenderMode.OutlineOnly)

            resetCanvasContextProps(ctx)
        }

        GetInteractedPart(this: Entity, p: Point): Optional<EntityPart<Rectangle>> {
            if (this.header.shape.ContainsPoint(p)) {
                return this.header
            }

            const editedAttribute = this.attributes.find((attr) => attr.CheckInteraction(p))
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

            this.selectedPart = null

            switch (partName) {
                case this.header.name:
                    [partTextPos] = this.header.GetTextPosition()
                    text = this.header.GetText()
                    this.selectedPart = this.header
                    break
                default:
                    // TODO: maybe store attributes name -> index mapping separately
                    const attr = this.attributes.find((attr) => attr.name === partName)
                    if (!attr) {
                        return
                    }

                    [partTextPos] = attr.GetTextPosition()
                    text = attr.GetText()
                    this.selectedPart = attr
            }

            if (!partTextPos) {
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

        DetachAllRelationships(this: Entity): void {
            for (const attribute of this.attributes) {
                attribute.DetachAllRelationships()
            }
        }
    }

    export enum RelationType {
        SingleOptional,
        SingleRequired,
        ManyOptional,
        ManyRequired,
    }

    enum RelationDirection {
        Left,
        Right,
    }

    export class Relationship extends BaseRelationship<RelationType> {
        private readonly mandatoryMarkerOffset: number = 25
        private readonly typeMarkerOffset: number = 15
        private readonly markerWidth: number = 15

        private renderRelationType(
            this: Relationship,
            ctx: CanvasRenderingContext2D,
            relationType: RelationType,
            direction: RelationDirection,
            endPoint: Point,
        ): void {
            const mandatoryMarkerOffset = direction === RelationDirection.Left ? this.mandatoryMarkerOffset : -this.mandatoryMarkerOffset
            const typeMarkerOffset = direction === RelationDirection.Left ? this.typeMarkerOffset : -this.typeMarkerOffset

            ctx.lineWidth = 2

            if (relationType === RelationType.SingleOptional || relationType === RelationType.SingleRequired) {
                ctx.beginPath()
                ctx.moveTo(endPoint.x + typeMarkerOffset, endPoint.y + this.markerWidth / 2)
                ctx.lineTo(endPoint.x + typeMarkerOffset, endPoint.y - this.markerWidth / 2)
            } else {
                ctx.beginPath()
                ctx.moveTo(endPoint.x, endPoint.y + this.markerWidth / 2)
                ctx.lineTo(endPoint.x + typeMarkerOffset, endPoint.y)
                ctx.moveTo(endPoint.x, endPoint.y - this.markerWidth / 2)
                ctx.lineTo(endPoint.x + typeMarkerOffset, endPoint.y)
            }

            ctx.stroke()

            if (relationType === RelationType.SingleRequired || relationType === RelationType.ManyRequired) {
                ctx.beginPath()
                ctx.moveTo(endPoint.x + mandatoryMarkerOffset, endPoint.y + this.markerWidth / 2)
                ctx.lineTo(endPoint.x + mandatoryMarkerOffset, endPoint.y - this.markerWidth / 2)
            } else {
                ctx.lineWidth = 1
                ctx.fillStyle = "white"

                ctx.beginPath()
                ctx.ellipse(endPoint.x + mandatoryMarkerOffset, endPoint.y, this.markerWidth / 3, this.markerWidth / 3, 0, 0, Math.PI * 2, false)
                ctx.fill()
            }

            ctx.stroke()
        }

        override Render(ctx: CanvasRenderingContext2D) {
            if (!this.firstParticipant || !this.secondParticipant) {
                return
            }

            super.Render(ctx)

            // TODO: calc direction instead of hardcoding
            this.renderRelationType(
                ctx,
                this.firstParticipant.GetRelationType(),
                RelationDirection.Left,
                this.firstParticipant.GetPosition(),
            )

            this.renderRelationType(
                ctx,
                this.secondParticipant.GetRelationType(),
                RelationDirection.Right,
                this.secondParticipant.GetPosition(),
            )

            resetCanvasContextProps(ctx)
        }
    }
}