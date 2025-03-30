import { BaseEntity } from "@/libs/erd/base_entity"
import { BaseRelationship } from "@/libs/erd/base_relationship"
import { Point } from "@/libs/render/shapes"
import { Store } from "@/libs/stores/stores"
import { Optional } from "@/libs/utils/types"

const notationStore = new Store<{notation: string}>({ notation: "" }, "notation_changed")
const editedEntityStore = new Store<{entity: Optional<BaseEntity>}>({entity: null}, "edited_entity_changed")
const editedRelationshipStore = new Store<{relationship: Optional<BaseRelationship<any>>}>({relationship: null}, "edited_relationship_changed")
const canvasOffsetStore = new Store<Point>(new Point(0, 0), "canvas_offset_changed")

export {
    notationStore,
    editedEntityStore,
    editedRelationshipStore,
    canvasOffsetStore,
}