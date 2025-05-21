"use client"

import Canvas from "@/app/components/Canvas/Canvas"
import DependenciesEditor from "@/app/components/DependenciesEditor/DependenciesEditor"
import ToolsMenu from "@/app/components/ToolsMenu/ToolsMenu"
import WidgetsMenu from "@/app/components/WidgetsMenu/WidgetsMenu"

export default function EditorRoute() {
    return (
        <>
            <ToolsMenu />
            <WidgetsMenu />
            <DependenciesEditor />
            <Canvas />
        </>
    )
}