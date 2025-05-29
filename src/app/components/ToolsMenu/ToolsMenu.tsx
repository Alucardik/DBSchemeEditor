"use client"

import PopupText from "@/app/components/PopupText/PopupText"
import { Scheme } from "@/libs/dto/scheme"
import ERDManager from "@/libs/erd/erd_manager"
import { Client } from "@/libs/server/client"
import { redirect } from "next/navigation"
import { useState } from "react"

import styles from './ToolsMenu.module.scss'

export default function ToolsMenu() {
    const erdManager = ERDManager.GetInstance()
    const [isPopupHidden, setPopupHidden] = useState(true)
    const [isDeployPopupHidden, setDeployPopupHidden] = useState(true)
    const [sqlQuery, setSQLQuery] = useState("")
    const [deployStatus, setDeployStatus] = useState("")

    const handleToMenuOnClick = () => {
        redirect("/")
    }

    const handleSaveOnClick = () => {
        localStorage.setItem(erdManager.GetSchemeExportID(), erdManager.ExportScheme())
    }

    const handleOnGenerateSQLClick = async () => {
        const resp = await Client.GenerateSQL(erdManager.ConvertToServerScheme())
        if (resp.ok) {
            const { sql } = await resp.json()
            setSQLQuery(sql)
            setPopupHidden(false)
            return
        }

        const { message } = await resp.json()
        console.error("Failed to generate sql", message)
    }

    const handleOnDeployToDBClick = async () => {
        const resp = await Client.ApplyScheme(erdManager.ConvertToServerScheme())
        if (resp.ok) {
            setDeployStatus("Scheme successfully deployed")
            setDeployPopupHidden(false)
            return
        }

        const { message } = await resp.json()
        setDeployStatus("Error deploying scheme: " + message)
        setDeployPopupHidden(false)
    }

    const handleOnNormalize2NFClick = async () => {
        const resp = await Client.NormalizeScheme(erdManager.ConvertToServerScheme(), 2)
        if (resp.ok) {
            const { scheme } = await resp.json() as { scheme: Scheme }
            console.log(scheme)
            erdManager.ImportFromServerScheme(scheme)

            return
        }

        // TODO: support 422
        const { violations } = await resp.json()
        console.error(violations)
    }

    const handleOnNormalize3NFClick = async () => {
        const resp = await Client.NormalizeScheme(erdManager.ConvertToServerScheme(), 3)
        if (resp.ok) {
            const { scheme } = await resp.json() as { scheme: Scheme }
            console.log(scheme)
            erdManager.ImportFromServerScheme(scheme)

            return
        }

        // TODO: support 422
        const { violations } = await resp.json()
        console.error(violations)
    }

    return (
        <>
            <PopupText isHidden={isPopupHidden} listHeading={"Generated SQL-Script"} text={sqlQuery} onCloseHandler={() => setPopupHidden(true)} />
            <PopupText isHidden={isDeployPopupHidden} listHeading={deployStatus} text={""} onCloseHandler={() => setDeployPopupHidden(true)} />
            <div className={styles["tools-menu"]}>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleToMenuOnClick}
                >
                    To Menu
                </button>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleSaveOnClick}
                >
                    Save Scheme
                </button>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleOnGenerateSQLClick}
                >
                    Generate SQL
                </button>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleOnDeployToDBClick}
                >
                    Deploy to DB
                </button>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleOnNormalize2NFClick}
                >
                    Normalize Scheme To 2NF
                </button>
                <button
                    className={styles["tools-menu__button"]}
                    onClick={handleOnNormalize3NFClick}
                >
                    Normalize Scheme To 3NF
                </button>
            </div>
        </>
    )
}