import { relationEditingStarted } from "@/app/events"
import { editedRelationshipStore } from "@/app/stores"
import { BaseEntity, BaseEntityAttribute, Dependency, EntityPart } from "@/libs/erd/base_entity"
import { BaseRelationship, ParticipantType, RelationshipParticipant } from "@/libs/erd/base_relationship"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Ellipse, Point, Rectangle, Shape, ShapeRenderMode } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export namespace CrowsFootNotation {
    export function GetNotationName() {
        return "CrowsFoot"
    }

    export enum ModifierType {
        NotNull = "NotNull",
        PrimaryKey = "PK",
        ForeignKey = "FK",
    }

    export enum AttributeType {
        Integer = "integer",
        String = "string",
        Float = "float",
        Boolean = "boolean",
    }

    export function GetAvailableModifierTypes(): ModifierType[] {
        return [
            ModifierType.NotNull,
            ModifierType.PrimaryKey,
            ModifierType.ForeignKey,
        ]
    }

    class EntityRelationConnector extends Ellipse {
        private isActive: boolean = false

        static FromJSON(obj: EntityRelationConnector): EntityRelationConnector {
            const ret = new EntityRelationConnector()
            ret.center = new Point(obj.center.x, obj.center.y)
            ret.xRadius = obj.xRadius
            ret.yRadius = obj.yRadius
            ret.isActive = obj.isActive

            return ret
        }

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
            resetCanvasContextProps(ctx, "fillStyle")
        }
    }

    export class EntityAttribute extends BaseEntityAttribute<Rectangle> {
        private readonly relationConnectorRadius: number = 3
        private readonly modifierOffset = 15
        private relationConnectors: [EntityRelationConnector, EntityRelationConnector]
        private type: AttributeType = AttributeType.Integer
        // TODO: switch to set, but serialize as Array
        private modifiers: ModifierType[] = []
        // FIXME: multiple relationships work incorrectly
        // FIXME: convert to object when marshalling (Object.fromEntries(map.entries())
        private associatedRelationships: Map<number, [Relationship, number]> = new Map()

        constructor(name: string, rectangle: Rectangle, text: string = "") {
            super(name, rectangle, text, (r: Rectangle) => [r.GetPivotPoint().Translate(r.width / 10, r.height / 2), false])
            this.relationConnectors = [
                new EntityRelationConnector(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
                new EntityRelationConnector(new Point(-1, -1), this.relationConnectorRadius, this.relationConnectorRadius),
            ]
        }

        static override FromJSON(obj: object, _ : Shape): EntityAttribute {
            const castObj = obj as EntityAttribute
            const rectangle = Object.assign(new Rectangle(), castObj.shape)
            rectangle.topLeftCorner = new Point(castObj.shape.topLeftCorner.x, castObj.shape.topLeftCorner.y)

            const entityAttribute = Object.assign(new EntityAttribute("", rectangle), obj)
            // @ts-ignore
            entityAttribute.shape = rectangle
            // @ts-ignore
            entityAttribute.relationConnectors = entityAttribute.relationConnectors.map((obj) => EntityRelationConnector.FromJSON(obj))
            entityAttribute.associatedRelationships = new Map()

            for (const [key, [rawRelation, number]] of Object.entries(castObj.associatedRelationships)) {
                entityAttribute.associatedRelationships.set(key, [Relationship.FromJSON(rawRelation), number])
            }

            return entityAttribute
        }

        ToJSON(this: EntityAttribute): object {
            const obj = Object.assign({}, this)
            obj.associatedRelationships = Object.fromEntries(this.associatedRelationships.entries())

            return obj
        }

        GetModifiers(this: EntityAttribute): ReadonlyArray<ModifierType> {
            return this.modifiers
        }

        SetModifiers(this: EntityAttribute, modifiers: ModifierType[]) {
            this.modifiers = modifiers
        }

        // FIXME: do no allocate set each time
        AddModifierType(this: EntityAttribute, modifier: ModifierType) {
            this.modifiers = Array.from(new Set([modifier, ...this.modifiers]).values())
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

        // TODO: allow to select connector index explicitly
        AttachToRelationship(this: EntityAttribute, relationship: Relationship, mousePos: Point, forceIndex: -1 | 0 | 1 = -1) {
            if (!this.IsKeyAttribute()) {
                console.info("Can only attach to PK or FK")
                return
            }

            const spareParticipants = relationship.GetSpareParticipants()
            if (spareParticipants.length === 0) {
                console.warn("Tried to attach a participant to a closed relationship")
                return
            }

            let connectorIdx: number
            if (forceIndex !== -1) {
                connectorIdx = forceIndex
            } else {
                connectorIdx = this.relationConnectors.findIndex(connector => connector.ContainsPoint(mousePos))
            }

            if (connectorIdx === -1) {
                console.warn("No connector found for relationship")
                return
            }

            // TODO: check if attributes have already been connected
            //  and disallow more than one same connection

            if (spareParticipants[0] === ParticipantType.First) {
                relationship.SetFirstParticipant(new RelationshipParticipant(
                    RelationType.SingleRequired,
                    this.relationConnectors[connectorIdx].GetPivotPoint(),
                    this,
                ))
            } else {
                relationship.SetSecondParticipant(new RelationshipParticipant(
                    RelationType.SingleRequired,
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
            if (this.IsKeyAttribute()) {
                for (const [idx, connector] of this.relationConnectors.entries()) {
                    if (!connector.ContainsPoint(p)) {
                        continue
                    }

                    if (!editedRelationshipStore.Get().relationship) {
                        const relationship = new Relationship()
                        relationship.SetFirstParticipant(new RelationshipParticipant(RelationType.SingleOptional, connector.GetPivotPoint(), this))
                        relationship.SetSecondParticipant(new RelationshipParticipant(RelationType.SingleOptional))
                        this.associatedRelationships.set(relationship.GetID(), [relationship, idx])
                        relationEditingStarted.Dispatch({ relationship, participantType: ParticipantType.First })
                    }

                    connector.SetActive()

                    return true
                }
            }

            return this.shape.ContainsPoint(p)

        }

        Render(this: EntityAttribute, ctx: CanvasRenderingContext2D) {
            const [attrTextPos] = this.GetTextPosition()

            ctx.fillStyle = "black"
            ctx.textAlign = "left"

            ctx.fillText(this.GetText(), attrTextPos.x, attrTextPos.y, this.shape.width)

            // we render relation connectors only for the key attributes
            if (this.IsKeyAttribute()) {
                for (const connector of this.relationConnectors) {
                    connector.Render(ctx)
                }
            }

            this.modifiers.forEach(((modifier, index) => {
                const modifierTextInfo = ctx.measureText(modifier)
                ctx.fillText(modifier, attrTextPos.x + this.shape.width - modifierTextInfo.width - this.modifierOffset * (index + 1), attrTextPos.y)
            }))

            resetCanvasContextProps(ctx, "fillStyle", "textAlign")
        }

        IsKeyAttribute(this: EntityAttribute): boolean {
            return this.modifiers.some(modifier => modifier === ModifierType.ForeignKey || modifier === ModifierType.PrimaryKey)
        }

        GetType(this: EntityAttribute): AttributeType {
            return this.type
        }
    }

    export class Entity extends BaseEntity {
        private readonly minWidth = 125
        private readonly minAttributesHeight = 65
        private readonly attributeHeight  = 20
        private readonly attributeOffset = 5
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

        static FromJSON(rawEntity: Entity): Entity {
            const headerPositionGetter =                 (r: Rectangle) => [r.GetPivotPoint().Translate(
                r.width / 2,
                r.height / 2,
            ), true] as [Point, boolean]

            const headerShape = Object.assign(new Rectangle(), rawEntity.header.shape)
            const attributesContainerShape = Object.assign(new Rectangle(), rawEntity.attributesContainer.shape)

            headerShape.topLeftCorner = new Point(rawEntity.header.shape.topLeftCorner.x, rawEntity.header.shape.topLeftCorner.y)
            attributesContainerShape.topLeftCorner = new Point(rawEntity.attributesContainer.shape.topLeftCorner.x, rawEntity.attributesContainer.shape.topLeftCorner.y)

            const entity = Object.assign(new Entity(""), rawEntity)

            entity.header.GetTextPosition = () => headerPositionGetter(headerShape)
            entity.header = EntityPart.FromJSON(entity.header, headerShape)
            entity.attributes = rawEntity.attributes.map((obj) => EntityAttribute.FromJSON(obj))
            entity.attributesContainer = EntityPart.FromJSON(entity.attributesContainer, attributesContainerShape)
            entity.selectedPart = null

            return entity
        }

        ToJSON(this: Entity): object {
            const obj = Object.assign({}, this)
            obj.attributes = this.attributes.map((attribute) => attribute.ToJSON())

            return obj
        }

        // FIXME: set original entity name or remove name from base entity
        override GetName(this: Entity): string {
            return this.header.GetText()
        }

        override SetName(this: Entity, name: string) {
            super.SetName(name)
            this.header.SetText(name)
        }

        override GetDependencies(this: Entity): ReadonlyArray<Dependency> {
            const pkAttributes = this.attributes.filter(attr => attr.IsKeyAttribute())

            if (pkAttributes.length > 0) {
                const nonPKAttributes = this.attributes.filter(attr => !attr.IsKeyAttribute())

                return [{
                    lhs: pkAttributes.map(attr => attr.GetText()),
                    rhs: nonPKAttributes.map(attr => attr.GetText()),
                }, ...this.dependencies]
            }

            return this.dependencies
        }

        AddAttribute(this: Entity, attributeName: string, ...extraArgs: any[]) {
            const [attributeType, ...modifiers] = extraArgs as [number, ...ModifierType[]]
            const attr = new EntityAttribute(
                "attribute" + this.attributes.length.toString(),
                new Rectangle(
                    this.attributesContainer.shape.topLeftCorner.x,
                    this.attributesContainer.shape.topLeftCorner.y + this.attributeOffset + this.attributes.length * this.attributeHeight,
                    this.attributesContainer.shape.width,
                    this.attributeHeight,
                ),
                attributeName,
            )

            // extend attributes container if new attribute overflows previous container
            if (attr.shape.topLeftCorner.y + attr.shape.height > this.attributesContainer.shape.topLeftCorner.y + this.attributesContainer.shape.height) {
                this.attributesContainer.shape.height += this.attributeHeight
            }

            modifiers.forEach((modifier) => {
                attr.AddModifierType(modifier)
                // resetting position of relation connectors when adding new key attribute
                if (modifier === ModifierType.ForeignKey || modifier === ModifierType.PrimaryKey) {
                    attr.SetPosition(...attr.shape.topLeftCorner.Expand())
                }
            })

            // TODO: don't hardcode height
            this.attributes.push(attr)
        }

        GetAttributes(this: Entity): EntityAttribute[] {
            return this.attributes
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
                    this.attributesContainer.shape.topLeftCorner.y + this.attributeOffset + i * this.attributeHeight,
                )
            })
        }

        Highlight(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            ctx.strokeStyle = "blue"

            this.attributesContainer.shape.Render(ctx, ShapeRenderMode.OutlineOnly)
            this.header.shape.Render(ctx, ShapeRenderMode.OutlineOnly)

            resetCanvasContextProps(ctx, "fillStyle", "strokeStyle")
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

            resetCanvasContextProps(ctx, "globalAlpha", "fillStyle")
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

        private RenderHeader(this: Entity, ctx: CanvasRenderingContext2D) {
            const [headerTextPos] = this.header.GetTextPosition()

            ctx.fillStyle = "white"
            this.header.shape.Render(ctx)

            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.fillText(this.header.GetText(), headerTextPos.x, headerTextPos.y, this.GetWidth())

            resetCanvasContextProps(ctx, "fillStyle", "textAlign")
        }

        private RenderAttributes(this: Entity, ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "white"
            this.attributesContainer.shape.Render(ctx)

            resetCanvasContextProps(ctx, "fillStyle")

            for (const attribute of this.attributes) {
                attribute.Render(ctx)
            }
        }
    }

    export enum RelationType {
        SingleOptional,
        SingleRequired,
        ManyOptional,
        ManyRequired,
    }

    export function GetAvailableRelationTypes(): RelationType[] {
        return [
            RelationType.SingleOptional,
            RelationType.SingleRequired,
            RelationType.ManyOptional,
            RelationType.ManyRequired,
        ]
    }

    export function RelationTypeToString(relationType: RelationType): string {
        switch (relationType) {
            case RelationType.SingleOptional:
                return "Single Optional"
            case RelationType.SingleRequired:
                return "Single Required"
            case RelationType.ManyOptional:
                return "Many Optional"
            case RelationType.ManyRequired:
                return "Many Required"
            default:
                return ""
        }
    }

    enum RelationDirection {
        Left,
        Right,
    }

    export class Relationship extends BaseRelationship<RelationType> {
        private readonly mandatoryMarkerOffset: number = 25
        private readonly typeMarkerOffset: number = 15
        private readonly markerWidth: number = 15

        static FromJSON(obj: Relationship): Relationship {
            const ret = new Relationship()
            Object.assign(ret, obj)

            // FIXME: link to existing attributes instead of creating a new one (breaks relationships)
            ret.firstParticipant = RelationshipParticipant.FromJSON(obj.firstParticipant, new Rectangle())
            ret.secondParticipant = RelationshipParticipant.FromJSON(obj.secondParticipant, new Rectangle())

            return ret
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
        }

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

            resetCanvasContextProps(ctx, "lineWidth", "fillStyle")
        }
    }
}