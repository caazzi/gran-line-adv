// ============================================
// Telemetry — OTel-style logs, spans and metrics
// ============================================
// Deliberately export-free: nothing here performs network IO or writes to
// storage. Records live in bounded in-memory ring buffers and, for logs above
// the console threshold, are mirrored to the console.
//
// Inspect at runtime:
//   window.__telemetry.getSnapshot()
// Verbose console output:
//   http://localhost:3256/?telemetry=debug
//
// The shapes follow OpenTelemetry names (severityNumber/severityText,
// traceId/spanId/parentSpanId, timeUnixNano) without pulling the SDK in.

export const SeverityNumber = Object.freeze({
    TRACE: 1,
    DEBUG: 5,
    INFO: 9,
    WARN: 13,
    ERROR: 17,
    FATAL: 21,
});

export const SpanStatusCode = Object.freeze({
    UNSET: "UNSET",
    OK: "OK",
    ERROR: "ERROR",
});

const MAX_STRING_LENGTH = 4000;

const CONSOLE_METHOD = {
    TRACE: "debug",
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error",
    FATAL: "error",
};

const SEVERITY_ALIASES = {
    WARNING: "WARN",
    ERR: "ERROR",
    CRITICAL: "FATAL",
};

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------

class RingBuffer {
    constructor(capacity) {
        this.capacity = Math.max(1, Math.floor(capacity));
        this.items = [];
        this.dropped = 0;
    }

    push(item) {
        this.items.push(item);
        if (this.items.length > this.capacity) {
            this.items.shift();
            this.dropped++;
        }
        return item;
    }

    clear() {
        this.items.length = 0;
        this.dropped = 0;
    }

    toArray() {
        return [...this.items];
    }

    get size() {
        return this.items.length;
    }
}

function truncate(value, limit = MAX_STRING_LENGTH) {
    const text = String(value);
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}…[truncated]`;
}

function toUnixNano(milliseconds) {
    return String(Math.round(milliseconds * 1e6));
}

function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
            .join(",")}}`;
    }
    return value === undefined ? "null" : JSON.stringify(value);
}

function normalizeAttributeValue(value) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "string") return truncate(value);
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : String(value);
    }
    if (typeof value === "boolean") return value;
    if (typeof value === "bigint") return value.toString();
    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeAttributeValue(item))
            .filter((item) => item !== undefined);
    }
    if (value instanceof Error) {
        return { type: value.name, message: truncate(value.message) };
    }
    try {
        return truncate(JSON.stringify(value));
    } catch {
        return truncate(String(value));
    }
}

function normalizeAttributes(attributes) {
    if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
        return {};
    }

    const normalized = {};
    for (const [key, value] of Object.entries(attributes)) {
        const attribute = normalizeAttributeValue(value);
        if (attribute !== undefined) normalized[String(key)] = attribute;
    }
    return normalized;
}

function normalizeSeverityNumber(severity) {
    if (typeof severity === "number" && Number.isFinite(severity)) {
        return Math.min(24, Math.max(1, Math.round(severity)));
    }

    const text = String(severity ?? "INFO").toUpperCase();
    const key = SEVERITY_ALIASES[text] ?? text;
    return SeverityNumber[key] ?? SeverityNumber.INFO;
}

function severityTextFor(number) {
    if (number >= SeverityNumber.FATAL) return "FATAL";
    if (number >= SeverityNumber.ERROR) return "ERROR";
    if (number >= SeverityNumber.WARN) return "WARN";
    if (number >= SeverityNumber.INFO) return "INFO";
    if (number >= SeverityNumber.DEBUG) return "DEBUG";
    return "TRACE";
}

function formatBody(body) {
    if (typeof body === "string") return truncate(body);
    if (body === null || body === undefined) return "";
    if (typeof body === "object") {
        try {
            return truncate(JSON.stringify(body));
        } catch {
            return truncate(String(body));
        }
    }
    return truncate(String(body));
}

function defaultRandomHex(bytes) {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
        const buffer = new Uint8Array(bytes);
        cryptoApi.getRandomValues(buffer);
        return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    let hex = "";
    for (let i = 0; i < bytes * 2; i++) {
        hex += Math.floor(Math.random() * 16).toString(16);
    }
    return hex;
}

/**
 * Convert anything thrown into OTel-style exception attributes.
 * Never throws, including for circular objects and non-Error values.
 */
