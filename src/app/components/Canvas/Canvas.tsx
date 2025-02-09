"use client"

import type { MouseEvent } from "react"
import { useEffect, useRef } from "react"

import styles from "./Canvas.module.scss"


export default function Canvas() {
    const canvasRef = useRef(null)
    let canvasCtx: CanvasRenderingContext2D | null = null


    useEffect(() => {
        canvasCtx = canvasRef.current.getContext("2d")
        // requestAnimationFrame(() => Render(
        //     canvasCtx,
        //     canvasRef.current.width,
        //     canvasRef.current.height,
        // ))
    }, [])
    
    const addRectOnClick = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!canvasCtx) {
            return
        }

        console.log("clicked")

        requestAnimationFrame(() => {
            canvasCtx.fillRect(e.clientX - canvasRef.current.getBoundingRect().left, e.clientY - canvasRef.current.getBoundingRect().top, 10, 10)
        })
    }

    return (
        <canvas onClick={addRectOnClick} className={styles.canvas} ref={canvasRef}>
            Your browser doesn&#39;t seem to support HTML canvas
        </canvas>
    )
}