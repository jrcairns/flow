import { ComponentProps, ElementType, PropsWithChildren } from "react";

export function MacFrame({ children, className }: PropsWithChildren<ComponentProps<"div">>) {
    return (
        <div className={className}>
            <div className="h-8 border-b rounded-t-xl px-2.5 relative flex items-center">
                <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 bg-red-500 rounded-full"></span>
                    <span className="h-3 w-3 bg-yellow-400 rounded-full"></span>
                    <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                </div>
                <span className="absolute left-1/2 -translate-x-1/2 font-medium text-muted-foreground text-sm">https://quiz.flowcala.com</span>
            </div>
            {children}
        </div>
    )
}