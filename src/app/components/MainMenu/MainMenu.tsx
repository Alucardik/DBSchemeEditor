"use client"

import PopupList from "@/app/components/PopupList/PopupList"
import ERDManager from "@/libs/erd/erd_manager"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import styles from "./MainMenu.module.scss"

export default function MainMenu() {
    const erdManager = ERDManager.GetInstance()
    const [newSchemePopupHidden, setNewSchemePopupHidden] = useState(true)
    const [importSchemePopupHidden, setImportSchemePopupHidden] = useState(true)
    const [importOptions, setImportOptions] = useState([] as string[])

    const handleOnNewSchemeButtonClick = () => {
        setNewSchemePopupHidden(false)
    }

    const handleOnImportSchemeButtonClick = () => {
        setImportSchemePopupHidden(false)
    }

    const getSchemesFromLocalStorage = (): string[] => {
        const ret = [] as string[]

        for (const key in localStorage) {
            if (ERDManager.CheckSchemeExportID(key)) {
                ret.push(key)
            }
        }

        return ret
    }

    useEffect(() => {
        setImportOptions(getSchemesFromLocalStorage())
    }, [])

    return (
        <>
            <PopupList
               isHidden={newSchemePopupHidden}
               listHeading={"Choose Notation"}
               listOptions={[CrowsFootNotation.GetNotationName(), "Barker's"]}
               onButtonClickHandler={(e, notationName) => {
                   erdManager.InitNewScheme("new scheme", notationName)
                   redirect("/editor")
               }}
               onCloseHandler={(e) => {
                    setNewSchemePopupHidden(true)
               }}
            />
            <PopupList
                isHidden={importSchemePopupHidden}
                listHeading={"Choose scheme to load"}
                listOptions={importOptions}
                onButtonClickHandler={(e, key) => {
                    try {
                        erdManager.ImportScheme(localStorage.getItem(key) || "")
                    } catch (e) {
                        console.error(e)
                        return
                    }

                    redirect("/editor")
                }}
                onCloseHandler={(e) => {
                    setImportSchemePopupHidden(true)
                }}
            />
            <div className={styles["main-menu"]}>
                <button
                    type="button"
                    className={styles["main-menu__button"]}
                    onClick={handleOnNewSchemeButtonClick}
                >
                    New Scheme
                </button>
                <button
                    type="button"
                    className={styles["main-menu__button"]}
                    onClick={handleOnImportSchemeButtonClick}
                >
                    Import Scheme
                </button>
            </div>

        </>
    )
}