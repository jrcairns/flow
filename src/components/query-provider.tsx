"use client"

import React, { PropsWithChildren } from "react";

import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

export function QueryProvider({ children }: PropsWithChildren) {
    const [queryClient] = React.useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}