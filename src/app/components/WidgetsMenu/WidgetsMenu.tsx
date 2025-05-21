"use client"

import { editedEntityChanged, editedRelationshipChanged, EntityOpType, RelationshipOpType } from "@/app/events"
import useStore from "@/app/hooks/use_store"
import {
    canvasOffsetStore,
    editedEntityStore,
    editedRelationshipStore,
    inDependencyEditorStore,
    notationStore
} from "@/app/stores"
import { RelationshipParticipant } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { useRef } from "react"
import Select from "react-select"

import styles from './WidgetsMenu.module.scss'

export default function WidgetsMenu() {
    const { notation } = useStore(notationStore)
    const { entity } = useStore(editedEntityStore)
    const { relationship } = useStore(editedRelationshipStore)
    const canvasOffset = useStore(canvasOffsetStore)
    const currentAttrModifiers = useRef<{value: any, label: string}[]>([])

    // we are only editing fully established relationship
    if (relationship && relationship.IsComplete() && notation === CrowsFootNotation.GetNotationName()) {
        const firstParticipant = relationship.GetFirstParticipant() as unknown as RelationshipParticipant<CrowsFootNotation.RelationType>
        const secondParticipant = relationship.GetSecondParticipant() as unknown as RelationshipParticipant<CrowsFootNotation.RelationType>
        const firstPos = firstParticipant.GetPosition()
        const secondPos = secondParticipant.GetPosition()

        const firstRelationTypeOptions = []
        const secondRelationTypeOptions = []
        for (const relationType of CrowsFootNotation.GetAvailableRelationTypes()) {
            firstRelationTypeOptions.push((<option key={relationType} value={relationType}>{CrowsFootNotation.RelationTypeToString(relationType)}</option>))
            secondRelationTypeOptions.push((<option key={relationType} value={relationType}>{CrowsFootNotation.RelationTypeToString(relationType)}</option>))
        }
        
        return (
            <div className={styles["widgets-menu"]+" "+styles["widgets-menu_centered"]} style={{
                left:  Math.min(firstPos.x, secondPos.x) + Math.abs(firstPos.x - secondPos.x) / 2 - canvasOffset.x,
                top: Math.min(firstPos.y, secondPos.y) - canvasOffset.y,
            }}>
                <label>
                    First Participant
                    <select
                        className={styles["widgets-menu__list"]}
                        defaultValue={firstParticipant.GetRelationType()}
                        onChange={(event) => {
                            firstParticipant.SetRelationType(parseInt(event.target.value) as CrowsFootNotation.RelationType)
                            editedRelationshipChanged.Dispatch({
                                opType: RelationshipOpType.CHANGED,
                                relationshipID: relationship.GetID(),
                            })
                        }}>
                        {firstRelationTypeOptions}
                    </select>
                </label>
                <label>
                    Second Participant
                    <select
                        className={styles["widgets-menu__list"]}
                        defaultValue={secondParticipant.GetRelationType()}
                        onChange={(event) => {
                            secondParticipant.SetRelationType(parseInt(event.target.value) as CrowsFootNotation.RelationType)
                            editedRelationshipChanged.Dispatch({
                                opType: RelationshipOpType.CHANGED,
                                relationshipID: relationship.GetID(),
                            })
                        }}>
                        {secondRelationTypeOptions}
                    </select>
                </label>
                <button className={styles["widgets-menu__button"]} onClick={() => {
                    editedRelationshipChanged.Dispatch({
                        opType: RelationshipOpType.DELETED,
                        relationshipID: relationship.GetID(),
                    })
                }}>
                    Remove
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
        const modifierListVisible = selectedAttr ? "block" : "none"

        // setCurrentAttrModifiers((selectedAttr?.GetModifiers() || []).map(modifier => ({
        //     value: modifier,
        //     label: modifier,
        // })))

        // FIXME: select contents only rerender when re-selecting the attribute (but calling setState above breaks in infinite loop)
       currentAttrModifiers.current =  (selectedAttr?.GetModifiers() || []).map(modifier => ({
            value: modifier,
            label: modifier,
        }))

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
                    inDependencyEditorStore.Set(true)
                }}>
                    Edit Dependencies
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
                <label style={{display: modifierListVisible, userSelect: "none"}}>
                    Modifiers
                    <Select
                        options={CrowsFootNotation.GetAvailableModifierTypes().map(modifier => {
                            return { value: modifier, label: modifier }
                        })}
                        value={currentAttrModifiers.current}
                        isMulti
                        isClearable
                        placeholder={"Select modifiers"}
                        // className={styles["widgets-menu__list"]}
                        onChange={(event) => {
                            const newModifiers = Array.from(event.values())
                            currentAttrModifiers.current = newModifiers
                            selectedAttr?.SetModifiers(newModifiers.map(({ value }) => value))
                            editedEntityChanged.Dispatch({
                                opType: EntityOpType.CHANGED,
                                entityID: entity.GetID(),
                            })
                    }} />
                </label>
            </div>
        )
    }

    return (<div className={styles["widgets-menu"]}></div>)
}