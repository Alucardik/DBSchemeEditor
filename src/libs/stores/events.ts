type CustomEventCallback<T> = (e: CustomEvent<T>) => void

export class CustomEventWrapper<T extends any> {
    private readonly eventTarget: EventTarget = new EventTarget()
    private readonly eventName: string

    constructor(eventName: string) {
        this.eventName = eventName
    }

    AddListener(this: CustomEventWrapper<T>, callback: CustomEventCallback<T>) {
        this.eventTarget.addEventListener(this.eventName, callback as (e: Event) => void)
    }

    RemoveListener(this: CustomEventWrapper<T>, callback: CustomEventCallback<T>) {
        this.eventTarget.removeEventListener(this.eventName, callback as (e: Event) => void)
    }

    Dispatch(this: CustomEventWrapper<T>, detail: T) {
        this.eventTarget.dispatchEvent(new CustomEvent(this.eventName, {
            detail: detail,
        }))
    }
}