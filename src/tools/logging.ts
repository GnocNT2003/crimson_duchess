export function log(commandName: string, message: string): void {
    console.log(`[${commandName}] ${new Date().toISOString()} ${message}`);
}

export function logSep(commandName: string) {
    console.log(`[${commandName}] ${'─'.repeat(60)}`);
}