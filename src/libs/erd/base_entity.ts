import { Point } from "@/libs/render/shapes"

export abstract class BaseEntity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string
    protected position: Point

    constructor(name: string, x: number = 0, y: number = 0) {
        this.name = name
        this.id = BaseEntity.counter
        this.position = new Point(x, y)

        BaseEntity.counter++
    }

    GetName(this: BaseEntity) {
        return this.name
    }

    SetName(this: BaseEntity, name: string){
        this.name = name
    }

    GetPosition(this: BaseEntity) {
        return this.position
    }

    SetPosition(this: BaseEntity, x: number, y: number){
        this.position.x = x
        this.position.y = y
    }

    abstract GetCenteredPosition(this: BaseEntity): Point

    abstract GetWidth(this: BaseEntity): number

    abstract GetHeight(this: BaseEntity): number

    abstract Render(this: BaseEntity, ctx: CanvasRenderingContext2D): void
}