import { ProjectNavigation } from "@/components/project-navigation";
import { Sidebar } from "@/components/sidebar";
import { PropsWithChildren, Suspense } from "react";
import { Toaster } from "sonner";

export default function ProjectLayout({ children }: PropsWithChildren) {
    return (
        <div className="h-screen bg-background flex [--sidebar-width:theme(spacing.64)] [--nav-height:theme(spacing.16)]">
            <div className="fixed flex w-[--sidebar-width] left-0 bottom-0 top-[--nav-height]">
                <Sidebar />
            </div>
            <div className="fixed flex top-0 inset-x-0 h-[--nav-height]">
                <ProjectNavigation />
            </div>
            <div className="flex-1 mr-4 mb-4 mt-[--nav-height] ml-[--sidebar-width]">
                {children}
                <Toaster
                    toastOptions={{
                        classNames: {
                            toast: 'max-w-xs bg-background border-border text-foreground right-0',
                        },
                    }}
                />
            </div>
        </div>
    )
}