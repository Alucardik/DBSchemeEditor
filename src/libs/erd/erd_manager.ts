import { exitedEditMode } from "@/app/events"
import { AttributeConstraint, AttributeType } from "@/app/models/attributes"
import * as dto from "@/libs/dto/scheme"
import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Point } from "@/libs/render/shapes"
import { Optional } from "@/libs/utils/types"
import { v4 as uuidv4, validate as validateUUID } from "uuid"
import EntityAttributeType = CrowsFootNotation.AttributeType

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

    ConvertToServerScheme(this: ERDManager): dto.Scheme {
        const ret = {} as dto.Scheme
        ret.relationships = this.relationships.map((relationShip) => {
            const rel = {
                from: {},
                to: {},
            } as dto.Relationship
            const fromAttr = relationShip.GetFirstParticipant()?.GetEntityAttribute()
            const toAttr = relationShip.GetSecondParticipant()?.GetEntityAttribute()

            // FIXME: support multi-part foreign and primary keys
            rel.from.attributeNames = fromAttr ? [fromAttr.GetText().split(":")[0].trim()] : []
            // FIXME: table name still is unspecified
            rel.from.tableName = this.entities.find((entity) => {
                return entity.GetAttributes().findIndex((attribute) => attribute === fromAttr) !== -1
            })?.GetName() || ""

            rel.to.attributeNames = toAttr ? [toAttr.GetText().split(":")[0].trim()] : []
            rel.to.tableName = this.entities.find((entity) => {
                return entity.GetAttributes().findIndex((attribute) => attribute === toAttr) !== -1
            })?.GetName() || ""

            return rel
        })

        ret.tables = this.entities.map((entity) => {
            const table = {} as dto.Table
            table.name = entity.GetName()
            table.attributes = entity.GetAttributes().map((attribute) => {
                const attr = {} as dto.Attribute

                attr.name = attribute.GetText().split(":")[0].trim()
                attr.type = AttributeType.Integer
                attr.constraints = []

                if (attribute instanceof CrowsFootNotation.EntityAttribute) {
                    const castAttr = attribute as CrowsFootNotation.EntityAttribute
                    switch (castAttr.GetType()) {
                        case EntityAttributeType.Integer:
                            attr.type = AttributeType.Integer
                            break
                        case EntityAttributeType.Float:
                            attr.type = AttributeType.Float
                            break
                        case EntityAttributeType.String:
                            attr.type = AttributeType.String
                            break
                        case EntityAttributeType.Boolean:
                            attr.type = AttributeType.Boolean
                            break
                    }

                    castAttr.GetModifiers().forEach(modifier => {
                        switch (modifier) {
                            case CrowsFootNotation.ModifierType.NotNull:
                                attr.constraints.push(AttributeConstraint.NotNullable)
                                break
                            case CrowsFootNotation.ModifierType.PrimaryKey:
                                attr.constraints.push(AttributeConstraint.PrimaryKey)
                                break
                            case CrowsFootNotation.ModifierType.ForeignKey:
                                attr.constraints.push(AttributeConstraint.ForeignKey)
                                break
                        }
                    })
                }

                return attr
            })
            
            table.dependencies = entity.GetDependencies().map(dep => ({
                determinants: dep.lhs,
                dependants: dep.rhs,
            }))

            return table
        })

        return ret
    }

    ImportFromServerScheme(this: ERDManager, scheme: dto.Scheme) {
        this.entities = scheme.tables.map(((table, index) => {
            // TODO: add better position calculation, based on device screen
            const [xOffset, yOffset] = [250, 500]
            switch (this.notationName) {
                case CrowsFootNotation.GetNotationName():
                default:
                    const entity = new CrowsFootNotation.Entity(table.name, (index + 1) * xOffset, yOffset)
                    table.attributes.forEach(attr => {
                        let attrType = EntityAttributeType.Integer
                        switch (attr.type) {
                            case AttributeType.String:
                                attrType = EntityAttributeType.String
                                break
                            case AttributeType.Boolean:
                                attrType = EntityAttributeType.Boolean
                                break
                            case AttributeType.Float:
                                attrType = EntityAttributeType.Float
                                break
                        }

                        entity.AddAttribute(attr.name, attrType, ...attr.constraints.map(constraint => {
                            switch (constraint) {
                                case AttributeConstraint.NotNullable:
                                    return CrowsFootNotation.ModifierType.NotNull
                                case AttributeConstraint.ForeignKey:
                                    return CrowsFootNotation.ModifierType.ForeignKey
                                case AttributeConstraint.PrimaryKey:
                                    return CrowsFootNotation.ModifierType.PrimaryKey
                                default:
                                    return ""
                            }
                        }))
                    })
                    entity.SetName(table.name)

                    return entity
            }
        }))

        this.relationships = scheme.relationships.map(relation => {
            switch (this.notationName) {
                case CrowsFootNotation.GetNotationName():
                default:
                    const rel = new CrowsFootNotation.Relationship()
                    const fromEntity = this.entities.find(entity => entity.GetName() === relation.from.tableName)
                    const toEntity = this.entities.find(entity => entity.GetName() === relation.to.tableName)

                    if (!fromEntity || !toEntity) {
                        console.error("failed to find relation from | to entity", fromEntity, toEntity)
                        return rel
                    }

                    const fromAttrs = fromEntity.GetAttributes().filter(attr =>
                        relation.from.attributeNames.findIndex((relationAttr) => relationAttr === attr.GetText().split(":")[0].trim()) !== -1) as CrowsFootNotation.EntityAttribute[]
                    const toAttrs = toEntity.GetAttributes().filter(attr =>
                        relation.to.attributeNames.findIndex((relationAttr) => relationAttr === attr.GetText().split(":")[0].trim()) !== -1)  as CrowsFootNotation.EntityAttribute[]

                    if (fromAttrs.length === 0 || toAttrs.length === 0) {
                        console.error("failed to find relation attributes", relation.from.attributeNames, relation.to.attributeNames)
                        return rel
                    }

                    // FIXME: support attaching several attributes to a relationship
                    fromAttrs[0].AttachToRelationship(rel, new Point(0, 0), 1)
                    toAttrs[0].AttachToRelationship(rel, new Point(0, 0), 0)

                    return rel
            }
        }).filter(relation => relation.IsComplete())

        // render new scheme
        exitedEditMode.Dispatch(null)
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
                this.entities = structuredScheme.entities.map((entity: object) =>
                    CrowsFootNotation.Entity.FromJSON(entity as CrowsFootNotation.Entity)) as CrowsFootNotation.Entity[]
                this.relationships = structuredScheme.relationships.map((relation: object) =>
                    CrowsFootNotation.Relationship.FromJSON(relation as CrowsFootNotation.Relationship)) as CrowsFootNotation.Relationship[]
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