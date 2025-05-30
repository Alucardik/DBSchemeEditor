import { BaseEntityAttribute } from "@/libs/erd/base_entity"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Point, Rectangle, Shape } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"

export enum ParticipantType {
    First = "first",
    Second = "second",
}

export class RelationshipParticipant<RT extends any> {
    private position: Point
    private attribute: Optional<BaseEntityAttribute<Shape>>
    private relationType: RT

    constructor(relationType: RT, position?: Point, attribute?: BaseEntityAttribute<Shape>) {
        this.position = position ? position : new Point(-1, -1)
        this.attribute = attribute ? attribute : null
        this.relationType = relationType
    }

    static FromJSON<RT extends any>(obj: RelationshipParticipant<RT>, attrShape: Shape): RelationshipParticipant<RT> {
        // @ts-ignore
        const ret = new RelationshipParticipant<RT>(null)
        Object.assign(ret, obj)

        // @ts-ignore
        ret.position = new Point(obj.position.x, obj.position.y)
        // @ts-ignore
        ret.attribute = BaseEntityAttribute.FromJSON(obj.attribute, attrShape)

        return ret
    }

    SetPosition(this: RelationshipParticipant<RT>, position: Point): void {
        this.position = position
    }

    GetPosition(this: RelationshipParticipant<RT>) {
        return this.position.Translate(0, 0)
    }

    SetEntityAttribute(this: RelationshipParticipant<RT>, attribute: BaseEntityAttribute<Shape>): void {
        this.attribute = attribute
    }

    GetEntityAttribute(this: RelationshipParticipant<RT>) {
        return this.attribute
    }

    SetRelationType(this: RelationshipParticipant<RT>, relationType: RT): void {
        this.relationType = relationType
    }

    GetRelationType(this: RelationshipParticipant<RT>) {
        return this.relationType
    }
}

export class BaseRelationship<RT extends any> {
    private static counter: number = 0
    protected firstParticipant: Optional<RelationshipParticipant<RT>> = null
    protected secondParticipant: Optional<RelationshipParticipant<RT>> = null
    private readonly id: number
    private readonly lineWidth: number = 2
    private readonly interactionRadius: number = 3

    constructor() {
        this.id = BaseRelationship.counter
        BaseRelationship.counter++
    }

    GetID(this:BaseRelationship<RT>): number {
        return this.id
    }

    UnsetFirstParticipant(this: BaseRelationship<RT>): void {
        this.firstParticipant = null
    }

    SetFirstParticipant(this: BaseRelationship<RT>, participant: RelationshipParticipant<RT>): void {
        if (this.secondParticipant?.GetEntityAttribute() === participant.GetEntityAttribute()) {
            console.warn("tried to assign the same attribute to both sides of the relationship")
            return
        }

        this.firstParticipant = participant
    }

    GetFirstParticipant(this: BaseRelationship<RT>): Optional<RelationshipParticipant<RT>> {
        return this.firstParticipant
    }

    UnsetSecondParticipant(this: BaseRelationship<RT>): void {
        this.secondParticipant = null
    }

    SetSecondParticipant(this: BaseRelationship<RT>, participant: RelationshipParticipant<RT>): void {
        if (this.firstParticipant?.GetEntityAttribute() === participant.GetEntityAttribute()) {
            console.warn("tried to assign the same attribute to both sides of the relationship")
            return
        }

        this.secondParticipant = participant
    }

    GetSecondParticipant(this: BaseRelationship<RT>): Optional<RelationshipParticipant<RT>> {
        return this.secondParticipant
    }

    IsComplete(this: BaseRelationship<RT>): boolean {
        return this.firstParticipant?.GetEntityAttribute() !== null && this.secondParticipant?.GetEntityAttribute() !== null
    }

    GetSpareParticipants(this: BaseRelationship<RT>): ParticipantType[] {
        const ret: ParticipantType[] = []

        if (!this.firstParticipant?.GetEntityAttribute()) {
            ret.push(ParticipantType.First)
        }

        if (!this.secondParticipant?.GetEntityAttribute()) {
            ret.push(ParticipantType.Second)
        }

        return ret
    }

    DetachParticipants(this: BaseRelationship<RT>): void {
        this.firstParticipant?.GetEntityAttribute()?.DetachFromRelationship(this)
        this.secondParticipant?.GetEntityAttribute()?.DetachFromRelationship(this)
    }

    CheckAttributeParticipationType(this: BaseRelationship<RT>, attribute: BaseEntityAttribute<Shape>): Optional<ParticipantType> {
        if (this.firstParticipant?.GetEntityAttribute() === attribute) {
            return ParticipantType.First
        }

        if (this.secondParticipant?.GetEntityAttribute() === attribute) {
            return ParticipantType.Second
        }

        return null
    }

    CheckAttributeParticipation(this: BaseRelationship<RT>, attribute: BaseEntityAttribute<Shape>): Optional<RelationshipParticipant<RT>> {
        const participantType = this.CheckAttributeParticipationType(attribute)
        if (!participantType) {
            return null
        }

        if (participantType === ParticipantType.First) {
            return this.firstParticipant
        }

        if (participantType === ParticipantType.Second) {
            return this.secondParticipant
        }

        return null
    }

    Highlight(this: BaseRelationship<RT>, ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "red"
        this.Render(ctx)
    }

