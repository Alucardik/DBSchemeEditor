type CustomEventCallback<T> = (e: CustomEvent<T>) => void

export class CustomEventWrapper<T extends any> {
    private readonly eventName: string

    constructor(eventName: string) {
        this.eventName = eventName
    }

    AddListener(callback: CustomEventCallback<T>) {
        document.addEventListener(this.eventName, callback as (e: Event) => void)
    }

    RemoveListener(callback: CustomEventCallback<T>) {
        document.removeEventListener(this.eventName, callback as (e: Event) => void)
    }

    Dispatch(detail: T) {
        document.dispatchEvent(new CustomEvent(this.eventName, {
            detail: detail,
        }))
    }
}