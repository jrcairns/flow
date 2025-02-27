"use client"

import { UserButton } from "@clerk/nextjs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ChevronDown, CircuitBoard } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useParams, usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "./ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import Link from "next/link";

export function ProjectNavigation() {
    const { projectId } = useParams()

    const { data, isLoading, isRefetching } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const response = await fetch(`/api/project/${projectId}`)
            const data = await response.json()
            return data
        }
    })

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="max-w-[18ch] space-x-2">
                    {isLoading ? <Skeleton className="w-24 bg-muted-foreground h-4 flex-1" /> : <span className="truncate flex-1">{data?.name}</span>}
                    <CircuitBoard className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="shadow">
                <ManageProjectForm project={data} />
            </DialogContent>
        </Dialog>
    )
}

function ManageProjectForm({ project }: { project: any }) {
    const queryClient = useQueryClient()

    const form = useForm({
        defaultValues: {
            name: project.name
        }
    })

    const mutation = useMutation({
        mutationKey: undefined,
        mutationFn: async (values) => {
            const response = await fetch(`/api/project/${project.id}`, {
                method: "PUT",
                body: JSON.stringify(values)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["project", project.id]
            })
            queryClient.invalidateQueries({
                queryKey: ["projects"]
            })
        }
    })

    // @ts-ignore
    async function onSubmit(values) {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <DialogHeader>
                    <DialogTitle>Manage project</DialogTitle>
                    <DialogDescription>Update your project&apos;s name, or remove it entirely.</DialogDescription>
                </DialogHeader>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose>
                        <Button disabled variant="destructive">Delete</Button>
                    </DialogClose>
                    <DialogClose>
                        <Button>Save & close</Button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </Form>
    )
}