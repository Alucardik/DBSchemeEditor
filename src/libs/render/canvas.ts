const defaultRenderingContext2DValues = {
    direction:  "inherit",
    fillStyle:  "#000",
    filter: "none",
    font: "10px sans-serif",
    fontKerning: "auto",
    fontStretch: "normal",
    fontVariantCaps: "normal",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "low",
    letterSpacing: "0px",
    lineCap: "butt",
    lineDashOffset: 0,
    lineJoin: "miter",
    lineWidth: 1,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: "#00000000",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    strokeStyle: "#000",
    textAlign: "start",
    textBaseline: "alphabetic",
    textRendering: "auto",
    wordSpacing: "0px",
}

function resetCanvasContextProps(ctx: CanvasRenderingContext2D, ...props: string[]) {
    // reset all props by default
    if (props.length === 0) {
        for (const [key, value] of Object.entries(defaultRenderingContext2DValues)) {
            // @ts-ignore
            ctx[key] = value
        }

        return
    }

    for (const prop of props) {
        if (prop in defaultRenderingContext2DValues) {
            // @ts-ignore
            ctx[prop] = defaultRenderingContext2DValues[prop]
        }
    }
}

export {
    resetCanvasContextProps,
}