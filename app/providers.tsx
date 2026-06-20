"use client";

import { ThemeProvider } from "next-themes";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            enableColorScheme={false}
            disableTransitionOnChange={true}
        >
            {children}
        </ThemeProvider>
    );
}

export default Providers;