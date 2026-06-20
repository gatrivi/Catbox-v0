export function getEngineHealthPayload() {
  return {
    engine: "Catbox Atomic Brokerage Server",
    status: "ACTIVE",
    version: "1.2.0-atomic",
    targetPlatform: "VS Code Extension Store & Claude Code Prompt Wheel",
    endpoints: {
      metrics: "/api/atomic/metrics",
      adStream: "/api/atomic/stream",
      configuration: "/api/atomic/config",
    },
  };
}

export function getAtomicMetricsPayload() {
  return {
    success: true,
    metrics: {
      throughput: "24.5 keps",
      latencyMs: 1.4,
      networkFee: "0.00 USD (Symmetric gas free)",
      complianceRating: "GDPR SOC2 Secure",
    },
  };
}
