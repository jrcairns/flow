"use client"

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { CircuitBoard } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Label } from "./ui/label";
import { useParams } from "next/navigation";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

export function Sidebar() {
    const params = useParams<{ projectId: string }>()

    const { data, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await fetch('/api/projects')
            const data = await res.json()

            return data
        }
    })
    return (
        <div className="py-4 bg-muted/10">
            <div className="flex flex-col space-y-2 px-2">
                <Label className="text-xs px-3">Recent projects</Label>
                {isLoading ? (
                    <Skeleton className="mx-2 h-44" />
                ) : (
                    <>
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
                        <Link className={cn("!h-auto", buttonVariants({ size: "sm", variant: "link" }))} href="/projects">View all</Link>
                    </>
                )}
            </div>
            {/* <Separator className="my-4" /> */}
        </div>
    )
}