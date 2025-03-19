import { enteredEditMode, exitedEntityMode } from "@/app/events"
import { editedEntityStore } from "@/app/stores"
import { BaseEntity } from "@/libs/erd/base_entity"
import { Point } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export default class EditModeManager {
    private inEditMode: boolean = false
    private editedEntity: Optional<BaseEntity> = null
    private draggedEntity: Optional<BaseEntity> = null
    private draggedEntityOffset: Optional<Point> = null

    SetEditedEntity(this: EditModeManager, editedEntity: Optional<BaseEntity>): void {
        this.editedEntity = editedEntity
    }

    GetEditedEntity(this: EditModeManager): Optional<BaseEntity> {
        return this.editedEntity
    }

    UnsetDraggedEntity(this: EditModeManager): void {
        this.draggedEntity = null
        this.draggedEntityOffset = null
    }

    SetDraggedEntity(this: EditModeManager, draggedEntity: BaseEntity): void {
        this.draggedEntity = draggedEntity
    }

    GetDraggedEntity(this: EditModeManager): Optional<BaseEntity> {
        return this.draggedEntity
    }

    UpdateDraggedEntityPosition(this: EditModeManager, mouseX: number, mouseY: number): void {
        if (!this.draggedEntity) {
            return
        }

        if (!this.draggedEntityOffset) {
            const entityPos = this.draggedEntity.GetPosition()
            this.draggedEntityOffset = new Point(mouseX - entityPos.x, mouseY - entityPos.y)
        }

        this.draggedEntity.SetPosition(mouseX - this.draggedEntityOffset.x, mouseY - this.draggedEntityOffset.y)
    }

    IsInEditMode(this: EditModeManager) {
        return this.inEditMode
    }

    EnterEditMode(this: EditModeManager, selectPart: boolean) {
        if (!this.editedEntity) {
            return
        }

        this.inEditMode = true

        editedEntityStore.Set({entity: this.editedEntity})
        enteredEditMode.Dispatch({ selectPart })
    }

    ExitEditMode(this: EditModeManager){
        if (!this.inEditMode) {
            return
        }

        this.inEditMode = false

        // remove highlight on edit mode exit
        this.editedEntity?.Unselect()
        editedEntityStore.Set({entity: null})
        exitedEntityMode.Dispatch(null)
    }
}