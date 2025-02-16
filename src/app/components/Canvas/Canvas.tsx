"use client"

import { KeyboardEvent, MouseEvent, RefObject, useEffect, useRef } from "react"

import styles from "./Canvas.module.scss"
import { BaseEntity } from "@/libs/erd/base_entity"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { PointWithRectCollides } from "@/libs/render/collisions"
import { Point, Rectangle } from "@/libs/render/shapes"
import useMousePosition from "@/app/hooks/use_mouse_position"


export default function Canvas() {
    // consts
    const doubleClickDurationMS = 400

    // refs
    const mousePositionRef = useMousePosition()
    const canvasRef: RefObject<HTMLCanvasElement> | RefObject<null> = useRef(null)
    const canvasCtxRef: RefObject<CanvasRenderingContext2D> | RefObject<null> = useRef(null)

    // state variables
    // save entities and current notation to local storage and upload from there on startup
    const entities = new Array<BaseEntity>()
    let currentNotation = CrowsFootNotation.GetNotationName()

    let inEditMode = false

    let draggedEntityOffset: Point | null = null
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
        (canvasCtxRef.current as unknown as CanvasRenderingContext2D) = getCanvas().getContext("2d") as CanvasRenderingContext2D

        resizeCanvasToScreen()
        window.addEventListener("resize", resizeCanvasToScreen)

        return () => {
            window.removeEventListener("resize", resizeCanvasToScreen)
            cancelAnimationFrame(lastFrameID)
        }
    }, [])

    const renderEntities = () => {
        const canvasCtx = getCanvasCtx()
        canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)

        for (let i = 0; i < entities.length; ++i) {
            entities[i].Render(canvasCtx)
        }
    }

    const getInteractedEntity =  (e: MouseEvent<HTMLCanvasElement>) => {
        return entities.findIndex((entity: BaseEntity) =>
            PointWithRectCollides(
                new Point(e.clientX, e.clientY),
                new Rectangle(entity.GetCenteredPosition(), entity.GetWidth(), entity.GetHeight()),
            ),
        )
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

        lastFrameID = requestAnimationFrame(updateEntityPositionOnDrag)
    }

    const updateEntityHeaderOnKeyPress = (e: KeyboardEvent<HTMLCanvasElement>) => {
        if (!inEditMode || editedEntityIndex === -1) {
            return
        }

        // TODO: separate entities parts somehow (e.g. getEditedPart method on entity)
        let newName = entities[editedEntityIndex].GetName()
        switch (e.key) {
            case "Backspace":
                newName =newName.length > 0 ?  newName.substring(0, newName.length - 1) : ""
                break
            default:
                newName += e.key
        }

        entities[editedEntityIndex].SetName(newName)
        requestAnimationFrame(() => entities[editedEntityIndex].Render(getCanvasCtx()))
    }

    const addEntityOnClick = (e: MouseEvent<HTMLCanvasElement>) => {
        entities.push(new CrowsFootNotation.Entity("random", e.clientX, e.clientY))
        lastFrameID = requestAnimationFrame(renderEntities)
    }

    const handleEditOnDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
        cancelAnimationFrame(lastFrameID)
        draggedEntityIndex = -1

        editedEntityIndex = getInteractedEntity(e)
        if (editedEntityIndex === -1) {
            addEntityOnClick(e)
            return
        }

        // support multi-notation here
        if (currentNotation !== CrowsFootNotation.GetNotationName()) {
            return
        }

        inEditMode = true

        const canvasCtx = getCanvasCtx()
        const editHeader = PointWithRectCollides(
            new Point(e.clientX, e.clientY),
            new Rectangle(entities[editedEntityIndex].GetCenteredPosition(), entities[editedEntityIndex].GetWidth(), entities[editedEntityIndex].GetHeaderHeight()),
        )

        if (editHeader) {
            lastFrameID = requestAnimationFrame(() => {
                // TODO: maybe clear canvas as well to avoid multi-highlighting
                (entities[editedEntityIndex] as CrowsFootNotation.Entity).HighlightHeader(canvasCtx)
            })
        }
    }

    const dragEntityOnMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const isDoubleClick = e.timeStamp - lastMouseDownTimestamp <= doubleClickDurationMS
        lastMouseDownTimestamp = e.timeStamp

        if (inEditMode) {
            inEditMode = false
            // remove highlight on edit mode exit
            lastFrameID = requestAnimationFrame(renderEntities)
            return
        }

        if (isDoubleClick) {
            handleEditOnDoubleClick(e)
            return
        }

        draggedEntityIndex = getInteractedEntity(e)
        if (draggedEntityIndex === -1) {
            addEntityOnClick(e)
            return
        }

        lastFrameID = requestAnimationFrame(updateEntityPositionOnDrag)
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
            onKeyDown={updateEntityHeaderOnKeyPress}
            className={styles.canvas}
            ref={canvasRef}
        >
            Your browser doesn&#39;t support HTML canvas
        </canvas>
    )
}