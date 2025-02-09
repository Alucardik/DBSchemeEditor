import type { Metadata } from "next"
import "./globals.css"


export const metadata: Metadata = {
    title: "DBSchemeEditor",
    description: "Relational DB Schema Editor",
}

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode,
}>) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/favicon.png" sizes="any"/>
        </head>
        <body>
            {children}
        </body>
        </html>
    )
}
