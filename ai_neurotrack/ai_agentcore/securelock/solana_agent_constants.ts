/** Stable identifier for the Solana Knowledge Agent */
export const SOLANA_KNOWLEDGE_AGENT_ID = "solana-knowledge-agent" as const

/** Human-readable name */
export const SOLANA_KNOWLEDGE_AGENT_NAME = "Solana Knowledge Agent" as const

/** Versioning for tracking updates */
export const SOLANA_KNOWLEDGE_AGENT_VERSION = "1.0.0" as const

/** Full descriptor for registration or discovery */
export const SOLANA_KNOWLEDGE_AGENT_DESCRIPTOR = {
  id: SOLANA_KNOWLEDGE_AGENT_ID,
  name: SOLANA_KNOWLEDGE_AGENT_NAME,
  version: SOLANA_KNOWLEDGE_AGENT_VERSION,
}
