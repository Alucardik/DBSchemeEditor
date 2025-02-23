// TODO: support partial props resets
function resetCanvasContextProps(ctx: CanvasRenderingContext2D) {
    ctx.direction = "inherit"
    ctx.fillStyle = "#000"
    ctx.filter = "none"
    ctx.font = "10px sans-serif"
    ctx.fontKerning = "auto"
    ctx.fontStretch = "normal"
    ctx.fontVariantCaps = "normal"
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "low"
    // TODO: choose another font and letter spacing
    ctx.letterSpacing = "0px"
    ctx.lineCap = "butt"
    ctx.lineDashOffset = 0
    ctx.lineJoin = "miter"
    ctx.lineWidth = 1
    ctx.miterLimit = 10
    ctx.shadowBlur = 0
    ctx.shadowColor = "#00000000"
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = "#000"
    ctx.textAlign = "start"
    ctx.textBaseline = "alphabetic"
    ctx.textRendering = "auto"
    ctx.wordSpacing = "0px"
}

export {
    resetCanvasContextProps,
}