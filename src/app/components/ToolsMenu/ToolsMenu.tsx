import ERDManager from "@/libs/erd/erd_manager"

import styles from './ToolsMenu.module.scss'

export default function ToolsMenu() {
    const erdManager = ERDManager.GetInstance()

    const handleOnClick = () => {
        localStorage.setItem(erdManager.GetSchemeExportID(), erdManager.ExportScheme())
    }

    return (
        <div className={styles["tools-menu"]}>
            <button
                className={styles["tools-menu__button"]}
                onClick={handleOnClick}
            >
                Save Scheme
            </button>
            <button
                className={styles["tools-menu__button"]}
                onClick={handleOnClick}
            >
                Generate SQL
            </button>
            <button
                className={styles["tools-menu__button"]}
                onClick={handleOnClick}
            >
                Deploy to DB
            </button>
        </div>
    )
}