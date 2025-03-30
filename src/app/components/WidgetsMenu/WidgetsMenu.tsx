import { editedEntityChanged, editedRelationshipChanged, EntityOpType, RelationshipOpType } from "@/app/events"
import useStore from "@/app/hooks/use_store"
import { canvasOffsetStore, editedEntityStore, editedRelationshipStore, notationStore } from "@/app/stores"
import { RelationshipParticipant } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"

import styles from './WidgetsMenu.module.scss'

export default function WidgetsMenu() {
    const { notation } = useStore(notationStore)
    const { entity } = useStore(editedEntityStore)
    const { relationship } = useStore(editedRelationshipStore)
    const canvasOffset = useStore(canvasOffsetStore)

    // we are only editing fully established relationship
    if (relationship && relationship.IsComplete() && notation === CrowsFootNotation.GetNotationName()) {
        const firstParticipant = relationship.GetFirstParticipant() as unknown as RelationshipParticipant<CrowsFootNotation.RelationType>
        const secondParticipant = relationship.GetSecondParticipant() as unknown as RelationshipParticipant<CrowsFootNotation.RelationType>
        const firstPos = firstParticipant.GetPosition()
        const secondPos = secondParticipant.GetPosition()

        // TODO: hide options behind list for first and second participants
        //  and form it dynamically
        return (
            <div className={styles["widgets-menu"]+" "+styles["widgets-menu_centered"]} style={{
                left:  Math.min(firstPos.x, secondPos.x) + Math.abs(firstPos.x - secondPos.x) / 2 - canvasOffset.x,
                top: Math.min(firstPos.y, secondPos.y) - canvasOffset.y,
            }}>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.DELETED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Remove
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = firstParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleOptional:
                            newRelationType = CrowsFootNotation.RelationType.SingleRequired
                            break
                        case CrowsFootNotation.RelationType.ManyOptional:
                            newRelationType = CrowsFootNotation.RelationType.ManyRequired
                            break
                        default:
                            return
                    }

                    firstParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make First Required
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = secondParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleOptional:
                            newRelationType = CrowsFootNotation.RelationType.SingleRequired
                            break
                        case CrowsFootNotation.RelationType.ManyOptional:
                            newRelationType = CrowsFootNotation.RelationType.ManyRequired
                            break
                        default:
                            return
                    }

                    secondParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make Second Required
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = firstParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleRequired:
                            newRelationType = CrowsFootNotation.RelationType.SingleOptional
                            break
                        case CrowsFootNotation.RelationType.ManyRequired:
                            newRelationType = CrowsFootNotation.RelationType.ManyOptional
                            break
                        default:
                            return
                    }

                    firstParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make First Optional
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = secondParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleRequired:
                            newRelationType = CrowsFootNotation.RelationType.SingleOptional
                            break
                        case CrowsFootNotation.RelationType.ManyRequired:
                            newRelationType = CrowsFootNotation.RelationType.ManyOptional
                            break
                        default:
                            return
                    }

                    secondParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make Second Optional
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = firstParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.ManyOptional:
                            newRelationType = CrowsFootNotation.RelationType.SingleOptional
                            break
                        case CrowsFootNotation.RelationType.ManyRequired:
                            newRelationType = CrowsFootNotation.RelationType.SingleRequired
                            break
                        default:
                            return
                    }

                    firstParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make First Single
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = secondParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.ManyOptional:
                            newRelationType = CrowsFootNotation.RelationType.SingleOptional
                            break
                        case CrowsFootNotation.RelationType.ManyRequired:
                            newRelationType = CrowsFootNotation.RelationType.SingleRequired
                            break
                        default:
                            return
                    }

                    secondParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make Second Single
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = firstParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleOptional:
                            newRelationType = CrowsFootNotation.RelationType.ManyOptional
                            break
                        case CrowsFootNotation.RelationType.SingleRequired:
                            newRelationType = CrowsFootNotation.RelationType.ManyRequired
                            break
                        default:
                            return
                    }

                    firstParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make First Many
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    const currentRelationType = secondParticipant.GetRelationType()
                    let newRelationType = currentRelationType

                    switch (currentRelationType) {
                        case CrowsFootNotation.RelationType.SingleOptional:
                            newRelationType = CrowsFootNotation.RelationType.ManyOptional
                            break
                        case CrowsFootNotation.RelationType.SingleRequired:
                            newRelationType = CrowsFootNotation.RelationType.ManyRequired
                            break
                        default:
                            return
                    }

                    secondParticipant.SetRelationType(newRelationType)
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.CHANGED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Make Second Many
                </button>
            </div>
        )
    }

    if (!entity) {
        return (<></>)
    }

    const entityPos = entity.GetPosition()

    if (notation === CrowsFootNotation.GetNotationName()) {
        const crowsFootEntity = entity as CrowsFootNotation.Entity
        const selectedAttr = crowsFootEntity.GetSelectedAttribute()
        const modifierButtonDisplayStyle = selectedAttr ? "block" : "none"

        return (
            <div className={styles["widgets-menu"]} style={{left: entityPos.x - canvasOffset.x, top: entityPos.y - canvasOffset.y}}>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    editedEntityChanged.Dispatch({
                        opType: EntityOpType.DELETED,
                        entityID: entity.GetID(),
                    })
                }}>
                    Remove
                </button>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    crowsFootEntity.AddAttribute("New Attribute", "string")
                    editedEntityChanged.Dispatch({
                        opType: EntityOpType.CHANGED,
                        entityID: entity.GetID(),
                    })
                }}>
                    Add Attribute
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.SetAsPrimaryKey()
                    editedEntityChanged.Dispatch({
                        opType: EntityOpType.CHANGED,
                        entityID: entity.GetID(),
                    })
                }}>
                    Set as PK
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.SetAsForeignKey()
                    editedEntityChanged.Dispatch({
                        opType: EntityOpType.CHANGED,
                        entityID: entity.GetID(),
                    })
                }}>
                    Set as FK
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.RemoveModifiers()
                    editedEntityChanged.Dispatch({
                        opType: EntityOpType.CHANGED,
                        entityID: entity.GetID(),
                    })
                }}>
                    Remove Modifiers
                </button>
            </div>
        )
    }

    return (<div className={styles["widgets-menu"]}></div>)
}