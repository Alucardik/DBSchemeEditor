export default class CanvasRenderingContext2DStub implements CanvasRenderingContext2D {
    readonly canvas: HTMLCanvasElement = null as unknown as HTMLCanvasElement
    direction: CanvasDirection = "inherit"
    fillStyle: string | CanvasGradient | CanvasPattern = ""
    filter: string = ""
    font: string = ""
    fontKerning: CanvasFontKerning = null as unknown as CanvasFontKerning
    fontStretch: CanvasFontStretch = null as unknown as CanvasFontStretch
    fontVariantCaps: CanvasFontVariantCaps = null as unknown as CanvasFontVariantCaps
    globalAlpha: number = 0
    globalCompositeOperation: GlobalCompositeOperation = null as unknown as GlobalCompositeOperation
    imageSmoothingEnabled: boolean = false
    imageSmoothingQuality: ImageSmoothingQuality = null as unknown as ImageSmoothingQuality
    letterSpacing: string = ""
    lineCap: CanvasLineCap = null as unknown as CanvasLineCap
    lineDashOffset: number = 0
    lineJoin: CanvasLineJoin = null as unknown as CanvasLineJoin
    lineWidth: number = 0
    miterLimit: number = 0
    shadowBlur: number = 0
    shadowColor: string = ""
    shadowOffsetX: number = 0
    shadowOffsetY: number = 0
    strokeStyle: string | CanvasGradient | CanvasPattern = ""
    textAlign: CanvasTextAlign = null as unknown as CanvasTextAlign
    textBaseline: CanvasTextBaseline = null as unknown as CanvasTextBaseline
    textRendering: CanvasTextRendering = null as unknown as CanvasTextRendering
    wordSpacing: string = ""

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    }

    beginPath(): void {
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    }

    clearRect(x: number, y: number, w: number, h: number): void {
    }

    clip(fillRule?: CanvasFillRule): void
    clip(path: Path2D, fillRule?: CanvasFillRule): void
    clip(fillRule1?: CanvasFillRule | Path2D, fillRule2?: CanvasFillRule): void {
    }

    closePath(): void {
    }

    createConicGradient(startAngle: number, x: number, y: number): CanvasGradient {
        return null as unknown as CanvasGradient
    }

    createImageData(sw: number, sh: number, settings?: ImageDataSettings): ImageData
    createImageData(imagedata: ImageData): ImageData
    createImageData(sw: number | ImageData, sh?: number, settings?: ImageDataSettings): ImageData {
        return null as unknown as ImageData
    }

    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        return null as unknown as CanvasGradient
    }

    createPattern(image: CanvasImageSource, repetition: string | null): CanvasPattern | null {
        return null
    }

    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
        return null as unknown as CanvasGradient
    }

    drawFocusIfNeeded(element: Element): void
    drawFocusIfNeeded(path: Path2D, element: Element): void
    drawFocusIfNeeded(element1: Element | Path2D, element2?: Element): void {
    }

    drawImage(image: CanvasImageSource, dx: number, dy: number): void
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void
    drawImage(image: CanvasImageSource, dx1: number, dy1: number, dw1?: number, dh1?: number, dx?: number, dy?: number, dw?: number, dh?: number): void {
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
    }

    fill(fillRule?: CanvasFillRule): void
    fill(path: Path2D, fillRule?: CanvasFillRule): void
    fill(fillRule1?: CanvasFillRule | Path2D, fillRule2?: CanvasFillRule): void {
    }

    fillRect(x: number, y: number, w: number, h: number): void {
    }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
    }

    getContextAttributes(): CanvasRenderingContext2DSettings {
        return null as unknown as CanvasRenderingContext2DSettings
    }

    getImageData(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings): ImageData {
        return null as unknown as ImageData
    }

    getLineDash(): number[] {
        return []
    }

    getTransform(): DOMMatrix {
        return null as unknown as DOMMatrix
    }

    isContextLost(): boolean {
        return false
    }

    isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean
    isPointInPath(path: Path2D, x: number, y: number, fillRule?: CanvasFillRule): boolean
    isPointInPath(x: number | Path2D, y: number, fillRule1?: CanvasFillRule | number, fillRule2?: CanvasFillRule): boolean {
        return false
    }

    isPointInStroke(x: number, y: number): boolean
    isPointInStroke(path: Path2D, x: number, y: number): boolean
    isPointInStroke(x: number | Path2D, y1: number, y2?: number): boolean {
        return false
    }

    lineTo(x: number, y: number): void {
    }

    measureText(text: string): TextMetrics {
        return null as unknown as TextMetrics
    }

    moveTo(x: number, y: number): void {
    }

    putImageData(imagedata: ImageData, dx: number, dy: number): void
    putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void
    putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX?: number, dirtyY?: number, dirtyWidth?: number, dirtyHeight?: number): void {
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    }

    rect(x: number, y: number, w: number, h: number): void {
    }

    reset(): void {
    }

    resetTransform(): void {
    }

    restore(): void {
    }

    rotate(angle: number): void {
    }

    roundRect(x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[]): void
    roundRect(x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | Iterable<number | DOMPointInit>): void
    roundRect(x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[] | Iterable<number | DOMPointInit>): void {
    }

    save(): void {
    }

    scale(x: number, y: number): void {
    }

    setLineDash(segments: number[]): void
    setLineDash(segments: Iterable<number>): void
    setLineDash(segments: number[] | Iterable<number>): void {
    }

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
    setTransform(transform?: DOMMatrix2DInit): void
    setTransform(a?: number | DOMMatrix2DInit, b?: number, c?: number, d?: number, e?: number, f?: number): void {
    }

    stroke(): void
    stroke(path: Path2D): void
    stroke(path?: Path2D): void {
    }

    strokeRect(x: number, y: number, w: number, h: number): void {
    }

    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    }

    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    translate(x: number, y: number): void {
    }

}