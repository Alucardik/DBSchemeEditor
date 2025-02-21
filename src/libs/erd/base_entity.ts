import { Point, Shape } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export class EntityPart<S extends Shape> {
    readonly name: string
    readonly shape: S

    constructor(name: string, shape: S) {
        this.name = name
        this.shape = shape
    }
}

export abstract class BaseEntity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string

    protected constructor(name: string, x: number = 0, y: number = 0) {
        this.name = name
        this.id = BaseEntity.counter

        BaseEntity.counter++
    }

    GetName(this: BaseEntity) {
        return this.name
    }

    SetName(this: BaseEntity, name: string){
        this.name = name
    }

    abstract GetPosition(this: BaseEntity): Point

    abstract SetPosition(this: BaseEntity, x: number, y: number): void

    abstract GetInteractedPart(this: BaseEntity, p: Point): Optional<EntityPart<Shape>>

    abstract SelectPart(this: BaseEntity, partName: string, ctx: CanvasRenderingContext2D): void

    abstract GetSelectedPartName(this: BaseEntity): Optional<string>

    abstract GetSelectedPartTextPosition(this: BaseEntity): Optional<Point>

    abstract GetWidth(this: BaseEntity): number

    abstract GetHeight(this: BaseEntity): number

    abstract Render(this: BaseEntity, ctx: CanvasRenderingContext2D): void

    abstract Clear(this: BaseEntity, ctx: CanvasRenderingContext2D): void
}