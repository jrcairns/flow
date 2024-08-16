import {
  ClerkProvider
} from '@clerk/nextjs';

import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactFlowProvider } from '@xyflow/react';
import './globals.css';

import { GeistSans } from 'geist/font/sans';
import { DnDProvider } from '@/components/dnd-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ClerkProvider
          appearance={{
            // baseTheme: dark,
            variables: {
              // colorBackground: "hsl(20,14.3%,4.1%)"
            }
          }}>
          <QueryProvider>
            <ThemeProvider>
              <ReactFlowProvider>
                <DnDProvider>
                  {children}
                </DnDProvider>
              </ReactFlowProvider>
            </ThemeProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}