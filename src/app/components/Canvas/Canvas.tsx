"use client"

import { MouseEvent, RefObject, useEffect, useRef } from "react"

import styles from "./Canvas.module.scss"
import { Entity } from "@/libs/erd/entity"
import { CrowsFootNotation } from "@/libs/notations/crows_foot"


export default function Canvas() {
    const canvasRef: RefObject<HTMLCanvasElement> | RefObject<null> = useRef(null)
    const canvasCtxRef: RefObject<CanvasRenderingContext2D> | RefObject<null> = useRef(null)
    const entities = new Array<Entity>()

    let lastFrameID = 0

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
    
    const addRectOnClick = (e: MouseEvent<HTMLCanvasElement>) => {
        entities.push(new CrowsFootNotation.Entity("random", e.clientX, e.clientY))

        lastFrameID = requestAnimationFrame(() => {
            const canvasCtx = getCanvasCtx()

            canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)

            for (let i = 0; i < entities.length; ++i) {
                entities[i].Render(canvasCtx)
            }
        })
    }

    return (
        <canvas
            onClick={addRectOnClick}
            onMouseDown={() => console.log("drag n...")}
            onMouseUp={() => console.log("drop.")}
            className={styles.canvas}
            ref={canvasRef}
        >
            Your browser doesn&#39;t support HTML canvas
        </canvas>
    )
}