import { Attribute, AttributeConstraint, AttributeType } from "@/app/models/attributes"
import { Entity, Relationship, RelationshipDestination, Scheme } from "@/app/models/scheme"
import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Point } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"
import { v4 as uuidv4, validate as validateUUID } from "uuid"

export default class ERDManager {
    private static instance: ERDManager

    // TODO: save entities, relationships and current notation to local storage and upload from there on startup
    private entities: BaseEntity[] = []
    private relationships: BaseRelationship<any>[] = []
    private notationName: string = CrowsFootNotation.GetNotationName()
    private schemeID: string = ""
    private schemeName: string = "test_scheme"

    private constructor() {}

    static GetInstance(): ERDManager {
        if (!ERDManager.instance) {
            ERDManager.instance = new ERDManager()
        }

        return this.instance
    }

    static CheckSchemeExportID(exportID: string): boolean {
        const parts = exportID.split("_")
        if (parts.length != 3) {
            return false
        }

        return parts[0] === "erd" && validateUUID(parts[1])
    }

    Clear(this: ERDManager): void {
        this.entities = []
        this.relationships = []
    }

    GetSchemeExportID(this: ERDManager): string {
        return ["erd", this.schemeID, this.schemeName].join("_")
    }

    ExportScheme(this: ERDManager): string {
        // TODO: use msgpack or something similar
        return JSON.stringify({
            entities: this.entities.map((entity) => entity.ToJSON()),
            relationships: this.relationships,
            notation: this.notationName,
            schemeID: this.schemeID,
            schemeName: this.schemeName,
        })
    }

    ConvertToServerScheme(this: ERDManager): Scheme {
        const ret = new Scheme()
        ret.relationships = this.relationships.map((relationShip) => {
            const rel = new Relationship()

            rel.from = new RelationshipDestination()
            const fromAttr = relationShip.GetFirstParticipant()?.GetEntityAttribute()
            const toAttr = relationShip.GetSecondParticipant()?.GetEntityAttribute()

            rel.from.attributeName = fromAttr?.GetText() || ""
            rel.from.entityName = this.entities.find((entity) => {
                return entity.GetAttributes().findIndex((attribute) => attribute === fromAttr) !== -1
            })?.GetName() || ""

            rel.to.attributeName = toAttr?.GetText() || ""
            rel.to.entityName = this.entities.find((entity) => {
                return entity.GetAttributes().findIndex((attribute) => attribute === toAttr) !== -1
            })?.GetName() || ""

            return rel
        })

        ret.entities = this.entities.map((entity) => {
            const ent = new Entity()
            ent.name = entity.GetName()
            ent.attributes = entity.GetAttributes().map((attribute) => {
                const attr = new Attribute()

                attr.name = attribute.GetText()
                // FIXME: start using attribute types
                attr.type = AttributeType.Integer
                attr.constraints = []

                if (attribute instanceof CrowsFootNotation.EntityAttribute) {
                    const modifierType = (attribute as CrowsFootNotation.EntityAttribute).GetModifierType()
                    switch (modifierType) {
                        case CrowsFootNotation.ModifierType.PrimaryKey:
                            attr.constraints.push(AttributeConstraint.PrimaryKey)
                            break
                        case CrowsFootNotation.ModifierType.ForeignKey:
                            attr.constraints.push(AttributeConstraint.ForeignKey)
                            break
                    }
                }

                return attr
            })

            return ent
        })

        return ret
    }

    ImportScheme(this: ERDManager, scheme: string) {
        const structuredScheme = JSON.parse(scheme) as {
            entities: object[],
            relationships: object[],
            notation: string,
            schemeID: string,
            schemeName: string,
        }

        switch (structuredScheme.notation) {
            case CrowsFootNotation.GetNotationName():
                this.entities = structuredScheme.entities.map((entity: object) => CrowsFootNotation.Entity.FromJSON(entity)) as CrowsFootNotation.Entity[]
                this.relationships = structuredScheme.relationships.map((relation: object) => CrowsFootNotation.Relationship.FromJSON(relation)) as CrowsFootNotation.Relationship[]
                break
            default:
                throw Error(`Unknown scheme "${structuredScheme.notation}"`)
        }

        this.notationName = structuredScheme.notation
        this.schemeID = structuredScheme.schemeID
        this.schemeName = structuredScheme.schemeName
    }

    InitNewScheme(this: ERDManager, schemeName: string, notationName: string): void {
        this.schemeID = uuidv4()
        this.schemeName = schemeName
        this.notationName = notationName
        this.Clear()
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