import { CustomEventWrapper } from "@/libs/stores/events"

const editedEntityChanged = new CustomEventWrapper<null>("change_edited_entity")
const enteredEditMode = new CustomEventWrapper<{ selectPart: boolean }>("enter_edit_mode")
const exitedEntityMode = new CustomEventWrapper<null>("exit_edit_mode")

export {
    editedEntityChanged,
    enteredEditMode,
    exitedEntityMode,
}