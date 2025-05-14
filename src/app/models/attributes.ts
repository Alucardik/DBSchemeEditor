enum AttributeType {
    Unknown = -1,
    Integer,
    Float,
    String,
    Boolean,
}

enum AttributeConstraint {
    NotNullable,
    PrimaryKey,
    ForeignKey,
}

class Attribute {
    name: string = ""
    type: AttributeType = AttributeType.Unknown
    constraints: AttributeConstraint[] = []
}

export {
    AttributeType,
    AttributeConstraint,
    Attribute,
}