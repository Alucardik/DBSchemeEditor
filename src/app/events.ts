import { CustomEventWrapper } from "@/libs/stores/events"

const canvasUpdateEvent = new CustomEventWrapper<null>("canvas_update")

export {
    canvasUpdateEvent,
}