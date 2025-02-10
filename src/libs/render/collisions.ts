import { Point, Rectangle } from "@/libs/render/shapes"

function PointWithRectCollides(p: Point, r: Rectangle): boolean {
    return (p.x >= r.topLeftCorner.x && p.x <= r.topLeftCorner.x + r.width) &&
        (p.y >= r.topLeftCorner.y && p.y <= r.topLeftCorner.y + r.height)
}

export {
    PointWithRectCollides,
}