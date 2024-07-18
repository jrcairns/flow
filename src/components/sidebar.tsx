"use client"

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { CircuitBoard } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Label } from "./ui/label";
import { useParams } from "next/navigation";

export function Sidebar() {
    const params = useParams<{ projectId: string }>()

    const { data } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await fetch('/api/projects')
            const data = await res.json()

            return data
        }
    })
    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="space-y-4">
                <Label className="text-xs">Recent projects</Label>
                <ul className="space-y-1">
                    {/* @ts-ignore */}
                    {data?.map(project => {
                        const isActive = project.id === params.projectId
                        return (
                            <li className="flex w-full" key={project.id}>
                                <Link
                                    href={`/p/${project.id}`}
                                    className={cn(
                                        buttonVariants({ variant: "ghost", size: "sm" }),
                                        { "bg-accent/80 text-foreground dark:bg-transparent": isActive },
                                        "h-auto py-2 w-full items-center justify-start"
                                    )}>
                                    <CircuitBoard className="mr-2 h-3 w-3" />
                                    <span className="flex-1 line-clamp-1">
                                        {project.name}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}