export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canTrackWhales?: boolean
  canDetectAnomalies?: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  strictMode?: boolean
  allowExperimental?: boolean
}

/** Solana-focused agent capabilities */
export const SOLANA_AGENT_CAPABILITIES: AgentCapabilities = {
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
  canTrackWhales: true,
  canDetectAnomalies: false,
}

/** Solana agent runtime flags */
export const SOLANA_AGENT_FLAGS: AgentFlags = {
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
  strictMode: true,
  allowExperimental: false,
}

/** Generic helpers */

export function hasCapability(
  caps: AgentCapabilities,
  key: keyof AgentCapabilities
): boolean {
  return !!caps[key]
}

export function isFlagEnabled(
  flags: AgentFlags,
  key: keyof AgentFlags
): boolean {
  return !!flags[key]
}

export function summarizeAgent(
  caps: AgentCapabilities,
  flags: AgentFlags
): string {
  const capKeys = Object.keys(caps).filter(k => (caps as any)[k])
  const flagKeys = Object.keys(flags).filter(k => (flags as any)[k])
  return `Capabilities: ${capKeys.join(", ")} | Flags: ${flagKeys.join(", ")}`
}
