// Phase 0 spike probe — verifies the OMP SDK constructs in-process under Bun.
// Makes NO LLM calls (no spend): init settings/auth/registry, resolve model,
// create session with in-memory persistence, subscribe, abort, dispose.
import {
	createAgentSession,
	discoverAuthStorage,
	SessionManager,
	Settings,
} from "@oh-my-pi/pi-coding-agent";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { resolveCliModel } from "@oh-my-pi/pi-coding-agent/config/model-resolver";

const cwd = process.cwd();
console.log("cwd:", cwd);

const settings = await Settings.init({ cwd });
console.log("settings_ok");

const authStorage = await discoverAuthStorage();
console.log("authStorage_ok");

const modelRegistry = new ModelRegistry(authStorage);
await modelRegistry.refresh();
const all = modelRegistry.getAll();
const available = modelRegistry.getAvailable();
console.log("models_total:", all.length);
console.log("models_available:", available.length);
console.log(
	"available_sample:",
	available.slice(0, 5).map(m => `${m.provider}/${m.id}`),
);

const selector = process.env.SPIKE_MODEL || "opencode-go/deepseek-v4-pro";
const resolved = resolveCliModel({ cliModel: selector, modelRegistry, settings });
console.log(
	"resolved:",
	resolved.model ? `${resolved.model.provider}/${resolved.model.id}` : (resolved.error ?? "none"),
);

const { session } = await createAgentSession({
	cwd,
	settings,
	authStorage,
	modelRegistry,
	...(resolved?.model ? { model: resolved.model } : {}),
	sessionManager: SessionManager.inMemory(cwd),
	disableExtensionDiscovery: true,
	enableMCP: false,
	hasUI: false,
	autoApprove: true,
});
console.log("session_created:", !!session);
console.log(
	"session_model:",
	session.model ? `${session.model.provider}/${session.model.id}` : "session-default",
);

const seen: string[] = [];
const unsub = session.subscribe(e => {
	if (seen.length < 5) seen.push(e.type);
});
unsub();
console.log("subscribe_ok");

await session.abort();
console.log("abort_ok");
await session.dispose();
console.log("dispose_ok");
console.log("SPIKE_PROBE_PASS");
