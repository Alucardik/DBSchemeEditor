import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Point } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"

export default class ERDManager {
    private static instance: ERDManager

    // TODO: save entities, relationships and current notation to local storage and upload from there on startup
    private entities: BaseEntity[] = []
    private relationships: BaseRelationship<any>[] = []
    private notationName: string = CrowsFootNotation.GetNotationName()
    private schemeName: string = "test_scheme"

    private constructor() {}

    static GetInstance(): ERDManager {
        if (!ERDManager.instance) {
            ERDManager.instance = new ERDManager()
        }

        return this.instance
    }

    ExportScheme(this: ERDManager): string {
        // TODO: use msgpack or something similar
        return JSON.stringify({
            entities: JSON.stringify(this.entities),
            relationships: JSON.stringify(this.relationships),
            notation: this.notationName,
        })
    }

    ImportScheme(this: ERDManager, scheme: string) {
        const structuredScheme = JSON.parse(scheme) as {entities: string, relationships: string, notation: string}

        switch (structuredScheme.notation) {
            case CrowsFootNotation.GetNotationName():
                this.entities = JSON.parse(structuredScheme.entities) as CrowsFootNotation.Entity[]
                this.relationships = JSON.parse(structuredScheme.relationships) as CrowsFootNotation.Relationship[]
                break
            default:
                throw Error(`Unknown scheme "${structuredScheme.notation}"`)
        }

        this.notationName = structuredScheme.notation
    }

    SetSchemeName(this: ERDManager, schemeName: string) {
        this.schemeName = schemeName
    }

    GetSchemeName(this: ERDManager): string {
        return this.schemeName
    }

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
            this.entities[idxToRemove].DetachAllRelationships()
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
        relationship: BaseRelationship<any>,
    ) {
        this.relationships.push(relationship)
    }

    RemoveRelationshipByID(this: ERDManager, id: number) {
        const idxToRemove = this.relationships.findIndex((relationship: BaseRelationship<any>) => relationship.GetID() === id)
        if (idxToRemove !== -1) {
            this.relationships[idxToRemove].DetachParticipants()
            this.relationships.splice(idxToRemove, 1)
        }
    }

    GetRelationships(this: ERDManager): ReadonlyArray<BaseRelationship<any>> {
        return this.relationships
    }

    CheckInteractedRelationshipByPosition(this: ERDManager, p: Point): Optional<BaseRelationship<any>> {
        return this.relationships.find((relationship: BaseRelationship<any>) =>
            relationship.IsInteracted(p)
        ) || null
    }
}