    Render(this: BaseRelationship<RT>, ctx: CanvasRenderingContext2D) {
        if (!this.firstParticipant || !this.secondParticipant) {
            return
        }

        ctx.lineWidth = this.lineWidth
        ctx.lineCap = "round"

        // TODO: prevent lines from crossing entities (add minYOffset / maxLevel?)
        const firstPosition = this.firstParticipant.GetPosition()
        const secondPosition = this.secondParticipant.GetPosition()
        const offsetX = Math.abs(secondPosition.x - firstPosition.x) / 2

        if (firstPosition.x > secondPosition.x) {
            const yOffset = (secondPosition.y - firstPosition.y) / 2

            ctx.beginPath()
            ctx.moveTo(firstPosition.x, firstPosition.y)
            ctx.lineTo(firstPosition.x + offsetX, firstPosition.y)
            ctx.moveTo(firstPosition.x + offsetX, firstPosition.y)
            ctx.lineTo(firstPosition.x + offsetX, firstPosition.y + yOffset)
            ctx.moveTo(firstPosition.x + offsetX, firstPosition.y + yOffset)
            ctx.lineTo(secondPosition.x - offsetX, firstPosition.y + yOffset)
            ctx.moveTo(secondPosition.x - offsetX, firstPosition.y + yOffset)
            ctx.lineTo(secondPosition.x - offsetX, secondPosition.y)
            ctx.moveTo(secondPosition.x - offsetX, secondPosition.y)
            ctx.lineTo(secondPosition.x, secondPosition.y)
            ctx.stroke()
        } else {
            const middlePointX = firstPosition.x + offsetX

            ctx.beginPath()
            ctx.moveTo(firstPosition.x, firstPosition.y)
            ctx.lineTo(middlePointX, firstPosition.y)
            ctx.moveTo(middlePointX, firstPosition.y)
            ctx.lineTo(middlePointX, secondPosition.y)
            ctx.moveTo(middlePointX, secondPosition.y)
            ctx.lineTo(secondPosition.x, secondPosition.y)
            ctx.stroke()
        }

        resetCanvasContextProps(ctx, "lineWidth", "lineCap", "strokeStyle")
    }

    IsInteracted(this: BaseRelationship<RT>, p: Point): boolean {
        // if one of the participants is not a valid attribute, then this relationship is currently being interacted with
        if (!this.firstParticipant?.GetEntityAttribute() || !this.secondParticipant?.GetEntityAttribute()) {
            return false
        }

        const firstPosition = this.firstParticipant?.GetPosition()
        const secondPosition = this.secondParticipant?.GetPosition()
        const offsetX = Math.abs(secondPosition.x - firstPosition.x) / 2
        // reusing single rectangle for each line segment instead of allocating multiple at one
        const lineSegment = new Rectangle(0, 0, 0, 0)

        // connection visualisation
        // --- 0
        // |
        // |
        // ------
        //       |
        //       |
        //   0 ---
        if (firstPosition.x > secondPosition.x) {
            const yOffset = (secondPosition.y - firstPosition.y) / 2
            const yOffsetAbs = Math.abs(yOffset)

            // TODO: count line height as part if width / height
            // represent each line segment as a rectangle interaction area
            lineSegment.topLeftCorner.x = firstPosition.x
            lineSegment.topLeftCorner.y = firstPosition.y - this.interactionRadius
            lineSegment.width = offsetX
            lineSegment.height = this.interactionRadius * 2 + this.lineWidth
            if (lineSegment.ContainsPoint(p)) {
                return true
            }

            lineSegment.topLeftCorner.x = firstPosition.x + offsetX - this.interactionRadius
            lineSegment.topLeftCorner.y = firstPosition.y + yOffset
            lineSegment.width = this.interactionRadius * 2
            lineSegment.height = yOffsetAbs
            if (lineSegment.ContainsPoint(p)) {
                return true
            }

            lineSegment.topLeftCorner.x = secondPosition.x - offsetX
            lineSegment.topLeftCorner.y = firstPosition.y + yOffset - this.interactionRadius
            lineSegment.width = firstPosition.x - secondPosition.x + offsetX * 2
            lineSegment.height = this.interactionRadius * 2
            if (lineSegment.ContainsPoint(p)) {
                return true
            }

            lineSegment.topLeftCorner.x = secondPosition.x - offsetX - this.interactionRadius
            lineSegment.topLeftCorner.y = secondPosition.y - this.interactionRadius
            lineSegment.width = this.interactionRadius * 2
            lineSegment.height = yOffsetAbs
            if (lineSegment.ContainsPoint(p)) {
                return true
            }

            lineSegment.topLeftCorner.x = secondPosition.x - offsetX
            lineSegment.topLeftCorner.y = secondPosition.y - this.interactionRadius
            lineSegment.width = offsetX
            lineSegment.height = 2 * this.interactionRadius
            return lineSegment.ContainsPoint(p)
        }

        lineSegment.topLeftCorner.x = firstPosition.x
        lineSegment.topLeftCorner.y = firstPosition.y - this.interactionRadius
        lineSegment.width = offsetX
        lineSegment.height = this.interactionRadius * 2 + this.lineWidth + this.lineWidth
        if (lineSegment.ContainsPoint(p)) {
            return true
        }

        lineSegment.topLeftCorner.x = firstPosition.x + offsetX - this.interactionRadius
        // TODO: add interactionRadius if second position is lower
        lineSegment.topLeftCorner.y = secondPosition.y - this.interactionRadius
        lineSegment.width = this.interactionRadius * 2 + this.lineWidth
        lineSegment.height = Math.abs(secondPosition.y - firstPosition.y) + 2 * this.interactionRadius
        if (lineSegment.ContainsPoint(p)) {
            return true
        }

        lineSegment.topLeftCorner.x = firstPosition.x + offsetX
        // TODO: add interactionRadius if second position is lower
        lineSegment.topLeftCorner.y = secondPosition.y - this.interactionRadius
        lineSegment.width = offsetX
        lineSegment.height = this.interactionRadius * 2 + this.lineWidth
        return lineSegment.ContainsPoint(p)
    }
}