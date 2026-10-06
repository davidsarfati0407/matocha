import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/mcp/route";
import { setupEnv, token } from "./helpers";

const rpc = (body: unknown, bearer?: string) =>
  POST(
    new Request("https://matocha.test/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => setupEnv());

describe("MCP", () => {
  it("initializes and lists tools mirroring the Ops API", async () => {
    const init = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })).json();
    expect(init.result.serverInfo.name).toBe("matocha-ops");
    const list = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
    const names = list.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("catalog_get");
    expect(names).toContain("settings_mode_propose");
    const write = list.result.tools.find((t: { name: string }) => t.name === "catalog_pack_price");
    expect(write.inputSchema.required).toContain("idempotency_key");
  });

  it("enforces the same auth and scopes", async () => {
    const anon = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "catalog_get", arguments: {} } })).json();
    expect(anon.result.isError).toBe(true);
    const { token: t } = await token(["catalog:read"]);
    const ok = await (
      await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "catalog_get", arguments: {} } }, t)
    ).json();
    expect(ok.result.isError).toBe(false);
    const denied = await (
      await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "leads_list", arguments: {} } }, t)
    ).json();
    expect(denied.result.structuredContent.status).toBe(403);
  });

  it("requires idempotency_key on write tools", async () => {
    const { token: t } = await token(["catalog:write"]);
    const res = await (
      await rpc(
        { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "catalog_pack_price", arguments: { id: "poudre-decouverte", price: 9 } } },
        t,
      )
    ).json();
    expect(res.result.structuredContent.status).toBe(400);
  });
});
