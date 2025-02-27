type SubscriberCallback<T> = (value: T) => void

export class Store<T> {
    private readonly eventName: string
    private value: T

    constructor(initialValue: T, eventName: string) {
        this.value = initialValue
        this.eventName = eventName
    }

    Get() {
        return this.value
    }

    Set(newValue: T) {
        if (this.value !== newValue) {
            this.value = newValue
            document.dispatchEvent(new CustomEvent(this.eventName, { detail: newValue }))
        }
    }

    Subscribe(callback: SubscriberCallback<T>) {
        const listener = (event: Event) => {
            const customEvent = event as CustomEvent<T>
            callback(customEvent.detail)
        }

        document.addEventListener(this.eventName, listener)

        return () => {
            document.removeEventListener(this.eventName, listener)
        }
    }
}