export function errorToAttributes(error) {
    if (error instanceof Error) {
        const attributes = {
            "exception.type": error.name || "Error",
            "exception.message": truncate(error.message ?? ""),
        };
        if (error.stack) attributes["exception.stack"] = truncate(error.stack);
        if (error.cause !== undefined) {
            attributes["exception.cause"] = truncate(
                error.cause instanceof Error ? error.cause.message : String(error.cause),
            );
        }
        return attributes;
    }

    if (error && typeof error === "object") {
        try {
            return {
                "exception.type": error.constructor?.name ?? "Object",
                "exception.message": truncate(JSON.stringify(error)),
            };
        } catch {
            return {
                "exception.type": "Object",
                "exception.message": truncate(String(error)),
            };
        }
    }

    return {
        "exception.type": typeof error,
        "exception.message": truncate(String(error)),
    };
}

// ---------------------------------------------------------------
// Factory
// ---------------------------------------------------------------

/**
 * Create an isolated telemetry instance. Tests inject the clock, id source
 * and console sink; the app uses the singleton exported at the bottom.
 */
export function createTelemetry(options = {}) {
    const config = {
        serviceName: "gran-line-adventure",
        serviceVersion: "0.1.0",
        maxLogs: 500,
        maxSpans: 200,
        maxMetricSeries: 200,
        consoleSink: typeof console !== "undefined" ? console : null,
        consoleMinSeverity: "INFO",
        resource: {},
        now: () => Date.now(),
        randomHex: defaultRandomHex,
        ...options,
    };

    const now = config.now;
    const randomHex = config.randomHex;

    const logs = new RingBuffer(config.maxLogs);
    const spans = new RingBuffer(config.maxSpans);
    const activeSpans = [];
    const metrics = new Map();

    const resource = normalizeAttributes({
        "service.name": config.serviceName,
        "service.version": config.serviceVersion,
        "telemetry.sdk.name": "gran-line-telemetry",
        "telemetry.sdk.language": "javascript",
        ...config.resource,
    });

    let consoleSink = config.consoleSink ?? null;
    let consoleEnabled = Boolean(consoleSink);
    let consoleMinSeverityNumber = normalizeSeverityNumber(config.consoleMinSeverity);
    let droppedMetricSeries = 0;

    function currentSpan() {
        return activeSpans.length > 0 ? activeSpans[activeSpans.length - 1] : null;
    }

    function writeConsole(record) {
        if (!consoleEnabled || !consoleSink) return;
        if (record.severityNumber < consoleMinSeverityNumber) return;

        const attributes = Object.keys(record.attributes).length > 0
            ? ` ${JSON.stringify(record.attributes)}`
            : "";
        const context = record.traceId
            ? ` trace=${record.traceId.slice(0, 8)} span=${record.spanId.slice(0, 8)}`
            : "";
        const line = `[${record.severityText}] ${record.body}${attributes}${context}`;

        const method = CONSOLE_METHOD[record.severityText] ?? "log";
        const sink = typeof consoleSink[method] === "function" ? consoleSink[method] : consoleSink.log;
        if (typeof sink === "function") sink.call(consoleSink, line);
    }

    function emit(severity, body, attributes) {
        const severityNumber = normalizeSeverityNumber(severity);
        const severityText = severityTextFor(severityNumber);
        const active = currentSpan();

        const record = {
            type: "log",
            timeUnixNano: toUnixNano(now()),
            severityNumber,
            severityText,
            body: formatBody(body),
            attributes: normalizeAttributes(attributes),
            traceId: active ? active.traceId : null,
            spanId: active ? active.spanId : null,
        };

        logs.push(record);
        writeConsole(record);
        return record;
    }

    class Span {
        constructor(data, startMs) {
            this._data = data;
            this._startMs = startMs;
            this._ended = false;
        }

        get traceId() {
            return this._data.traceId;
        }

        get spanId() {
            return this._data.spanId;
        }

        get parentSpanId() {
            return this._data.parentSpanId;
        }

        get name() {
            return this._data.name;
        }

        get ended() {
            return this._ended;
        }

        setAttribute(key, value) {
            if (this._ended || key === undefined || key === null) return this;
            const attribute = normalizeAttributeValue(value);
            if (attribute !== undefined) this._data.attributes[String(key)] = attribute;
            return this;
        }

        setAttributes(attributes) {
            if (this._ended) return this;
            Object.assign(this._data.attributes, normalizeAttributes(attributes));
            return this;
        }

        addEvent(name, attributes) {
            if (this._ended) return this;
            this._data.events.push({
                name: String(name),
                timeUnixNano: toUnixNano(now()),
                attributes: normalizeAttributes(attributes),
            });
            return this;
        }

        recordException(error, attributes) {
            if (this._ended) return this;
            this.addEvent("exception", {
                ...errorToAttributes(error),
                ...normalizeAttributes(attributes),
            });
            const message = error instanceof Error ? error.message : String(error);
            return this.setStatus(SpanStatusCode.ERROR, message);
        }

        setStatus(code, message = "") {
            if (this._ended) return this;
            const normalized = String(code ?? SpanStatusCode.UNSET).toUpperCase();
            this._data.status = {
                code: Object.hasOwn(SpanStatusCode, normalized) ? normalized : SpanStatusCode.UNSET,
                message: message ? truncate(message) : "",
            };
            return this;
        }

        end(attributes) {
            if (this._ended) return this;
            if (attributes) this.setAttributes(attributes);

            const endMs = now();
            this._data.endTimeUnixNano = toUnixNano(endMs);
            this._data.durationMs = Math.max(0, endMs - this._startMs);
            this._ended = true;

            // Spans may end out of order (a scene span can outlive a child),
            // so remove this exact span instead of popping the stack.
            const index = activeSpans.indexOf(this);
            if (index !== -1) activeSpans.splice(index, 1);
            return this;
        }
    }

    function startSpan(name, attributes) {
        const parent = currentSpan();
        const startMs = now();
        const data = {
            type: "span",
            traceId: parent ? parent.traceId : randomHex(16),
            spanId: randomHex(8),
            parentSpanId: parent ? parent.spanId : null,
            name: String(name),
            startTimeUnixNano: toUnixNano(startMs),
            endTimeUnixNano: null,
            durationMs: null,
            attributes: normalizeAttributes(attributes),
            events: [],
            status: { code: SpanStatusCode.UNSET, message: "" },
        };

        spans.push(data);
        const span = new Span(data, startMs);
        activeSpans.push(span);
        return span;
    }

    function recordMetric(kind, name, value, attributes) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return null;

        const normalizedAttributes = normalizeAttributes(attributes);
        const key = `${kind}:${name}:${stableStringify(normalizedAttributes)}`;
        const timestamp = now();

        let series = metrics.get(key);
        if (!series) {
            if (metrics.size >= config.maxMetricSeries) {
                droppedMetricSeries++;
                return null;
            }
            series = {
                kind,
                name: String(name),
                attributes: normalizedAttributes,
                count: 0,
                sum: 0,
                min: Infinity,
                max: -Infinity,
                value: null,
                firstTimeUnixNano: toUnixNano(timestamp),
                lastTimeUnixNano: null,
            };
            metrics.set(key, series);
        }

        series.count++;
        series.sum += numeric;
        series.min = Math.min(series.min, numeric);
        series.max = Math.max(series.max, numeric);
        series.lastTimeUnixNano = toUnixNano(timestamp);
        if (kind === "counter") series.value = series.sum;
        if (kind === "gauge") series.value = numeric;

        return series;
    }

    /**
     * Bind context once and reuse it for logs, spans and metrics.
     * Extra attributes override bound ones, and scopes can be nested.
     */
    function withAttributes(attributes) {
        const bound = normalizeAttributes(attributes);
        const merge = (extra) => ({ ...bound, ...normalizeAttributes(extra) });

        return {
            get attributes() {
                return { ...bound };
            },
            log: (severity, body, extra) => emit(severity, body, merge(extra)),
            trace: (body, extra) => emit("TRACE", body, merge(extra)),
            debug: (body, extra) => emit("DEBUG", body, merge(extra)),
            info: (body, extra) => emit("INFO", body, merge(extra)),
            warn: (body, extra) => emit("WARN", body, merge(extra)),
            error: (body, extra) => emit("ERROR", body, merge(extra)),
            fatal: (body, extra) => emit("FATAL", body, merge(extra)),
            startSpan: (name, extra) => startSpan(name, merge(extra)),
            counter: (name, value = 1, extra) => recordMetric("counter", name, value, merge(extra)),
            histogram: (name, value, extra) => recordMetric("histogram", name, value, merge(extra)),
            gauge: (name, value, extra) => recordMetric("gauge", name, value, merge(extra)),
            withAttributes: (extra) => withAttributes(merge(extra)),
        };
    }

    function cloneSpan(data) {
        return {
            ...data,
            attributes: { ...data.attributes },
            events: data.events.map((event) => ({
                ...event,
                attributes: { ...event.attributes },
            })),
            status: { ...data.status },
        };
    }

    function cloneMetric(series) {
        return {
            ...series,
            attributes: { ...series.attributes },
        };
    }

    function getSnapshot() {
        const series = [...metrics.values()]
            .map(cloneMetric)
            .sort((a, b) => (
                a.name.localeCompare(b.name)
                || stableStringify(a.attributes).localeCompare(stableStringify(b.attributes))
            ));

        return {
            resource: { ...resource },
            generatedAt: new Date(now()).toISOString(),
            logs: logs.toArray().map((record) => ({
                ...record,
                attributes: { ...record.attributes },
            })),
            spans: spans.toArray().map(cloneSpan),
            metrics: {
                series,
                droppedSeries: droppedMetricSeries,
            },
            dropped: {
                logs: logs.dropped,
                spans: spans.dropped,
            },
            activeSpanIds: activeSpans.map((span) => span.spanId),
        };
    }

    function setConsoleMinSeverity(severity) {
        consoleMinSeverityNumber = normalizeSeverityNumber(severity);
        return consoleMinSeverityNumber;
    }

    function setConsoleEnabled(enabled) {
        consoleEnabled = Boolean(enabled);
        return consoleEnabled;
    }

    function endActiveSpans(status = SpanStatusCode.UNSET) {
        const open = [...activeSpans];
        open.forEach((span) => span.setStatus(status).end());
        return open.length;
    }

    function reset() {
        logs.clear();
        spans.clear();
        metrics.clear();
        activeSpans.length = 0;
        droppedMetricSeries = 0;
    }

    return {
        resource,
        log: emit,
        trace: (body, attributes) => emit("TRACE", body, attributes),
        debug: (body, attributes) => emit("DEBUG", body, attributes),
        info: (body, attributes) => emit("INFO", body, attributes),
        warn: (body, attributes) => emit("WARN", body, attributes),
        error: (body, attributes) => emit("ERROR", body, attributes),
        fatal: (body, attributes) => emit("FATAL", body, attributes),
        startSpan,
        currentSpan,
        counter: (name, value = 1, attributes) => recordMetric("counter", name, value, attributes),
        histogram: (name, value, attributes) => recordMetric("histogram", name, value, attributes),
        gauge: (name, value, attributes) => recordMetric("gauge", name, value, attributes),
        withAttributes,
        setConsoleMinSeverity,
        setConsoleEnabled,
        getSnapshot,
        endActiveSpans,
        reset,
    };
}

