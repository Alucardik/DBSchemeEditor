"use client"

import DependencyRow from "@/app/components/DependencyRow/DependencyRow"
import useStore from "@/app/hooks/use_store"
import { editedEntityStore, inDependencyEditorStore } from "@/app/stores"
import { Key } from "@/libs/utils/keys_enums"
import { KeyboardEvent, MouseEvent, useEffect, useState } from "react"
import styles from "./DependenciesEditor.module.scss"

type dependency = {
    lhs: string[],
    rhs: string[],
    nonEditable: boolean,
}

export default function DependenciesEditor() {
    const { entity } = useStore(editedEntityStore)
    const isEditorOpen = useStore(inDependencyEditorStore)
    // a trick to disable ssr completely
    const [isServer, setIsServer] = useState(true)
    const [dependencyList, setDependencyList] = useState<dependency[]>([])

    useEffect(() => { setIsServer(false) }, [])
    useEffect(() => {
        if (entity) {
            setDependencyList(entity.GetDependencies().map(((dependency, index) => ({
                lhs: dependency.lhs,
                rhs: dependency.rhs,
                nonEditable: index === 0,
            }))))
        }
    }, [entity])

    if (!isEditorOpen || !entity || isServer) {
        return <></>
    }

    const onKeyDownHandler = (e: KeyboardEvent) => {
        if (e.key === Key.Escape) {
            inDependencyEditorStore.Set(false)
        }
    }

    const addDependencyOnClick = (e: MouseEvent) => {
        setDependencyList([...dependencyList, {
            lhs: [],
            rhs: [],
            nonEditable: false,
        }])
    }

    const saveDependenciesOnClick = (e: MouseEvent) => {
        const preFilteredDeps = dependencyList.filter(dep => dep.lhs.length > 0 && dep.rhs.length > 0)

        entity.SetDependencies(preFilteredDeps.filter(dep => !dep.nonEditable).map(dep => ({
            lhs: dep.lhs,
            rhs: dep.rhs,
        })))

        setDependencyList(preFilteredDeps)
        inDependencyEditorStore.Set(false)
    }

    return (
        <div tabIndex={1} onKeyDown={onKeyDownHandler} className={styles["dependencies-editor__overlay"]}>
            <div className={styles["dependencies-editor"]}>
                <h3>Dependency Editing</h3>
                <ul className={styles["dependencies-editor__options"]}>
                    {dependencyList.map((dependency, i) => {
                        return (
                            <li className={styles["dependencies-editor__option"]} key={i}>
                                <DependencyRow
                                    options={entity.GetAttributes().map(attr => attr.GetText().split(":")[0].trim())}
                                    lhs={dependency.lhs}
                                    rhs={dependency.rhs}
                                    nonEditable={dependency.nonEditable}
                                    onLhsChange={lhs => {
                                        dependencyList[i].lhs = lhs.map(attr => attr.value)
                                    }}
                                    onRhsChange={rhs => {
                                        dependencyList[i].rhs = rhs.map(attr => attr.value)
                                    }}
                                    onRemoveButtonHandler={() => {
                                        setDependencyList(dependencyList.toSpliced(i, 1))
                                    }}
                                />
                            </li>
                        )
                    })}
                    <button onClick={addDependencyOnClick}>Add dependency</button>
                </ul>
                <button onClick={saveDependenciesOnClick}>Save Dependencies</button>
            </div>
        </div>
    )
}