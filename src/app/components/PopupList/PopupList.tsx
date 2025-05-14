import { Key } from "@/libs/utils/keys_enums"
import { KeyboardEvent, MouseEvent } from "react"
import styles from "./PopupList.module.scss"

export default function PopupList({ isHidden, listHeading, listOptions, onButtonClickHandler, onCloseHandler }: {
    isHidden: boolean,
    listHeading: string,
    listOptions: string[],
    onButtonClickHandler: (e: MouseEvent, listOption: string) => void,
    onCloseHandler: (e: MouseEvent | KeyboardEvent) => void,
}) {
    if (isHidden) {
        return <></>
    }

    const listElements = listOptions.map((listOption: string, i: number) => {
        return (
            <li className={styles["popup-list__option"]} key={i}>
                <button onClick={(e) => onButtonClickHandler(e, listOption)}>
                    {listOption}
                </button>
            </li>
        )
    })

    const onKeyDownHandler = (e: KeyboardEvent) => {
        if (e.key === Key.Escape) {
            onCloseHandler(e)
        }
    }

    // TODO: add exit button
    return (
        <div tabIndex={1} onKeyDown={onKeyDownHandler} className={styles["popup-list__overlay"]}>
            <div className={styles["popup-list"]}>
                <h3>{listHeading}</h3>
                <ul className={styles["popup-list__options"]}>
                    {listElements}
                </ul>
            </div>
        </div>
    )
}