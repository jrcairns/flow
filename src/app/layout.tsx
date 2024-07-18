
import {
  ClerkProvider
} from '@clerk/nextjs'
import { dark, neobrutalism } from '@clerk/themes';

import { ReactFlowProvider } from '@xyflow/react'
import './globals.css'
import { QueryProvider } from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className="h-full" lang="en">
      <body className="h-full">
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "hsl(20,14.3%,4.1%)"
            }
          }}>
          <QueryProvider>
            <ThemeProvider>
              <ReactFlowProvider>
                {children}
              </ReactFlowProvider>
            </ThemeProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}