import { db } from "@/server/db"
import { projects } from "@/server/db/schema"
import { currentUser } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const user = await currentUser()

    if (!user?.id) {
        return Response.json(null, { status: 403 })
    }

    const project = await db.query.projects.findFirst({
        where: (model, { eq, and }) => and(eq(model.id, params.id), eq(model.userId, user.id)),
    })

    return Response.json(project, { status: 200 })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const user = await currentUser()

    if (!user?.id) {
        return Response.json(null, { status: 403 })
    }

    const body = await request.json()

    await db
        .update(projects)
        .set({ ...body })
        .where(
            and(
                eq(projects.id, params.id),
                eq(projects.userId, user.id),
            )
        )

    return Response.json(null)
}