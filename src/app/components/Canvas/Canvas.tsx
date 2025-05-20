"use client"

import EditModeManager from "@/app/components/Canvas/edit_mode_manager"
import {
    editedEntityChanged,
    editedRelationshipChanged,
    enteredEditMode,
    EntityOpType,
    exitedEditMode,
    relationEditingFinished,
    relationEditingStarted,
    RelationshipOpType
} from "@/app/events"
import useMousePosition from "@/app/hooks/use_mouse_position"
import { canvasOffsetStore, notationStore } from "@/app/stores"
import { BaseEntityAttribute } from "@/libs/erd/base_entity"
import { BaseRelationship, ParticipantType } from "@/libs/erd/base_relationship"
import ERDManager from "@/libs/erd/erd_manager"
import CanvasRenderingContext2DStub from "@/libs/html_stubs/canvas_rendering_context_2d"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"
import { Cursor } from "@/libs/render/cursor"
import { Point } from "@/libs/render/shapes"
import { Key } from "@/libs/utils/keys_enums"
import type { Optional } from "@/libs/utils/types"
import { KeyboardEvent, MouseEvent as ReactMouseEvent, RefObject, useEffect, useRef, WheelEvent } from "react"

import styles from "./Canvas.module.scss"


const controlKeys = new Set([Key.Shift, Key.Control, Key.Alt, Key.Meta, Key.ArrowUp, Key.ArrowDown])

