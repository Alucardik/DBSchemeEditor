export abstract class Entity {
    private static counter: number = 0

    protected readonly id: number
    protected name: string
    protected x: number
    protected y: number

    constructor(name: string, x: number = 0, y: number = 0) {
        this.name = name
        this.id = Entity.counter
        this.x = x
        this.y = y

        Entity.counter++
    }

    GetName(this: Entity) {
        return this.name
    }

    SetName(this: Entity, name: string){
        this.name = name
    }

    SetPosition(this: Entity, x: number, y: number){
        this.x = x
        this.y = y
    }

    abstract Render(this: Entity, ctx: CanvasRenderingContext2D): void
}