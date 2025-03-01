import { canvasUpdateEvent } from "@/app/events"
import useStore from "@/app/hooks/use_store"
import { canvasOffsetStore, editedEntityStore, notationStore } from "@/app/stores"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"

import styles from './WidgetsMenu.module.scss'

export default function WidgetsMenu() {
    const { notation } = useStore(notationStore)
    const { entity } = useStore(editedEntityStore)
    const canvasOffset = useStore(canvasOffsetStore)

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
                    crowsFootEntity.AddAttribute("New Attribute", "string")
                    canvasUpdateEvent.Dispatch(null)
                }}>
                    Add Attribute
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.SetAsPrimaryKey()
                    canvasUpdateEvent.Dispatch(null)
                }}>
                    Set as PK
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.SetAsForeignKey()
                    canvasUpdateEvent.Dispatch(null)
                }}>
                    Set as FK
                </button>
                <button className={styles["widgets-menu__button"]} style={{display: modifierButtonDisplayStyle}} onClick={() => {
                    selectedAttr?.RemoveModifiers()
                    canvasUpdateEvent.Dispatch(null)
                }}>
                    Remove Modifiers
                </button>
            </div>
        )
    }

    return (<div className={styles["widgets-menu"]}></div>)
}