import React from "react"

export default function useMousePosition() {
    const mousePosition = React.useRef({ x: -1, y: -1 })

    React.useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            mousePosition.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener("mousemove", updateMousePosition)

        return () => {
            window.removeEventListener("mousemove", updateMousePosition)
        }
    }, [])

    return mousePosition
}