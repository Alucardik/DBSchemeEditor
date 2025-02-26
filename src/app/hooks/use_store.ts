import { Store } from "@/libs/stores/stores"
import { useEffect, useState } from "react"

export default function useStore<T>(store: Store<T>) {
    const [value, setValue] = useState(store.Get())

    useEffect(() => {
        const unsubscribe = store.Subscribe(setValue)
        return unsubscribe
    }, [store])

    return value
}