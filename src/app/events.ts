import { BaseRelationship, ParticipantType } from "@/libs/erd/base_relationship"
import { CustomEventWrapper } from "@/libs/stores/events"

const editedEntityChanged = new CustomEventWrapper<null>("change_edited_entity")
const enteredEditMode = new CustomEventWrapper<{ selectPart: boolean }>("enter_edit_mode")
const exitedEntityMode = new CustomEventWrapper<null>("exit_edit_mode")
const relationEditingStarted = new CustomEventWrapper<{
    relationship: BaseRelationship<any>,
    participantType: ParticipantType,
}>("relation_editing_started")
const relationEditingFinished = new CustomEventWrapper<{ relationship: BaseRelationship<any> }>("relation_editing_finished")

export {
    editedEntityChanged,
    enteredEditMode,
    exitedEntityMode,
    relationEditingStarted,
    relationEditingFinished,
}