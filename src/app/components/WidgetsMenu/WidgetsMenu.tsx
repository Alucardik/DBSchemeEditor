import useStore from "@/app/hooks/use_store"
import { editedEntityStore, notationStore } from "@/app/stores"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"

import styles from './WidgetsMenu.module.scss'

export default function WidgetsMenu() {
    const { notation } = useStore(notationStore)
    const { entity } = useStore(editedEntityStore)

    if (!entity) {
        return (<></>)
    }

    const entityPos = entity.GetPosition()

    if (notation === CrowsFootNotation.GetNotationName()) {
        const crowsFootEntity = entity as CrowsFootNotation.Entity

        return (
            <div className={styles["widgets-menu"]} style={{left: entityPos.x, top: entityPos.y}}>
                <button onClick={() => {
                    crowsFootEntity.AddAttribute("New Attribute", "string")
                }}>
                    Add Attribute
                </button>
            </div>
        )
    }

    return (<div className={styles["widgets-menu"]}></div>)
}