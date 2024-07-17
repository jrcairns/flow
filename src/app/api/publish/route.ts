import { db } from "@/server/db";
import { CreateProjectSchema, projects } from "@/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const user = await currentUser()

    if (!user?.id) {
        throw new Error("Unauthorized")
    }

    const body = await request.json()

    const parsed = CreateProjectSchema.parse(body)

    const [project] = await db.insert(projects).values({
        ...parsed,
        userId: user.id
    }).returning()

    return Response.json(project, { status: 200 })
}