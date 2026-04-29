export function createLogger(moduleName: string) {
    return {
        log: (message: string) => console.log(`[${moduleName}] ${new Date().toISOString()} ${message}`),
        sep: () => console.log(`[${moduleName}] ${'─'.repeat(60)}`),
    };
}

export type Logger = ReturnType<typeof createLogger>;