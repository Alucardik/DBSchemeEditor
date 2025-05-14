import { Attribute } from "@/app/models/attributes"

class Scheme {
    entities: Entity[] = []
    relationships: Relationship[] = []
}


class Entity {
    name: string = ""
    attributes: Attribute[] = []
}

class RelationshipDestination {
    entityName: string = ""
    attributeName: string = ""
}

class Relationship {
    from: RelationshipDestination = new RelationshipDestination()
    to: RelationshipDestination = new RelationshipDestination()
}

export {
    Scheme,
    Entity,
    RelationshipDestination,
    Relationship,
}