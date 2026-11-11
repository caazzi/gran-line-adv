import { describe, it, expect, vi } from "vitest";
import {
    createTelemetry,
    configureTelemetryFromSearch,
    errorToAttributes,
    exposeTelemetry,
    SeverityNumber,
    SpanStatusCode,
} from "./telemetry.js";

function makeTelemetry(overrides = {}) {
    let time = 1000;
    let id = 0;

    const consoleSink = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
    };

    const telemetry = createTelemetry({
        serviceName: "test-service",
        serviceVersion: "9.9.9",
        now: () => {
            time += 10;
            return time;
        },
        randomHex: (bytes) => (++id).toString(16).padStart(bytes * 2, "0"),
        consoleSink,
        consoleMinSeverity: "INFO",
        maxLogs: 50,
        maxSpans: 50,
        ...overrides,
    });

    return { telemetry, consoleSink };
}

describe("telemetry", () => {
    it("records OTel-shaped logs and attaches the active span context", () => {
        const { telemetry } = makeTelemetry();

        telemetry.info("starting", { "app.version": "0.1.0" });

        const first = telemetry.getSnapshot().logs[0];
        expect(first).toMatchObject({
            type: "log",
            severityNumber: SeverityNumber.INFO,
            severityText: "INFO",
            body: "starting",
            attributes: { "app.version": "0.1.0" },
            traceId: null,
            spanId: null,
        });
        expect(first.timeUnixNano).toBeTypeOf("string");

        const span = telemetry.startSpan("scene.game", { "scene.name": "game" });
        telemetry.warn("low lives", { "player.lives": 1 });

        const second = telemetry.getSnapshot().logs[1];
        expect(second.severityText).toBe("WARN");
        expect(second.traceId).toBe(span.traceId);
        expect(second.spanId).toBe(span.spanId);
        expect(span.traceId).toHaveLength(32);
        expect(span.spanId).toHaveLength(16);

        // Ending the span stops attaching its context to new logs.
        span.end();
        telemetry.debug("outside");
        expect(telemetry.getSnapshot().logs[2].traceId).toBeNull();
    });

    it("nests spans with a shared trace id and records events/status", () => {
        const { telemetry } = makeTelemetry();

        const parent = telemetry.startSpan("run", { "game.level.id": 1 });
        const child = telemetry.startSpan("boss", { "boss.name": "Miss Love Duck" });

        child.addEvent("phase", { "boss.phase": "enrage" });
        child.setAttribute("boss.hp", 0);
        child.setStatus(SpanStatusCode.OK).end({ "boss.defeated": true });

        expect(child.ended).toBe(true);
        expect(telemetry.currentSpan()).toBe(parent);

        parent.end();

        const [parentData, childData] = telemetry.getSnapshot().spans;
        expect(childData.traceId).toBe(parentData.traceId);
        expect(childData.parentSpanId).toBe(parent.spanId);
        expect(childData.parentSpanId).not.toBeNull();
        expect(childData.durationMs).toBeGreaterThanOrEqual(0);
        expect(childData.events[0]).toMatchObject({
            name: "phase",
            attributes: { "boss.phase": "enrage" },
        });
        expect(childData.status).toEqual({ code: "OK", message: "" });
        expect(childData.attributes["boss.defeated"]).toBe(true);
        expect(childData.attributes["boss.hp"]).toBe(0);
        expect(telemetry.getSnapshot().activeSpanIds).toEqual([]);
    });

    it("keeps the active stack correct when spans end out of order", () => {
        const { telemetry } = makeTelemetry();

        const parent = telemetry.startSpan("parent");
        const child = telemetry.startSpan("child");

        parent.end();
        expect(telemetry.currentSpan()).toBe(child);

        child.end();
        const childData = telemetry.getSnapshot().spans.find((span) => span.name === "child");
        const duration = childData.durationMs;
        child.end();
        child.setAttribute("late", true);

        const after = telemetry.getSnapshot().spans.find((span) => span.name === "child");
        expect(after.durationMs).toBe(duration);
        expect(after.attributes).not.toHaveProperty("late");
        expect(child.parentSpanId).toBe(parent.spanId);
    });

    it("records exceptions as events and ERROR status", () => {
        const { telemetry } = makeTelemetry();
        const span = telemetry.startSpan("boom");

        span.recordException(new TypeError("bad thing"), { "code.line": 42 });
        span.end();

        const [data] = telemetry.getSnapshot().spans;
        expect(data.status).toEqual({ code: "ERROR", message: "bad thing" });
        expect(data.events[0].name).toBe("exception");
        expect(data.events[0].attributes).toMatchObject({
            "exception.type": "TypeError",
            "exception.message": "bad thing",
            "code.line": 42,
        });
        expect(data.events[0].attributes["exception.stack"]).toContain("TypeError");

        expect(errorToAttributes("oops")).toEqual({
            "exception.type": "string",
            "exception.message": "oops",
        });

        const circular = {};
        circular.self = circular;
        expect(errorToAttributes(circular)["exception.message"]).toBe(String(circular));
    });

    it("binds attributes once for nested scopes of logs, spans and metrics", () => {
        const { telemetry } = makeTelemetry();
        const level = telemetry.withAttributes({ "game.level.id": 2 });
        const boss = level.withAttributes({ "boss.name": "Smoker" });

        level.info("paused", { "game.score": 10 });
        const span = boss.startSpan("game.boss", { "boss.hp": 35 });
        boss.debug("phase", { "boss.phase": "enrage" });
        span.end();
        level.counter("events", 1, { kind: "pause" });

        const snapshot = telemetry.getSnapshot();
        expect(snapshot.logs[0].attributes).toEqual({
            "game.level.id": 2,
            "game.score": 10,
        });
        expect(snapshot.logs[1].attributes).toEqual({
            "game.level.id": 2,
            "boss.name": "Smoker",
            "boss.phase": "enrage",
        });
        expect(snapshot.spans[0].attributes).toEqual({
            "game.level.id": 2,
            "boss.name": "Smoker",
            "boss.hp": 35,
        });
        expect(snapshot.metrics.series[0].attributes).toEqual({
            "game.level.id": 2,
            "kind": "pause",
        });
        expect(level.attributes).toEqual({ "game.level.id": 2 });
    });

    it("drops the oldest records when ring buffers are full", () => {
        const { telemetry } = makeTelemetry({ maxLogs: 2, maxSpans: 1, maxMetricSeries: 1 });

        telemetry.info("one");
        telemetry.info("two");
        telemetry.info("three");

        const a = telemetry.startSpan("a");
        const b = telemetry.startSpan("b");
        a.end();
        b.end();

        telemetry.counter("first", 1);
        telemetry.counter("second", 1);

        const snapshot = telemetry.getSnapshot();
        expect(snapshot.logs.map((log) => log.body)).toEqual(["two", "three"]);
        expect(snapshot.spans.map((span) => span.name)).toEqual(["b"]);
        expect(snapshot.metrics.series).toHaveLength(1);
        expect(snapshot.dropped).toEqual({ logs: 1, spans: 1 });
        expect(snapshot.metrics.droppedSeries).toBe(1);
    });

    it("aggregates counters, histograms and gauges by name and attributes", () => {
        const { telemetry } = makeTelemetry();

        telemetry.counter("shots", 1, { weapon: "gaon" });
        telemetry.counter("shots", 2, { weapon: "gaon" });
        telemetry.counter("shots", 1, { weapon: "haki" });
        telemetry.counter("shots", 1, { weapon: "gaon", level: 2 });
        // Attribute order must not create a duplicate series.
        telemetry.counter("shots", 1, { level: 2, weapon: "gaon" });

        telemetry.histogram("load_ms", 10);
        telemetry.histogram("load_ms", 30);

        telemetry.gauge("lives", 5);
        telemetry.gauge("lives", 3);

        const series = telemetry.getSnapshot().metrics.series;

        const gaon = series.find((entry) => (
            entry.name === "shots"
            && entry.attributes.weapon === "gaon"
            && !("level" in entry.attributes)
        ));
        expect(gaon).toMatchObject({ kind: "counter", count: 2, sum: 3, value: 3, min: 1, max: 2 });

        const leveled = series.find((entry) => entry.name === "shots" && entry.attributes.level === 2);
        expect(leveled).toMatchObject({ count: 2, sum: 2, value: 2 });

        const histogram = series.find((entry) => entry.name === "load_ms");
        expect(histogram).toMatchObject({
            kind: "histogram",
            count: 2,
            sum: 40,
            min: 10,
            max: 30,
        });

        const gauge = series.find((entry) => entry.name === "lives");
        expect(gauge).toMatchObject({ kind: "gauge", count: 2, value: 3, min: 3, max: 5 });
    });

    it("filters the console sink by severity and can be disabled", () => {
        const { telemetry, consoleSink } = makeTelemetry();

        telemetry.debug("hidden");
        telemetry.info("shown", { "game.level.id": 1 });
        telemetry.warn("careful");
        telemetry.error("broken");

        expect(consoleSink.debug).not.toHaveBeenCalled();
        expect(consoleSink.info).toHaveBeenCalledTimes(1);
        expect(consoleSink.info.mock.calls[0][0]).toContain("[INFO] shown");
        expect(consoleSink.info.mock.calls[0][0]).toContain('{"game.level.id":1}');
        expect(consoleSink.warn).toHaveBeenCalledTimes(1);
        expect(consoleSink.error).toHaveBeenCalledTimes(1);

        telemetry.setConsoleMinSeverity("DEBUG");
        telemetry.debug("now visible");
        expect(consoleSink.debug).toHaveBeenCalledTimes(1);

        telemetry.setConsoleEnabled(false);
        telemetry.fatal("silent");
        expect(consoleSink.error).toHaveBeenCalledTimes(1);
    });

    it("configures the console from the URL flag and exposes the singleton", () => {
        const { telemetry, consoleSink } = makeTelemetry();

        configureTelemetryFromSearch("?telemetry=debug", telemetry);
        telemetry.debug("visible");
        expect(consoleSink.debug).toHaveBeenCalledTimes(1);

        configureTelemetryFromSearch("?telemetry=off", telemetry);
        telemetry.error("hidden");
        expect(consoleSink.error).not.toHaveBeenCalled();

        configureTelemetryFromSearch("?telemetry=warn", telemetry);
        telemetry.info("no");
        telemetry.warn("yes");
        expect(consoleSink.info).not.toHaveBeenCalled();
        expect(consoleSink.warn).toHaveBeenCalledTimes(1);

        const target = {};
        const cleanup = exposeTelemetry(target, telemetry);
        expect(target.__telemetry).toBe(telemetry);
        cleanup();
        expect(target.__telemetry).toBeUndefined();
    });

    it("can end active spans and reset all buffers", () => {
        const { telemetry } = makeTelemetry();
        const span = telemetry.startSpan("open");

        telemetry.info("inside");
        telemetry.counter("runs", 1);
        expect(telemetry.getSnapshot().activeSpanIds).toEqual([span.spanId]);

        expect(telemetry.endActiveSpans("ERROR")).toBe(1);
        expect(telemetry.getSnapshot().spans[0].status.code).toBe("ERROR");

        telemetry.reset();
        const snapshot = telemetry.getSnapshot();
        expect(snapshot.logs).toEqual([]);
        expect(snapshot.spans).toEqual([]);
        expect(snapshot.metrics.series).toEqual([]);
        expect(snapshot.dropped).toEqual({ logs: 0, spans: 0 });
        expect(snapshot.activeSpanIds).toEqual([]);
    });
});
