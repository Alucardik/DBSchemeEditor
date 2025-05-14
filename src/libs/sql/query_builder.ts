import { Attribute, AttributeConstraint, AttributeType } from "@/app/models/attributes"
import { RelationshipDestination, Scheme } from "@/app/models/scheme"
import {
    DuplicateAttributes,
    DuplicateEntities,
    InvalidRelationshipDestination,
    NoScheme,
    UnknownAttributeType,
    UnknownConstraint
} from "@/libs/errors/validation"
import { Optional } from "@/libs/utils/types"

const format = require("pg-format")

export class QueryBuilder {
    private scheme: Optional<Scheme> = null

    ValidateScheme(this: QueryBuilder, scheme: Scheme): Optional<Error> {
        const entityNames = new Set(scheme.entities.map((entity) => entity.name))

        if (entityNames.size !== scheme.entities.length) {
            return DuplicateEntities
        }

        const attributesMap = new Map<string, Set<string>>()

        for (const entity of scheme.entities) {
            const attributeNames = new Set<string>()

            for (const attribute of entity.attributes) {
                if (attribute.type < 0 || attribute.type > AttributeType.Boolean) {
                    return UnknownAttributeType
                }

                for (const constraint of attribute.constraints) {
                    if (constraint < 0 || constraint > AttributeConstraint.ForeignKey) {
                        return UnknownConstraint
                    }
                }

                attributeNames.add(attribute.name)
            }

            if (attributeNames.size !== entity.attributes.length) {
                return DuplicateAttributes
            }

            attributesMap.set(entity.name, attributeNames)
        }

        const verifyDestination = (dest: RelationshipDestination): boolean => {
            const attributes = attributesMap.get(dest.entityName)

            if (!attributes) {
                return false
            }

            return attributes.has(dest.attributeName)
        }

        for (const relationship of scheme.relationships) {
            if (!verifyDestination(relationship.from) || !verifyDestination(relationship.to)) {
                return InvalidRelationshipDestination
            }
        }

        return null
    }

    SetScheme(this: QueryBuilder, scheme: Scheme): Optional<Error> {
        const err = this.ValidateScheme(scheme)
        if (err !== null) {
            return err
        }

        this.scheme = scheme

        return null
    }

    Build(this: QueryBuilder): [string, Optional<Error>] {
        if (!this.scheme) {
            return ["", NoScheme]
        }

        const queryParts = [] as string[]
        for (const entity of this.scheme.entities) {
            const [table, err] = this.CreateTableQuery(entity.name, entity.attributes)
            if (err !== null) {
                return ["", err]
            }

            queryParts.push(table)
        }

        return [queryParts.join("\n"), null]
    }

    private CreateTableQuery(this: QueryBuilder, tableName: string, attributes: Attribute[]): [string, Optional<Error>] {
        const queryParts = ["CREATE TABLE %I ("] as string[]
        const queryArgs = [tableName]

        for (const [index, attribute] of attributes.entries()) {
            let attrQuery = "%I "
            switch (attribute.type) {
                case AttributeType.Integer:
                    attrQuery += "INTEGER"
                    break
                case AttributeType.Float:
                    attrQuery += "FLOAT"
                    break
                case AttributeType.String:
                    attrQuery += "TEXT"
                    break
                case AttributeType.Boolean:
                    attrQuery += "BOOLEAN"
                    break
                default:
                    return ["", UnknownAttributeType]
            }

            for (const constraint of new Set(attribute.constraints)) {
                switch (constraint) {
                    case AttributeConstraint.NotNullable:
                        attrQuery += " NOT NULL"
                        break
                    case AttributeConstraint.PrimaryKey:
                        attrQuery += " PRIMARY KEY"
                        break
                }
            }

            if (index !== attributes.length - 1) {
                attrQuery += ","
            }

            queryParts.push(attrQuery)
            queryArgs.push(attribute.name)
        }

        queryParts.push(");")

        try {
            const res = format(queryParts.join("\n"), ...queryArgs)
            return [res, null]
        } catch (e) {
            // @ts-ignore
            return ["", e]
        }
    }


}