export default function Canvas() {
    const clickDurationMS = 150
    const doubleClickDurationMS = 400
    const mousePositionRef = useMousePosition()
    const canvasOffset = new Point(0, 0)
    const canvasRef = useRef(null) as unknown as RefObject<HTMLCanvasElement>
    const cursor = new Cursor()
    const editModeManager = new EditModeManager()
    const erdManager = ERDManager.GetInstance()

    let ctx: CanvasRenderingContext2D = new CanvasRenderingContext2DStub()
    let lastMouseDownTimestamp = 0
    let lastFrameID = 0

    const animate = (animationCallback: () => void)=> {
        lastFrameID = requestAnimationFrame(animationCallback)
    }

    const renderERD = () => {
        const entities = erdManager.GetEntities()
        const relationships = erdManager.GetRelationships()

        ctx.clearRect(canvasOffset.x, canvasOffset.y, ctx.canvas.width, ctx.canvas.height)

        for (const entity of entities) {
            entity.Render(ctx)
        }

        editModeManager.GetEditedEntity()?.Highlight(ctx)

        for (const relationship of relationships) {
            relationship.Render(ctx)
        }
    }

    const animateERD = ()=> {
        animate(renderERD)
    }

    const getPixelRatio = () => {
        const dpr = window.devicePixelRatio || 1
        // @ts-ignore
        const bsr = ctx.webkitBackingStorePixelRatio ||
            // @ts-ignore
            ctx?.mozBackingStorePixelRatio ||
            // @ts-ignore
            ctx?.msBackingStorePixelRatio ||
            // @ts-ignore
            ctx?.oBackingStorePixelRatio ||
            // @ts-ignore
            ctx?.backingStorePixelRatio || 1

        return dpr / bsr
    }

    const resizeCanvasToScreen = ()=> {
        // FIXME: correctly clear the canvas while zoomed | unzoomed
        const pixelRatio = getPixelRatio()
        const canvas = canvasRef.current

        canvas.width = document.body.clientWidth * pixelRatio
        canvas.height = document.body.clientHeight * pixelRatio
        canvas.style.width =  document.body.clientWidth + "px"
        canvas.style.height = document.body.clientHeight + "px"

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        animateERD()
    }

    const renderCursor = ()=> {
        const editedEntity = editModeManager.GetEditedEntity()
        if (!editedEntity) {
            return
        }

        // re-rendering whole entity with cursor for now
        editedEntity.Clear(ctx)
        editedEntity.Render(ctx)
        cursor.Render(ctx)
    }

    const animateCursor = ()=> {
        // erase leftover cursor
        if (!editModeManager.IsInEditMode()) {
            cursor.Reset()
            animate(renderCursor)

            return
        }

        if (cursor.IsUpdateNeeded()) {
            renderCursor()
        }

        animate(animateCursor)
    }

    const updateEntityPositionOnDrag = ()=> {
        const draggedEntity = editModeManager.GetDraggedEntity()
        if (!draggedEntity) {
            return
        }

        editModeManager.UpdateDraggedEntityPosition(mousePositionRef.current.x, mousePositionRef.current.y)
        renderERD()
        draggedEntity.Highlight(ctx)
        animate(updateEntityPositionOnDrag)
    }

    const updateRelationshipParticipantPositionOnDrag = (participantType: ParticipantType)=> {
        if (!editModeManager.GetEditedRelationship()) {
            return
        }

        editModeManager.UpdateEditedRelationshipPosition(
            participantType,
            canvasOffset.x + mousePositionRef.current.x,
            canvasOffset.y + mousePositionRef.current.y,
        )
        renderERD()
        animate(() => updateRelationshipParticipantPositionOnDrag(participantType))
    }

    const addEntityOnClick = (e: ReactMouseEvent<HTMLCanvasElement>)=> {
        const newEntity = new CrowsFootNotation.Entity("random", 0, 0)
        newEntity.SetPosition(canvasOffset.x + e.clientX - newEntity.GetWidth() / 2, canvasOffset.y + e.clientY - newEntity.GetHeight() / 2)

        erdManager.AddEntity(newEntity)
        animateERD()
    }

    const handleOnEnterEditMode = ({ detail: { selectPart } }: CustomEvent<{ selectPart: boolean }>)=> {
        const editedRelationship = editModeManager.GetEditedRelationship()
        if (editedRelationship) {
            editedRelationship.Highlight(ctx)
            return
        }

        const editedEntity = editModeManager.GetEditedEntity()
        if (!editedEntity) {
            return
        }

        let interactedPartName: Optional<string> = null
        if (selectPart) {
            interactedPartName = editedEntity.GetInteractedPart(canvasOffset.Translate(mousePositionRef.current.x, mousePositionRef.current.y))?.name || null
        }

        animate(() => {
            if (interactedPartName) {
                editedEntity?.SelectPart(interactedPartName, ctx)
            }

            editedEntity?.Highlight(ctx)
        })
    }

    const handleOnRelationEditingStarted = ({ detail: { relationship, participantType }}: CustomEvent<{
        relationship: BaseRelationship<any>,
        participantType: ParticipantType,
    }>) => {
        // allow one relationship editing at a time
        if (editModeManager.GetEditedRelationship()) {
            return
        }

        const editedParticipant = participantType === ParticipantType.First ? ParticipantType.Second : ParticipantType.First

        erdManager.AddRelationship(relationship)
        editModeManager.SetEditedRelationship(relationship)
        animate(() => updateRelationshipParticipantPositionOnDrag(editedParticipant))
    }

    const handleOnRelationEditingFinished = ({ detail: { relationship }}: CustomEvent<{
        relationship: BaseRelationship<any>,
    }>) => {
        // remove dangling relationship
        if (!relationship.IsComplete()) {
            erdManager.RemoveRelationshipByID(relationship.GetID())
        }
    }

    const handleOnEditedEntityChanged = ({ detail: { opType, entityID } }: CustomEvent<{ opType: EntityOpType, entityID: number }>)=>  {
        switch (opType) {
            case EntityOpType.CHANGED:
                animateERD()
                break
            case EntityOpType.DELETED:
                // FIXME: remove highlight on deletion
                erdManager.RemoveEntityByID(entityID)
                animateERD()
        }
    }

    const handleOnEditedRelationshipChanged = ({ detail: { opType, relationshipID } }: CustomEvent<{ opType: RelationshipOpType, relationshipID: number }>)=>  {
        switch (opType) {
            case RelationshipOpType.CHANGED:
                animateERD()
                break
            case RelationshipOpType.DELETED:
                erdManager.RemoveRelationshipByID(relationshipID)
                animateERD()
        }
    }

    const handleOnKeyPress = (e: KeyboardEvent<HTMLCanvasElement>)=> {
        const editedEntity = editModeManager.GetEditedEntity()
        if (!editModeManager.IsInEditMode() || !editedEntity) {
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
                editModeManager.ExitEditMode()
                return
            default:
                metaAPressed = cursor.HandleKeyInput(e)
        }

        const [selectedPartTextPosition, isCentered] = selectedPart.GetTextPosition()

        if (selectedPartTextPosition) {
            cursor.UpdatePosition(selectedPartTextPosition, ctx, isCentered)
        }

        selectedPart.SetText(cursor.GetEditedString())

        animate(() => {
            editedEntity?.Clear(ctx)
            editedEntity?.Render(ctx)

            if (metaAPressed) {
                editedEntity?.SelectPart(selectedPart.name, ctx)
            }

            cursor.Render(ctx, !metaAPressed)
        })
    }

    const handleOnDoubleClick = (e: ReactMouseEvent<HTMLCanvasElement>)=> {
        cancelAnimationFrame(lastFrameID)

        const editedEntity = erdManager.CheckInteractedEntityByPosition(canvasOffset.Translate(e.clientX, e.clientY))

        editModeManager.UnsetDraggedEntity()

        if (!editedEntity) {
            editModeManager.UnsetEditedEntity()
            addEntityOnClick(e)
            return
        }

        editModeManager.SetEditedEntity(editedEntity)

        // TODO: support multi-notation here
        if (erdManager.GetNotationName() !== CrowsFootNotation.GetNotationName()) {
            return
        }

        editModeManager.EnterEditMode(true)
    }

    const handleOnMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        const currentMousePos = canvasOffset.Translate(e.clientX, e.clientY)
        const isDoubleClick = e.timeStamp - lastMouseDownTimestamp <= doubleClickDurationMS
        const editedEntity = erdManager.CheckInteractedEntityByPosition(currentMousePos)
        const editedRelationship = erdManager.CheckInteractedRelationshipByPosition(currentMousePos)

        lastMouseDownTimestamp = e.timeStamp

        if (editModeManager.IsInEditMode() && !editedEntity && !editedRelationship) {
            editModeManager.ExitEditMode()
            return
        }

        if (isDoubleClick) {
            handleOnDoubleClick(e)
            return
        }

        if (editedRelationship) {
            editModeManager.SetEditedRelationship(editedRelationship)
            return
        }

        if (!editedEntity) {
            addEntityOnClick(e)
            return
        }

        const currentlyEditedEntity = editModeManager.GetEditedEntity()
        const currentlyEditedRelationship = editModeManager.GetEditedRelationship()

        // if there is click on another entity and there is a relationship being edited -
        //  try to make a connection or drop currently edited relationship
        if (currentlyEditedRelationship && currentlyEditedEntity && currentlyEditedEntity !== editedEntity) {
            const attribute = editedEntity.GetInteractedPart(currentMousePos)
            if (attribute instanceof BaseEntityAttribute) {
                attribute.AttachToRelationship(currentlyEditedRelationship, currentMousePos)
            } else {
                // TODO: check if this is correct
                erdManager.RemoveRelationshipByID(currentlyEditedRelationship.GetID())
            }

            // exit edit mode when both the relationship is removed or preserved
            editModeManager.ExitEditMode()
            return
        }

        editModeManager.SetDraggedEntity(editedEntity)
        editModeManager.UnsetEditedEntity()
        editModeManager.EnterEditMode(false)

        animate(updateEntityPositionOnDrag)
    }

    const handleOnMouseUp = (e: ReactMouseEvent<HTMLCanvasElement>)=> {
        const draggedEntity = editModeManager.GetDraggedEntity()
        if (draggedEntity) {
            editModeManager.SetEditedEntity(draggedEntity)
        }

        editModeManager.UnsetDraggedEntity()

        cancelAnimationFrame(lastFrameID)

        // enter edit mode on entity click
        if (e.timeStamp - lastMouseDownTimestamp <= clickDurationMS) {
            editModeManager.EnterEditMode(false)
        }
    }

    const handleOnWheel = (e: WheelEvent<HTMLCanvasElement>)=> {
        ctx.translate(-e.deltaX, -e.deltaY)
        canvasOffset.x += e.deltaX
        canvasOffset.y += e.deltaY

        canvasOffsetStore.Set(canvasOffset.Translate(0, 0))
        animateERD()
    }

    useEffect(() => {
        ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D

        // setting default font for the rest of the renders once the fonts are loaded
        document.fonts.ready.then(() => {
            ctx.font = '12px "OpenSans", "Arial", sans-serif'
        })

        resizeCanvasToScreen()

        window.addEventListener("resize", resizeCanvasToScreen)
        editedEntityChanged.AddListener(handleOnEditedEntityChanged)
        editedRelationshipChanged.AddListener(handleOnEditedRelationshipChanged)
        enteredEditMode.AddListener(handleOnEnterEditMode)
        exitedEditMode.AddListener(animateERD)
        relationEditingStarted.AddListener(handleOnRelationEditingStarted)
        relationEditingFinished.AddListener(handleOnRelationEditingFinished)
        notationStore.Set({notation: erdManager.GetNotationName()})

        return () => {
            window.removeEventListener("resize", resizeCanvasToScreen)
            editedEntityChanged.RemoveListener(handleOnEditedEntityChanged)
            editedRelationshipChanged.RemoveListener(handleOnEditedRelationshipChanged)
            enteredEditMode.RemoveListener(handleOnEnterEditMode)
            exitedEditMode.RemoveListener(animateERD)
            relationEditingStarted.RemoveListener(handleOnRelationEditingStarted)
            relationEditingFinished.RemoveListener(handleOnRelationEditingFinished)
            cancelAnimationFrame(lastFrameID)
        }
    }, [])

    return (
        <canvas
            // tabIndex enables keys events
            tabIndex={1}
            onMouseDown={handleOnMouseDown}
            onMouseUp={handleOnMouseUp}
            onKeyDown={handleOnKeyPress}
            onWheel={handleOnWheel}
            className={styles.canvas}
            ref={canvasRef}
        >
            Your browser doesn&#39;t support HTML canvas
        </canvas>
    )
}