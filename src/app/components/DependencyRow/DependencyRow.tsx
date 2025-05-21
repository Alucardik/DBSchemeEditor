"use client"

import { MouseEvent, useState } from "react"
import Select from "react-select"

type selectOption = {
    value: string,
    label: string,
}

export default function DependencyRow({ options, lhs: initLhs, rhs: initRhs, nonEditable, onLhsChange, onRhsChange, onRemoveButtonHandler }: {
    options: string[],
    lhs: string[],
    rhs: string[],
    nonEditable: boolean,
    onLhsChange: (options: selectOption[]) => void,
    onRhsChange: (options: selectOption[]) => void,
    onRemoveButtonHandler: (e: MouseEvent) => void,
}) {
    const [lhs, setLhs] = useState<selectOption[]>(initLhs.map(attr => ({value: attr, label: attr})))
    const [rhs, setRhs] = useState<selectOption[]>(initRhs.map(attr => ({value: attr, label: attr})))

    const optionsList = options.map(option => ({value: option, label: option})) as selectOption[]

    return (
        <>
            <Select
                options={optionsList}
                value={lhs}
                onChange={(e) => {
                    const values = Array.from(e.values())
                    setLhs(values)
                    onLhsChange(values)
                }}
                isMulti
                isClearable
                placeholder={"Add attributes"}
                isDisabled={nonEditable}
            />
            <Select
                options={optionsList}
                value={rhs}
                onChange={(e) => {
                    const values = Array.from(e.values())
                    setRhs(values)
                    onRhsChange(values)
                }}
                isMulti
                isClearable
                placeholder={"Add attributes"}
                isDisabled={nonEditable}
            />
            <button hidden={nonEditable} type="button" onClick={onRemoveButtonHandler}>
                Remove
            </button>
        </>
    )
}