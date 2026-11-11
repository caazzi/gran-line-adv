// ============================================
// Gran Line Adventure — Main Entry Point
// ============================================
import kaplay from "kaplay";
import { GAME } from "./config.js";
import { loadAssets } from "./utils/assets.js";
import { menuScene } from "./scenes/menu.js";
import { gameScene } from "./scenes/game.js";
import { gameOverScene } from "./scenes/gameOver.js";
import { cutsceneScene } from "./scenes/cutscene.js";
import { victoryScene } from "./scenes/victory.js";
import {
    telemetry,
    configureTelemetryFromSearch,
    exposeTelemetry,
    errorToAttributes,
} from "./systems/telemetry.js";

const APP_VERSION = "0.1.0";

configureTelemetryFromSearch(globalThis.location?.search ?? "");
exposeTelemetry();

const startupSpan = telemetry.startSpan("app.startup", { "app.version": APP_VERSION });
telemetry.info("Application starting", {
    "app.version": APP_VERSION,
    "vite.mode": import.meta.env?.MODE ?? "unknown",
});

// ---- Global error reporting ----
// Kaplay reports engine errors through k.onError; these listeners catch
// everything that escapes the game loop. Neither handler prevents the
// browser's default reporting, so DevTools still shows the original error.
const reportedErrors = new WeakSet();

function reportRuntimeError(error, source, attributes = {}) {
    // The same Error can reach both Kaplay and window.onerror.
    if (error && typeof error === "object") {
        if (reportedErrors.has(error)) return;
        reportedErrors.add(error);
    }

    telemetry.error("Uncaught runtime error", {
        "error.source": source,
        ...errorToAttributes(error),
        ...attributes,
    });
    telemetry.counter("app.errors", 1, { source });
}

if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
        // Ignore resource load events with no usable error payload.
        if (!event.error && !event.message) return;
        reportRuntimeError(event.error ?? event.message, "window.error", {
            "error.filename": event.filename ?? "",
            "error.lineno": event.lineno ?? 0,
            "error.colno": event.colno ?? 0,
        });
    });

    window.addEventListener("unhandledrejection", (event) => {
        reportRuntimeError(event.reason, "window.unhandledrejection");
    });
}

// Initialize Kaplay
let k;
try {
    k = kaplay({
        width: GAME.WIDTH,
        height: GAME.HEIGHT,
        letterbox: true,
        background: GAME.BACKGROUND,
        crisp: true,
        canvas: document.querySelector("canvas") || undefined,
        global: false,
        font: "Outfit", // Default font for normal text
    });
} catch (error) {
    startupSpan.recordException(error);
    telemetry.error("Kaplay initialization failed", errorToAttributes(error));
    startupSpan.end();
    throw error;
}

telemetry.info("Kaplay initialized", {
    "game.width": GAME.WIDTH,
    "game.height": GAME.HEIGHT,
});

// ---- Asset loading ----
// The startup trace covers boot + initial asset loading. onLoad fires once all
// queued assets settle; onLoadError records each failed asset without aborting.
const assetsSpan = telemetry.startSpan("assets.load");
let assetErrorCount = 0;
let assetsReported = false;
let assetTelemetryInstalled = false;

function reportAssetsLoaded() {
    if (assetsReported) return;
    assetsReported = true;

    telemetry.info("Assets loaded", { "assets.errors": assetErrorCount });
    telemetry.counter("assets.load", 1, {
        result: assetErrorCount === 0 ? "success" : "partial",
    });

    assetsSpan.setAttribute("assets.errors", assetErrorCount).end();
    startupSpan.setAttribute("assets.errors", assetErrorCount).end();
}

function reportAssetError(name, asset) {
    assetErrorCount++;

    const attributes = {
        "asset.name": name,
        "asset.src": asset?.src ?? "",
    };
    telemetry.error("Asset failed to load", attributes);
    telemetry.counter("assets.failures", 1, { "asset.name": name });
    assetsSpan.addEvent("asset.error", attributes);
    startupSpan.setAttribute("assets.errors", assetErrorCount);
}

/**
 * Kaplay clears all game/app event listeners on the frame after k.go(), so
 * registering these at module scope would silently drop them before assets
 * finish. Install them after the first scene switch instead. Both onLoad and
 * onLoadError call back immediately when assets have already settled.
 */
function installEngineTelemetry() {
    if (!assetTelemetryInstalled) {
        assetTelemetryInstalled = true;
        k.onLoad(reportAssetsLoaded);
        k.onLoadError(reportAssetError);
    }

    // App-level listeners are cleared on every scene switch, so re-register
    // this one each time the first scene of a transition starts.
    k.onError((err) => {
        reportRuntimeError(err, "kaplay.onError");
    });
}

// Load all external assets
loadAssets(k);

/**
 * Wrap a scene factory so every scene gets one span for its lifetime and any
 * setup failure is recorded instead of disappearing into Kaplay's error screen.
 */
function instrumentScene(name, factory) {
    const scene = factory(k);

    return (...args) => {
        // Scene entry runs after Kaplay cleared the previous scene's listeners.
        installEngineTelemetry();

        const span = telemetry.startSpan(`scene.${name}`, { "scene.name": name });
        telemetry.info("Scene entered", { "scene.name": name });

        try {
            scene(...args);
        } catch (error) {
            span.recordException(error);
            telemetry.error("Scene setup failed", {
                "scene.name": name,
                ...errorToAttributes(error),
            });
            span.end();
            throw error;
        }

        // Registered after the scene body so scene-specific cleanup and logs
        // run while the scene span is still active.
        k.onSceneLeave((nextScene) => {
            const next = nextScene ?? "none";
            telemetry.info("Scene left", { "scene.name": name, "scene.next": next });
            span.setAttribute("scene.next", next).end();
        });
    };
}

// Register scenes
k.scene("menu", instrumentScene("menu", menuScene));
k.scene("game", instrumentScene("game", gameScene));
k.scene("gameOver", instrumentScene("gameOver", gameOverScene));
k.scene("cutscene", instrumentScene("cutscene", cutsceneScene));
k.scene("victory", instrumentScene("victory", victoryScene));

// Start at menu
k.go("menu");
telemetry.info("Bootstrap complete", { "scene.initial": "menu" });
