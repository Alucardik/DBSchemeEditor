import { Scheme } from "@/app/models/scheme"
import type { Scheme as SchemeDTO } from "@/libs/dto/scheme"
import { HTTPStatuses } from "@/libs/http/statuses"
import { Normalizer } from "@/libs/relational/normalization"
import { NextRequest, NextResponse } from "next/server"


export async function POST(req: NextRequest) {
    let rawScheme = {} as SchemeDTO

    try {
        rawScheme = await req.json()
    } catch (e) {
        console.error(e)
        return NextResponse.json({
            message: "bad request",
        }, {
            status: HTTPStatuses.BAD_REQUEST
        })
    }

    const scheme = new Scheme(rawScheme)
    const normalizer = new Normalizer(scheme)

    const [newScheme, violations] = normalizer.SecondNormalForm()
    if (violations.length > 0 || !newScheme) {
        return NextResponse.json({
            violations: violations,
        }, {
            status: HTTPStatuses.UNPROCESSABLE_ENTITY,
        })
    }

    return NextResponse.json({
        scheme: newScheme.ToDTO(),
    }, {
        status: HTTPStatuses.OK
    })
}