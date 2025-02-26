import { BaseEntity } from "@/libs/erd/base_entity"
import { Store } from "@/libs/stores/stores"
import { Optional } from "@/libs/utils/types"

const notationStore = new Store<{notation: string}>({ notation: "" }, "notation_changed")
const editedEntityStore = new Store<{entity: Optional<BaseEntity>}>({entity: null}, "edited_entity_changed")

export {
    notationStore,
    editedEntityStore,
}