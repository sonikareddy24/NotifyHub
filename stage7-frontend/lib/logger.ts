/* lib/logger.ts */
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  };
}

function emit(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  const ctx = entry.context ? ` | ${JSON.stringify(entry.context)}` : "";
  const line = `${prefix} ${entry.message}${ctx}`;

  if (typeof window !== "undefined") {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  }

  if (process.env.NODE_ENV === "development") {
    if (entry.level === "ERROR") console.error(line);
    else if (entry.level === "WARN") console.warn(line);
    else console.log(line);
  }
}

const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit(formatLog("INFO", message, context)),
  warn: (message: string, context?: Record<string, unknown>) => emit(formatLog("WARN", message, context)),
  error: (message: string, context?: Record<string, unknown>) => emit(formatLog("ERROR", message, context)),
  debug: (message: string, context?: Record<string, unknown>) => emit(formatLog("DEBUG", message, context)),
};

export default logger;
