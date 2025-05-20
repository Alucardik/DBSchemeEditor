import { Scheme } from "@/app/models/scheme"
import { HTTPStatuses } from "@/libs/http/statuses"
import { QueryBuilder } from "@/libs/sql/query_builder"
import { NextRequest, NextResponse } from "next/server"


export async function POST(req: NextRequest) {
    let rawScheme = {} as Scheme

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
    const queryBuilder = new QueryBuilder()

    const err = queryBuilder.SetScheme(scheme)
    if (err) {
        console.error(err)
        return NextResponse.json({
            message: err.message,
        }, {
            status: HTTPStatuses.BAD_REQUEST,
        })
    }

    const [sql, buildErr] = queryBuilder.Build()
    if (buildErr) {
        return NextResponse.json({
            message: buildErr.message,
        }, {
            status: HTTPStatuses.BAD_REQUEST,
        })
    }

    return NextResponse.json({ sql })
}