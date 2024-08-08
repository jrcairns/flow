"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
    return (
        <NextThemeProvider enableSystem defaultTheme="dark" attribute="class">
            {children}
        </NextThemeProvider>
    )
}