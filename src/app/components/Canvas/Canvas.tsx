"use client"

import useMousePosition from "@/app/hooks/use_mouse_position"
import { editedEntityStore, notationStore } from "@/app/stores"
import { BaseEntity } from "@/libs/erd/base_entity"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Cursor } from "@/libs/render/cursor"
import { Point } from "@/libs/render/shapes"
import { Key } from "@/libs/utils/keys_enums"
import type { Optional } from "@/libs/utils/types"
import { KeyboardEvent, MouseEvent, RefObject, useEffect, useRef } from "react"

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
    const cursor = new Cursor()

    let inEditMode = false

    let draggedEntityOffset: Optional<Point> = null
    let draggedEntityIndex = -1
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
        const dpr = window.devicePixelRatio || 1,
            bsr = canvasCtx.webkitBackingStorePixelRatio ||
                canvasCtx.mozBackingStorePixelRatio ||
                canvasCtx.msBackingStorePixelRatio ||
                canvasCtx.oBackingStorePixelRatio ||
                canvasCtx.backingStorePixelRatio || 1


        return dpr / bsr
    }

    const resizeCanvasToScreen = () => {
        // FIXME: do not break on zoom
        const pixelRatio = getPixelRatio()
        const canvas = getCanvas()
        const canvasCtx = getCanvasCtx()

        canvas.width = document.body.clientWidth * pixelRatio
        canvas.height = document.body.clientHeight * pixelRatio
        canvas.style.width =  document.body.clientWidth + "px"
        canvas.style.height = document.body.clientHeight + "px"
        canvasCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

        // if (canvasCtx && (canvasRef.height > CANVAS_SZ_LIMS.y || canvasRef.width > CANVAS_SZ_LIMS.x)) {
        //   canvasCtx.scale(canvasRef.width / CANVAS_SZ_LIMS.x, canvasRef.height / CANVAS_SZ_LIMS.y);
        // }
    }

    useEffect(() => {
        canvasCtxRef.current = getCanvas().getContext("2d") as CanvasRenderingContext2D
        resizeCanvasToScreen()

        window.addEventListener("resize", resizeCanvasToScreen)
        notationStore.Set({notation: currentNotation})

        return () => {
            window.removeEventListener("resize", resizeCanvasToScreen)
            cancelAnimationFrame(lastFrameID)
        }
    }, [])

    const animate = (animationCallback: () => void) => {
        lastFrameID = requestAnimationFrame(animationCallback)
    }

    const renderEntities = () => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)

        for (let i = 0; i < entities.length; ++i) {
            entities[i].Render(canvasCtx)
        }
    }

    const getEntityBeingEdited =  (e: MouseEvent<HTMLCanvasElement>) => {
        return entities.findIndex((entity: BaseEntity) =>
            entity.GetInteractedPart(new Point(e.clientX, e.clientY))
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
        const selectedPartTextPosition = editedEntity.GetSelectedPartTextPosition()

        if (selectedPartTextPosition) {
            cursor.UpdatePosition(selectedPartTextPosition, canvasCtx)
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
        newEntity.SetPosition(e.clientX - newEntity.GetWidth() / 2, e.clientY - newEntity.GetHeight() / 2)
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

        const interactedPart = entities[editedEntityIndex].GetInteractedPart(new Point(e.clientX, e.clientY))
        if (interactedPart) {
            animate(() => {
                entities[editedEntityIndex].SelectPart(interactedPart.name, canvasCtx)
            })
        }
    }

    const dragEntityOnMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const isDoubleClick = e.timeStamp - lastMouseDownTimestamp <= doubleClickDurationMS
        lastMouseDownTimestamp = e.timeStamp

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

    return (
        <canvas
            // tabIndex enables keys events
            tabIndex={1}
            onMouseDown={dragEntityOnMouseDown}
            onMouseUp={dropEntityOnMouseUp}
            onKeyDown={updateEntityPartOnKeyPress}
            className={styles.canvas}
            ref={canvasRef}
        >
            Your browser doesn&#39;t support HTML canvas
        </canvas>
    )
}