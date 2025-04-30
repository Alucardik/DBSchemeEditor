import ERDManager from "@/libs/erd/erd_manager"

import styles from './ToolsMenu.module.scss'

export default function ToolsMenu() {
    const erdManager = ERDManager.GetInstance()

    const handleOnClick = () => {
        const scheme = erdManager.ExportScheme()
        localStorage.setItem(erdManager.GetSchemeName(), scheme)
    }

    return (
        <div className={styles["tools-menu"]}>
            <button
                className={styles["tools-menu__button"]}
                onClick={handleOnClick}
            >
                Save Scheme
            </button>
        </div>
    )
}