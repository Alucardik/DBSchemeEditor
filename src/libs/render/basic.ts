export function Render(
    canvasCtx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
) {
    // canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    requestAnimationFrame(() => Render(canvasCtx, canvasWidth, canvasHeight))
}