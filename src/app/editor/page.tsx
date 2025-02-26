"use client"

import Canvas from "@/app/components/Canvas/Canvas"
import WidgetsMenu from "@/app/components/WidgetsMenu/WidgetsMenu"

export default function EditorRoute() {
    return (
        <>
            <WidgetsMenu />
            <Canvas />
        </>
    )
}