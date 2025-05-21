"use client"

import { Key } from "@/libs/utils/keys_enums"
import { KeyboardEvent, MouseEvent } from "react"
import styles from "./PopupText.module.scss"

export default function PopupText({ isHidden, listHeading, text, onCloseHandler }: {
    isHidden: boolean,
    listHeading: string,
    text: string,
    onCloseHandler: (e: MouseEvent | KeyboardEvent) => void,
}) {
    if (isHidden) {
        return <></>
    }

    const onKeyDownHandler = (e: KeyboardEvent) => {
        if (e.key === Key.Escape) {
            onCloseHandler(e)
        }
    }

    // TODO: add exit button
    return (
        <div tabIndex={1} onKeyDown={onKeyDownHandler} className={styles["popup-list__overlay"]}>
            <div className={styles["popup-list"]}>
                <h3 style={{userSelect: "none"}}>{listHeading}</h3>
                <pre><code>{text}</code></pre>
                <button onClick={onCloseHandler}>Close</button>
            </div>
        </div>
    )
}