function formatLog(level, message, context) {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(context ? { context } : {}),
    };
}
function emit(entry) {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const ctx = entry.context ? ` | ${JSON.stringify(entry.context)}` : "";
    const line = `${prefix} ${entry.message}${ctx}`;
    if (typeof window !== "undefined") {
        fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
            keepalive: true,
        }).catch(() => { });
    }
    if (process.env.NODE_ENV === "development") {
        if (entry.level === "ERROR")
            console.error(line);
        else if (entry.level === "WARN")
            console.warn(line);
        else
            console.log(line);
    }
}
const logger = {
    info: (message, context) => emit(formatLog("INFO", message, context)),
    warn: (message, context) => emit(formatLog("WARN", message, context)),
    error: (message, context) => emit(formatLog("ERROR", message, context)),
    debug: (message, context) => emit(formatLog("DEBUG", message, context)),
};
export default logger;
