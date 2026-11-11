import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 3256,
    },
    test: {
        coverage: {
            provider: "v8",
            include: ["src/**/*.js"],
            // main.js is browser bootstrap (Kaplay init + DOM), and zzfx.js is a
            // vendored synthesizer. Neither is meaningfully unit-testable.
            exclude: [
                "src/**/*.test.js",
                "src/test/**",
                "src/main.js",
                "src/utils/zzfx.js",
            ],
            reporter: ["text"],
            thresholds: {
                lines: 90,
                statements: 88,
                functions: 83,
                branches: 70,
                "src/entities/**": {
                    lines: 95,
                    statements: 95,
                    functions: 85,
                    branches: 80,
                },
                "src/scenes/**": {
                    lines: 90,
                    statements: 88,
                    functions: 75,
                    branches: 65,
                },
                "src/systems/**": {
                    lines: 85,
                    statements: 83,
                    functions: 80,
                    branches: 65,
                },
                "src/ui/**": {
                    lines: 90,
                    statements: 90,
                    functions: 85,
                    branches: 80,
                },
                "src/utils/**": {
                    lines: 85,
                    statements: 85,
                    functions: 80,
                    branches: 60,
                },
            },
        },
    },
});
