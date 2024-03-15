export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("register instrumentation for nodejs");
    const agent = await import("~/server/core/agent");
    await agent.init();
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("register instrumentation for edge");
  }
}
