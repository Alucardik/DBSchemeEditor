import { Point } from "@/libs/render/shapes"

export abstract class Entity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string
    protected position: Point

    constructor(name: string, x: number = 0, y: number = 0) {
        this.name = name
        this.id = Entity.counter
        this.position = new Point(x, y)

        Entity.counter++
    }

    GetName(this: Entity) {
        return this.name
    }

    SetName(this: Entity, name: string){
        this.name = name
    }

    GetPosition(this: Entity) {
        return this.position
    }

    SetPosition(this: Entity, x: number, y: number){
        this.position.x = x
        this.position.y = y
    }

    abstract GetWidth(this: Entity): number

    abstract GetHeight(this: Entity): number

    abstract Render(this: Entity, ctx: CanvasRenderingContext2D): void
}