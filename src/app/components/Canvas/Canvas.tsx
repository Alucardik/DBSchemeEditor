"use client"

import { canvasUpdateEvent } from "@/app/events"
import useMousePosition from "@/app/hooks/use_mouse_position"
import { canvasOffsetStore, editedEntityStore, notationStore } from "@/app/stores"
import { BaseEntity } from "@/libs/erd/base_entity"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Cursor } from "@/libs/render/cursor"
import { Point } from "@/libs/render/shapes"
import { Key } from "@/libs/utils/keys_enums"
import type { Optional } from "@/libs/utils/types"
import { KeyboardEvent, MouseEvent, RefObject, useEffect, useRef, WheelEvent } from "react"

import styles from "./Canvas.module.scss"


const controlKeys = new Set([Key.Shift, Key.Control, Key.Alt, Key.Meta, Key.ArrowUp, Key.ArrowDown])

export default function Canvas() {
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
    const entities = new Array<BaseEntity>()
    const canvasOffset = new Point(0, 0)
    const cursor = new Cursor()

    let inEditMode = false

    let draggedEntityOffset: Optional<Point> = null
    let draggedEntityIndex = -1
    // TODO: maybe replace with optional entity
    let editedEntityIndex = -1

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
        animate(renderEntities)
    }

    const animate = (animationCallback: () => void) => {
        lastFrameID = requestAnimationFrame(animationCallback)
    }

    const renderEntities = () => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.clearRect(canvasOffset.x, canvasOffset.y, canvasCtx.canvas.width, canvasCtx.canvas.height)

        for (let i = 0; i < entities.length; ++i) {
            entities[i].Render(canvasCtx)
        }
    }

    useEffect(() => {
        canvasCtxRef.current = getCanvas().getContext("2d") as CanvasRenderingContext2D
        resizeCanvasToScreen()

        const animateEntities = () => {
            animate(renderEntities)
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



    const getEntityBeingEdited =  (e: MouseEvent<HTMLCanvasElement>) => {
        return entities.findIndex((entity: BaseEntity) =>
            entity.GetInteractedPart(canvasOffset.Translate(e.clientX, e.clientY))
        )
    }

    const renderCursor = () => {
        if (editedEntityIndex === -1) {
            return
        }

        // re-rendering whole entity with cursor for now
        const canvasCtx = getCanvasCtx()

        entities[editedEntityIndex].Clear(canvasCtx)
        entities[editedEntityIndex].Render(canvasCtx)
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
        if (draggedEntityIndex === -1) {
            return
        }

        const mouseX = mousePositionRef.current.x
        const mouseY = mousePositionRef.current.y

        if (!draggedEntityOffset) {
            const entityPos = entities[draggedEntityIndex].GetPosition()
            draggedEntityOffset = new Point(mouseX - entityPos.x, mouseY - entityPos.y)
        }

        entities[draggedEntityIndex].SetPosition(mouseX - draggedEntityOffset.x, mouseY - draggedEntityOffset.y)
        renderEntities()

        animate(updateEntityPositionOnDrag)
    }

    const updateEntityPartOnKeyPress = (e: KeyboardEvent<HTMLCanvasElement>) => {
        if (!inEditMode || editedEntityIndex === -1) {
            return
        }

        // @ts-ignore
        if (controlKeys.has(e.key)) {
            return
        }

        const editedEntity = entities[editedEntityIndex]
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
                inEditMode = false
                editedEntityStore.Set({entity: null})
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
            editedEntity.Clear(canvasCtx)
            editedEntity.Render(canvasCtx)

            if (metaAPressed) {
                editedEntity.SelectPart(selectedPart.name, canvasCtx)
            }

            cursor.Render(canvasCtx, !metaAPressed)
        })
    }

    const addEntityOnClick = (e: MouseEvent<HTMLCanvasElement>) => {
        const newEntity = new CrowsFootNotation.Entity("random", 0, 0)
        newEntity.SetPosition(canvasOffset.x + e.clientX - newEntity.GetWidth() / 2, canvasOffset.y + e.clientY - newEntity.GetHeight() / 2)
        entities.push(newEntity)
        animate(renderEntities)
    }

    const handleEditOnDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
        cancelAnimationFrame(lastFrameID)
        draggedEntityIndex = -1

        editedEntityIndex = getEntityBeingEdited(e)
        if (editedEntityIndex === -1) {
            addEntityOnClick(e)
            return
        }

        // support multi-notation here
        if (currentNotation !== CrowsFootNotation.GetNotationName()) {
            return
        }

        inEditMode = true
        editedEntityStore.Set({ entity: entities[editedEntityIndex] })

        const canvasCtx = getCanvasCtx()

        const interactedPart = entities[editedEntityIndex].GetInteractedPart(canvasOffset.Translate(e.clientX, e.clientY))
        if (interactedPart) {
            animate(() => {
                entities[editedEntityIndex].SelectPart(interactedPart.name, canvasCtx)
            })
        }
    }

    const dragEntityOnMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const isDoubleClick = e.timeStamp - lastMouseDownTimestamp <= doubleClickDurationMS
        lastMouseDownTimestamp = e.timeStamp

        // TODO: check for collision with entity before exiting edit mode
        if (inEditMode) {
            inEditMode = false
            editedEntityStore.Set({ entity: null })
            // remove highlight on edit mode exit
            animate(renderEntities)

            return
        }

        if (isDoubleClick) {
            handleEditOnDoubleClick(e)
            return
        }

        // TODO: detect single click to enter edit mode

        draggedEntityIndex = getEntityBeingEdited(e)
        if (draggedEntityIndex === -1) {
            addEntityOnClick(e)
            return
        }

        animate(updateEntityPositionOnDrag)
    }

    const dropEntityOnMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (draggedEntityIndex === -1) {
            return
        }

        draggedEntityIndex = -1
        draggedEntityOffset = null
        cancelAnimationFrame(lastFrameID)
    }

    const moveCanvasOnWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.translate(-e.deltaX, -e.deltaY)
        canvasOffset.x += e.deltaX
        canvasOffset.y += e.deltaY

        canvasOffsetStore.Set(canvasOffset.Translate(0, 0))
        animate(renderEntities)
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