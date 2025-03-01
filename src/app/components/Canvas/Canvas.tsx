"use client"

import { canvasUpdateEvent } from "@/app/events"
import useMousePosition from "@/app/hooks/use_mouse_position"
import { canvasOffsetStore, editedEntityStore, notationStore } from "@/app/stores"
import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Cursor } from "@/libs/render/cursor"
import { Point } from "@/libs/render/shapes"
import { Key } from "@/libs/utils/keys_enums"
import type { Optional } from "@/libs/utils/types"
import { KeyboardEvent, MouseEvent, RefObject, useEffect, useRef, WheelEvent } from "react"

import styles from "./Canvas.module.scss"


const controlKeys = new Set([Key.Shift, Key.Control, Key.Alt, Key.Meta, Key.ArrowUp, Key.ArrowDown])

export default function Canvas() {
    // TODO: remove debug
    console.log("render canvas")

    // consts
    const doubleClickDurationMS = 400

    // refs
    const mousePositionRef = useMousePosition()
    const canvasRef: RefObject<Optional<HTMLCanvasElement>> = useRef(null)
    const canvasCtxRef: RefObject<Optional<CanvasRenderingContext2D>> = useRef(null)

    let currentNotation = CrowsFootNotation.GetNotationName()

    // state variables
    // TODO: save entities and current notation to local storage and upload from there on startup
    const entities = [] as BaseEntity[]
    const relationships = [] as BaseRelationship<any>[]
    const canvasOffset = new Point(0, 0)
    const cursor = new Cursor()

    // TODO: maybe incapsulate in a separate state-manager class
    let inEditMode = false
    let draggedEntityOffset: Optional<Point> = null
    let draggedEntity: Optional<BaseEntity> = null
    let editedEntity: Optional<BaseEntity> = null

    let lastFrameID = 0
    let lastMouseDownTimestamp = 0

    const getCanvas = () => {
        return canvasRef.current as unknown as HTMLCanvasElement
    }

    const getCanvasCtx = () => {
        return canvasCtxRef.current as unknown as CanvasRenderingContext2D
    }

    const getPixelRatio = () => {
        const canvasCtx = getCanvasCtx()
        const dpr = window.devicePixelRatio || 1
        // @ts-ignore
        const bsr = canvasCtx.webkitBackingStorePixelRatio ||
                // @ts-ignore
                canvasCtx.mozBackingStorePixelRatio ||
                // @ts-ignore
                canvasCtx.msBackingStorePixelRatio ||
                // @ts-ignore
                canvasCtx.oBackingStorePixelRatio ||
                // @ts-ignore
                canvasCtx.backingStorePixelRatio || 1


        return dpr / bsr
    }

    const resizeCanvasToScreen = () => {
        // FIXME: correctly clear the canvas while zoomed | unzoomed
        const pixelRatio = getPixelRatio()
        const canvas = getCanvas()
        const canvasCtx = getCanvasCtx()

        canvas.width = document.body.clientWidth * pixelRatio
        canvas.height = document.body.clientHeight * pixelRatio
        canvas.style.width =  document.body.clientWidth + "px"
        canvas.style.height = document.body.clientHeight + "px"
        canvasCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        animate(renderERD)
    }

    const animate = (animationCallback: () => void) => {
        lastFrameID = requestAnimationFrame(animationCallback)
    }

    const renderERD = () => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.clearRect(canvasOffset.x, canvasOffset.y, canvasCtx.canvas.width, canvasCtx.canvas.height)

        for (const entity of entities) {
            entity.Render(canvasCtx)
        }

        for (const relationship of relationships) {
            relationship.Render(canvasCtx)
        }
    }

    useEffect(() => {
        canvasCtxRef.current = getCanvas().getContext("2d") as CanvasRenderingContext2D
        resizeCanvasToScreen()

        const animateEntities = () => {
            animate(renderERD)
        }

        window.addEventListener("resize", resizeCanvasToScreen)
        notationStore.Set({notation: currentNotation})
        canvasUpdateEvent.AddListener(animateEntities)

        return () => {
            window.removeEventListener("resize", resizeCanvasToScreen)
            canvasUpdateEvent.RemoveListener(animateEntities)
            cancelAnimationFrame(lastFrameID)
        }
    }, [])

    const enterEditMode = (mouseX: number, mouseY: number) => {
        if (!editedEntity) {
            return
        }

        inEditMode = true

        const canvasCtx = getCanvasCtx()
        const interactedPart = editedEntity?.GetInteractedPart(canvasOffset.Translate(mouseX, mouseY))

        if (interactedPart) {
            animate(() => {
                editedEntity?.SelectPart(interactedPart.name, canvasCtx)
            })
        }

        editedEntityStore.Set({entity: editedEntity})
    }

    const exitEditMode = () => {
        inEditMode = false

        // remove highlight on edit mode exit
        editedEntity?.Unselect()
        animate(renderERD)
        editedEntityStore.Set({entity: null})
    }

    const getEntityBeingEdited =  (e: MouseEvent<HTMLCanvasElement>) => {
        return entities.find((entity: BaseEntity) =>
            entity.GetInteractedPart(canvasOffset.Translate(e.clientX, e.clientY))
        ) || null
    }

    const renderCursor = () => {
        if (!editedEntity) {
            return
        }

        // re-rendering whole entity with cursor for now
        const canvasCtx = getCanvasCtx()

        editedEntity.Clear(canvasCtx)
        editedEntity.Render(canvasCtx)
        cursor.Render(canvasCtx)
    }

    const animateCursor = () => {
        // erase leftover cursor
        if (!inEditMode) {
            cursor.Reset()
            animate(renderCursor)

            return
        }

        if (cursor.IsUpdateNeeded()) {
            renderCursor()
        }

        animate(animateCursor)
    }

    const updateEntityPositionOnDrag = () => {
        if (!draggedEntity) {
            return
        }

        const mouseX = mousePositionRef.current.x
        const mouseY = mousePositionRef.current.y

        if (!draggedEntityOffset) {
            const entityPos = draggedEntity.GetPosition()
            draggedEntityOffset = new Point(mouseX - entityPos.x, mouseY - entityPos.y)
        }

        draggedEntity.SetPosition(mouseX - draggedEntityOffset.x, mouseY - draggedEntityOffset.y)
        renderERD()

        animate(updateEntityPositionOnDrag)
    }

    const updateEntityPartOnKeyPress = (e: KeyboardEvent<HTMLCanvasElement>) => {
        if (!inEditMode || !editedEntity) {
            return
        }

        // @ts-ignore
        if (controlKeys.has(e.key)) {
            return
        }

        const selectedPart = editedEntity.GetSelectedPart()
        if (!selectedPart) {
            return
        }

        if (cursor.IsUnset()) {
            cursor.SetEditedString(selectedPart.GetText())
            animateCursor()
        }

        let metaAPressed = false

        switch (e.key) {
            case Key.Escape:
            case Key.Enter:
                exitEditMode()
                return
            default:
                metaAPressed = cursor.HandleKeyInput(e)
        }

        const canvasCtx = getCanvasCtx()
        const [selectedPartTextPosition, isCentered] = selectedPart.GetTextPosition()

        if (selectedPartTextPosition) {
            cursor.UpdatePosition(selectedPartTextPosition, canvasCtx, isCentered)
        }

        selectedPart.SetText(cursor.GetEditedString())

        animate(() => {
            editedEntity?.Clear(canvasCtx)
            editedEntity?.Render(canvasCtx)

            if (metaAPressed) {
                editedEntity?.SelectPart(selectedPart.name, canvasCtx)
            }

            cursor.Render(canvasCtx, !metaAPressed)
        })
    }

    const addEntityOnClick = (e: MouseEvent<HTMLCanvasElement>) => {
        const newEntity = new CrowsFootNotation.Entity("random", 0, 0)
        newEntity.SetPosition(canvasOffset.x + e.clientX - newEntity.GetWidth() / 2, canvasOffset.y + e.clientY - newEntity.GetHeight() / 2)
        entities.push(newEntity)

        animate(renderERD)
    }

    const handleEditOnDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
        cancelAnimationFrame(lastFrameID)
        draggedEntity = null

        editedEntity = getEntityBeingEdited(e)
        if (!editedEntity) {
            addEntityOnClick(e)
            return
        }

        // support multi-notation here
        if (currentNotation !== CrowsFootNotation.GetNotationName()) {
            return
        }

        enterEditMode(e.clientX, e.clientY)
    }

    const dragEntityOnMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const isDoubleClick = e.timeStamp - lastMouseDownTimestamp <= doubleClickDurationMS
        lastMouseDownTimestamp = e.timeStamp

        editedEntity = getEntityBeingEdited(e)
        if (inEditMode && !editedEntity) {
            exitEditMode()
            return
        }

        if (isDoubleClick) {
            handleEditOnDoubleClick(e)
            return
        }

        // TODO: detect single click to enter edit mode

        draggedEntity = editedEntity
        if (!draggedEntity) {
            addEntityOnClick(e)
            return
        }

        animate(updateEntityPositionOnDrag)
    }

    const dropEntityOnMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!draggedEntity) {
            return
        }

        draggedEntity = null
        draggedEntityOffset = null
        cancelAnimationFrame(lastFrameID)
    }

    const moveCanvasOnWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.translate(-e.deltaX, -e.deltaY)
        canvasOffset.x += e.deltaX
        canvasOffset.y += e.deltaY

        canvasOffsetStore.Set(canvasOffset.Translate(0, 0))
        animate(renderERD)
    }

    return (
        <canvas
            // tabIndex enables keys events
            tabIndex={1}
            onMouseDown={dragEntityOnMouseDown}
            onMouseUp={dropEntityOnMouseUp}
            onKeyDown={updateEntityPartOnKeyPress}
            onWheel={moveCanvasOnWheel}
            className={styles.canvas}
            ref={canvasRef}
        >
            Your browser doesn&#39;t support HTML canvas
        </canvas>
    )
}