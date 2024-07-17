import { db } from "@/server/db"
import { currentUser } from "@clerk/nextjs/server"
import { asc } from "drizzle-orm"

export async function GET(request: Request) {
    const user = await currentUser()

    if (!user?.id) {
        return Response.json(null, { status: 403 })
    }

    const projects = await db.query.projects.findMany({
        where: (model, { eq }) => eq(model.userId, user.id),
        orderBy: (model, { desc }) => desc(model.createdAt),
        limit: 5
    })

    return Response.json(projects, { status: 200 })
}