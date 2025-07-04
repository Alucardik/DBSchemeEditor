import { BaseRelationship } from "@/libs/erd/base_relationship"
import { Point, Shape } from "@/libs/render/shapes"
import type { Optional } from "@/libs/utils/types"

export type TextPositionGetter<S extends Shape> = (s: S) => [Point, boolean]

export type Dependency = {
    lhs: string[],
    rhs: string[],
}

export class EntityPart<S extends Shape> {
    readonly name: string
    readonly shape: S
    // TODO: maybe save styles here instead of the whole entity
    private text: string
    constructor(
        name: string,
        shape: S,
        text: string = "",
        textPositionGetter: TextPositionGetter<S> = (s: S) => [s.GetPivotPoint(), false],
    ) {
        this.name = name
        this.shape = shape
        this.text = text
        this.GetTextPosition = (): [Point, boolean] => textPositionGetter(this.shape)
    }

    static FromJSON<S extends Shape>(obj: object, s: S): EntityPart<S> {
        const entityPart = Object.assign(new EntityPart("", s), obj)
        // @ts-ignore
        entityPart.shape = s

        return entityPart
    }

    GetText(this: EntityPart<S>): string {
        return this.text
    }

    SetText(this: EntityPart<S>, text: string) {
        this.text = text
    }

    // GetTextPosition returns text position relative to this EnityPart's shape;
    // the second parameter tells whether the text is centered or not (may be overriden in the constructor)
    GetTextPosition = (): [Point, boolean] => {
        return [this.shape.GetPivotPoint(), false]
    }
}

export abstract class BaseEntityAttribute<S extends Shape> extends EntityPart<S> {
    abstract AttachToRelationship(relationship: BaseRelationship<any>, mousePos: Point): void
    abstract DetachFromRelationship(relationship: BaseRelationship<any>): void
    abstract DetachAllRelationships(): void
}

export abstract class BaseEntity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string
    protected dependencies: Dependency[] = []

    protected constructor(name: string) {
        this.name = name
        this.id = BaseEntity.counter

        BaseEntity.counter++
    }

    GetID() {
        return this.id
    }

    GetDependencies(): ReadonlyArray<Dependency> {
        return this.dependencies
    }

    SetDependencies(dependencies: Dependency[]) {
        this.dependencies = dependencies
    }

    GetName() {
        return this.name
    }

    SetName(name: string){
        this.name = name
    }

    abstract ToJSON(): object

    abstract AddAttribute(attributeName: string, ...extraArgs: any[]): void

    abstract GetAttributes(): BaseEntityAttribute<Shape>[]

    abstract GetPosition(): Point

    abstract SetPosition(x: number, y: number): void

    abstract Highlight(ctx: CanvasRenderingContext2D): void

    abstract GetInteractedPart(p: Point): Optional<EntityPart<Shape>>

    abstract SelectPart(partName: string, ctx: CanvasRenderingContext2D): void

    abstract GetSelectedPart(): Optional<EntityPart<Shape>>

    abstract Unselect(): void

    abstract GetWidth(): number

    abstract GetHeight(): number

    abstract Render(ctx: CanvasRenderingContext2D): void

    abstract Clear(ctx: CanvasRenderingContext2D): void

    abstract DetachAllRelationships(): void
}
