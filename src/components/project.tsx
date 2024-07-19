"use client"

import { Protect } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

export function Project({ children }: PropsWithChildren) {
    const pathname = usePathname()

    return <Protect condition={() => pathname.startsWith('/p/')}>{children}</Protect>
}