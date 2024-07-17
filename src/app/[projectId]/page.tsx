import { Flow } from "@/components/flow";
import { ProjectFlow } from "@/components/project-flow";
import { db } from "@/server/db";
import { notFound } from "next/navigation";

export default async function Project({ params }: { params: { projectId: string } }) {
    const project = await db.query.projects.findFirst({
        where: (model, { eq }) => eq(model.id, params.projectId)
    })

    if (!project) return notFound()

    return <div className="border rounded-md shadow-inner h-full">
        {/* @ts-ignore */}
        <ProjectFlow initialEdges={project.map.edges} initialNodes={project.map.nodes} />
    </div>
}