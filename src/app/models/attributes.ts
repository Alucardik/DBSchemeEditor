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

export {
    AttributeType,
    AttributeConstraint,
}