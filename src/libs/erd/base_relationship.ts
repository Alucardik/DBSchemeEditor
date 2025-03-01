import { BaseEntityAttribute } from "@/libs/erd/base_entity"
import { resetCanvasContextProps } from "@/libs/render/canvas"
import { Point, Shape } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"

class RelationshipParticipant<RT extends any> {
    private position: Point
    private attribute: BaseEntityAttribute<Shape>
    private relationType: RT

    constructor(position: Point, entity: BaseEntityAttribute<Shape>, relationType: RT) {
        this.position = position
        this.attribute = entity
        this.relationType = relationType
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
    protected firstParticipant: Optional<RelationshipParticipant<RT>> = null
    protected secondParticipant: Optional<RelationshipParticipant<RT>> = null

    SetFirstParticipant(participant: RelationshipParticipant<RT>): void {
        this.firstParticipant = participant
    }

    SetSecondParticipant(participant: RelationshipParticipant<RT>): void {
        this.secondParticipant = participant
    }

    Render(this: BaseRelationship<RT>, ctx: CanvasRenderingContext2D) {
        if (!this.firstParticipant || !this.secondParticipant) {
            return
        }

        ctx.lineWidth = 2
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

        resetCanvasContextProps(ctx)
    }
}