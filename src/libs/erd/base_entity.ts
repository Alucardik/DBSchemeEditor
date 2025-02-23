import { Point, Shape } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export class EntityPart<S extends Shape> {
    readonly name: string
    readonly shape: S

    private text: string
    // TODO: maybe save styles here instead of the whole entity

    constructor(name: string, shape: S, text: string = "") {
        this.name = name
        this.shape = shape
        this.text = text
    }

    GetText(this: EntityPart<S>): string {
        return this.text
    }

    SetText(this: EntityPart<S>, text: string) {
        this.text = text
    }
}

export abstract class BaseEntity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string

    protected constructor(name: string) {
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

    abstract GetSelectedPart(this: BaseEntity): Optional<EntityPart<Shape>>

    abstract GetSelectedPartTextPosition(this: BaseEntity): Optional<Point>

    abstract GetWidth(this: BaseEntity): number

    abstract GetHeight(this: BaseEntity): number

    abstract Render(this: BaseEntity, ctx: CanvasRenderingContext2D): void

    abstract Clear(this: BaseEntity, ctx: CanvasRenderingContext2D): void
}