import { enteredEditMode, exitedEditMode, relationEditingFinished } from "@/app/events"
import { editedEntityStore, editedRelationshipStore } from "@/app/stores"
import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship, ParticipantType } from "@/libs/erd/base_relationship"
import { Point } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export default class EditModeManager {
    private inEditMode: boolean = false
    private editedEntity: Optional<BaseEntity> = null
    private editedRelationship: Optional<BaseRelationship<any>> = null
    private draggedEntity: Optional<BaseEntity> = null
    private draggedEntityOffset: Optional<Point> = null

    UnsetEditedEntity(this: EditModeManager): void {
        this.editedEntity = null
    }

    SetEditedEntity(this: EditModeManager, editedEntity: BaseEntity): void {
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

    UnsetEditedRelationship(this: EditModeManager): void {
        this.editedRelationship = null
    }

    SetEditedRelationship(this: EditModeManager, relationship: BaseRelationship<any>): void {
        this.editedRelationship = relationship
    }

    GetEditedRelationship(this: EditModeManager): Optional<BaseRelationship<any>> {
        return this.editedRelationship
    }

    UpdateEditedRelationshipPosition(this: EditModeManager, participantType: ParticipantType, mouseX: number, mouseY: number): void {
        if (!this.editedRelationship) {
            return
        }

        if (participantType === ParticipantType.First) {
            this.editedRelationship.GetFirstParticipant()?.SetPosition(new Point(mouseX, mouseY))
            return
        }

        if (participantType === ParticipantType.Second) {
            this.editedRelationship.GetSecondParticipant()?.SetPosition(new Point(mouseX, mouseY))
            return
        }
    }

    IsInEditMode(this: EditModeManager) {
        return this.inEditMode
    }

    EnterEditMode(this: EditModeManager, selectPart: boolean) {
        if (!this.editedEntity && !this.draggedEntity && !this.editedRelationship) {
            return
        }

        this.inEditMode = true

        editedRelationshipStore.Set({relationship: this.editedRelationship})
        editedEntityStore.Set({entity: this.editedEntity})
        enteredEditMode.Dispatch({ selectPart })
    }

    ExitEditMode(this: EditModeManager): void {
        if (!this.inEditMode) {
            return
        }

        this.inEditMode = false

        if (!this.editedEntity && !this.editedRelationship) {
            exitedEditMode.Dispatch(null)
            return
        }

        if (this.editedRelationship) {
            // TODO: maybe dispatch editedRelationshipChanged event
            relationEditingFinished.Dispatch({ relationship: this.editedRelationship })
        }

        // remove highlight on edit mode exit
        this.editedEntity?.Unselect()
        this.UnsetEditedEntity()
        this.UnsetEditedRelationship()

        editedRelationshipStore.Set({relationship: null})
        editedEntityStore.Set({entity: null})
        exitedEditMode.Dispatch(null)
    }
}