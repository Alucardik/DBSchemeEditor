import { Scheme } from "@/libs/dto/scheme"
import { HTTPMethod } from "@/libs/http/requests"

const defaultAPIEndpoint = "http://localhost:3000/api"

export class Client {
    private static instance: Client
    private readonly apiEndpoint: string = defaultAPIEndpoint

    private constructor() {
        this.apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || defaultAPIEndpoint
    }

    static async NormalizeScheme(scheme: Scheme, nf: 2 | 3) {
        return fetch(Client.GetInstance().GetHandlerURL(`scheme/normalize?nf=${nf}`), {
            method: HTTPMethod.POST,
            body: JSON.stringify(scheme),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }

    static async ApplyScheme(scheme: Scheme) {
        return fetch(Client.GetInstance().GetHandlerURL("scheme/apply"), {
            method: HTTPMethod.POST,
            body: JSON.stringify(scheme),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }

    static async GenerateSQL(scheme: Scheme) {
        return fetch(Client.GetInstance().GetHandlerURL("scheme/generate/sql"), {
            method: HTTPMethod.POST,
            body: JSON.stringify(scheme),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }

    private static GetInstance(): Client {
        if (!Client.instance) {
            Client.instance = new Client()
        }

        return Client.instance
    }

    private GetHandlerURL(path: string): string {
        return `${this.apiEndpoint}/${path}`
    }
}