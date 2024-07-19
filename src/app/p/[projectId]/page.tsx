// import { Flow } from "@/components/flow";
import { db } from "@/server/db";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";

const Flow = dynamic(() => import('@/components/flow').then(mod => mod.Flow), { ssr: false });

export default async function Project({ params }: { params: { projectId: string } }) {
    const project = await db.query.projects.findFirst({
        where: (model, { eq }) => eq(model.id, params.projectId)
    })

    if (!project) return notFound()

    return (
        <div className="bg-muted/10 sm:p-4 h-svh">
            {/* @ts-ignore */}
            <Flow className="sm:border sm:rounded-md" initialNodes={project.map.nodes} initialEdges={project.map.edges} />
            <Toaster
                toastOptions={{
                    classNames: {
                        toast: 'max-w-xs bg-background border-border text-foreground right-0',
                    },
                }}
            />
        </div>
    )
}