
import {
  ClerkProvider
} from '@clerk/nextjs'
import { dark } from '@clerk/themes';

import { ReactFlowProvider } from '@xyflow/react'
import './globals.css'
import { QueryProvider } from '@/components/query-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark
      }}>
      <html lang="en">
        <body>
          <QueryProvider>
            <ReactFlowProvider>
              {children}
            </ReactFlowProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}