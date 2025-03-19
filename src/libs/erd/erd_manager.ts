import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship, RelationshipParticipant } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Point } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"

export default class ERDManager {
    // TODO: save entities, relationships and current notation to local storage and upload from there on startup
    private entities: BaseEntity[] = []
    private relationships: BaseRelationship<any>[] = []
    private notationName: string = CrowsFootNotation.GetNotationName()

    GetNotationName(this: ERDManager) {
        return this.notationName
    }

    AddEntity(this: ERDManager, entity: BaseEntity) {
        // TODO: try casting to appropriate notation before adding
        this.entities.push(entity)
    }

    RemoveEntityByID(this: ERDManager, id: number) {
        const idxToRemove = this.entities.findIndex((entity: BaseEntity) => entity.GetID() === id)
        if (idxToRemove !== -1) {
            this.entities.splice(idxToRemove, 1)
        }
    }

    GetEntities(this: ERDManager): ReadonlyArray<BaseEntity> {
        return this.entities
    }

    CheckInteractedEntityByPosition(this: ERDManager, p: Point): Optional<BaseEntity> {
        return this.entities.find((entity: BaseEntity) =>
            entity.GetInteractedPart(p)
        ) || null
    }

    AddRelationship(
        this: ERDManager,
        firstParticipant: Optional<RelationshipParticipant<any>>,
        secondParticipant: Optional<RelationshipParticipant<any>>,
    ) {
        const relationShip = new BaseRelationship()
        if (firstParticipant) {
            relationShip.SetFirstParticipant(firstParticipant)
        }

        if (secondParticipant) {
            relationShip.SetSecondParticipant(secondParticipant)
        }

        this.relationships.push(relationShip)
    }

    GetRelationships(this: ERDManager): ReadonlyArray<BaseRelationship<any>> {
        return this.relationships
    }
}