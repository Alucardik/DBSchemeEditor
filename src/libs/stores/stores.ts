type subscriberCallback<T> = (value: T) => void

export class Store<T> {
    private readonly eventTarget = new EventTarget()
    private readonly eventName: string
    private value: T

    constructor(initialValue: T, eventName: string) {
        this.value = initialValue
        this.eventName = eventName
    }

    Get(this: Store<T>): T {
        return this.value
    }

    Set(this: Store<T>, newValue: T) {
        if (this.value !== newValue) {
            this.value = newValue
            this.eventTarget.dispatchEvent(new CustomEvent(this.eventName, { detail: newValue }))
        }
    }

    Subscribe(this: Store<T>, callback: subscriberCallback<T>) {
        const listener = (event: Event) => {
            const customEvent = event as CustomEvent<T>
            callback(customEvent.detail)
        }

        this.eventTarget.addEventListener(this.eventName, listener)

        return () => {
            this.eventTarget.removeEventListener(this.eventName, listener)
        }
    }
}