/**
 * Applies a URL flag to the console sink:
 *   ?telemetry=debug | trace | info | warn | error | off
 */
export function configureTelemetryFromSearch(search = "", instance = telemetry) {
    let params;
    try {
        params = new URLSearchParams(search);
    } catch {
        return;
    }

    const mode = (params.get("telemetry") || "").toLowerCase();
    if (!mode) return;

    if (mode === "off" || mode === "none") {
        instance.setConsoleEnabled(false);
        return;
    }

    const severity = mode === "debug" ? "DEBUG" : mode.toUpperCase();
    if (!Object.hasOwn(SeverityNumber, severity)) return;

    instance.setConsoleEnabled(true);
    instance.setConsoleMinSeverity(severity);
}

/**
 * Make the singleton reachable from DevTools without importing a module.
 * Returns a cleanup function for tests/HMR.
 */
export function exposeTelemetry(target = globalThis, instance = telemetry) {
    if (!target || typeof target !== "object") return () => {};
    target.__telemetry = instance;
    return () => {
        if (target.__telemetry === instance) delete target.__telemetry;
    };
}

// ---------------------------------------------------------------
// App singleton
// ---------------------------------------------------------------

export const telemetry = createTelemetry({
    serviceName: "gran-line-adventure",
    serviceVersion: "0.1.0",
    maxLogs: 500,
    maxSpans: 200,
    maxMetricSeries: 200,
    consoleMinSeverity: "INFO",
});
