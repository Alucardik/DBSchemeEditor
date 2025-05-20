import { BaseRelationship, ParticipantType } from "@/libs/erd/base_relationship"
import { CustomEventWrapper } from "@/libs/stores/events"

enum RelationshipOpType {
    CHANGED,
    DELETED,
}

enum EntityOpType {
    CHANGED,
    DELETED,
}

const editedEntityChanged = new CustomEventWrapper<{
    opType: EntityOpType,
    entityID: number,
}>("change_edited_entity")

const editedRelationshipChanged = new CustomEventWrapper<{
    opType: RelationshipOpType,
    relationshipID: number,
}>("change_edited_relationship")

const enteredEditMode = new CustomEventWrapper<{
    selectPart: boolean,
}>("enter_edit_mode")

const exitedEditMode = new CustomEventWrapper<null>("exit_edit_mode")

const relationEditingStarted = new CustomEventWrapper<{
    relationship: BaseRelationship<any>,
    participantType: ParticipantType,
}>("relation_editing_started")

const relationEditingFinished = new CustomEventWrapper<{
    relationship: BaseRelationship<any>,
}>("relation_editing_finished")

export {
    RelationshipOpType,
    EntityOpType,
    editedEntityChanged,
    editedRelationshipChanged,
    enteredEditMode,
    exitedEditMode,
    relationEditingStarted,
    relationEditingFinished,
}