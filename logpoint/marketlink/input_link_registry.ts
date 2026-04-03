export interface InputLink {
  id: string
  source: string
  url: string
  metadata?: Record<string, unknown>
  createdAt?: number
  updatedAt?: number
}

export interface InputLinkResult {
  success: boolean
  link?: InputLink
  error?: string
}

/**
 * Manages registration and retrieval of input links with extended utilities
 */
export class InputLinkHandler {
  private readonly links = new Map<string, InputLink>()

  /** Register a new link (fails if ID already exists) */
  register(link: InputLink): InputLinkResult {
    if (this.links.has(link.id)) {
      return { success: false, error: `Link with id "${link.id}" already exists.` }
    }
    const now = Date.now()
    const newLink: InputLink = { ...link, createdAt: now, updatedAt: now }
    this.links.set(link.id, newLink)
    return { success: true, link: newLink }
  }

  /** Update an existing link */
  update(id: string, patch: Partial<InputLink>): InputLinkResult {
    const existing = this.links.get(id)
    if (!existing) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    const updated = { ...existing, ...patch, updatedAt: Date.now() }
    this.links.set(id, updated)
    return { success: true, link: updated }
  }

  /** Retrieve a link by ID */
  get(id: string): InputLinkResult {
    const link = this.links.get(id)
    if (!link) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    return { success: true, link }
  }

  /** List all links as an array */
  list(): InputLink[] {
    return Array.from(this.links.values())
  }

  /** Find all links from a specific source */
  findBySource(source: string): InputLink[] {
    return this.list().filter(l => l.source === source)
  }

  /** Search links by URL substring */
  searchByUrl(query: string): InputLink[] {
    return this.list().filter(l => l.url.includes(query))
  }

  /** Check if a link exists */
  has(id: string): boolean {
    return this.links.has(id)
  }

  /** Count number of stored links */
  count(): number {
    return this.links.size
  }

  /** Remove a single link by ID */
  unregister(id: string): boolean {
    return this.links.delete(id)
  }

  /** Remove all links */
  clear(): void {
    this.links.clear()
  }

  /** Export links to JSON */
  export(): string {
    return JSON.stringify(this.list())
  }

  /** Import links from JSON */
  import(json: string): void {
    try {
      const links: InputLink[] = JSON.parse(json)
      links.forEach(l => this.links.set(l.id, { ...l, updatedAt: Date.now() }))
    } catch {
      // ignore invalid JSON
    }
  }
}
