import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}" // Include shared UI
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    yellow: "#FFC107", // Taco Molly Yellow
                    green: "#008F39",  // Taco Molly Green
                    black: "#1A1A1A",
                    gray: "#F5F5F5",
                },
            },
        },
    },
    plugins: [],
};
export default config;
