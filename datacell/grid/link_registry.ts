export interface InputLink {
  id: string
  source: string
  url: string
  metadata?: Record<string, any>
}

export interface InputLinkResult {
  success: boolean
  link?: InputLink
  error?: string
}

export class InputLinkHandler {
  private readonly links = new Map<string, InputLink>()

  /** Register a new link by ID */
  register(link: InputLink): InputLinkResult {
    if (this.links.has(link.id)) {
      return { success: false, error: `Link with id "${link.id}" already exists` }
    }
    this.links.set(link.id, link)
    return { success: true, link }
  }

  /** Get a link by ID */
  get(id: string): InputLinkResult {
    const link = this.links.get(id)
    if (!link) {
      return { success: false, error: `No link found for id "${id}"` }
    }
    return { success: true, link }
  }

  /** Return all stored links */
  list(): InputLink[] {
    return [...this.links.values()]
  }

  /** Remove a link by ID */
  unregister(id: string): boolean {
    return this.links.delete(id)
  }

  /** Update metadata or properties of a link */
  update(id: string, updates: Partial<Omit<InputLink, "id">>): InputLinkResult {
    const existing = this.links.get(id)
    if (!existing) {
      return { success: false, error: `No link found for id "${id}"` }
    }
    const updated: InputLink = { ...existing, ...updates }
    this.links.set(id, updated)
    return { success: true, link: updated }
  }

  /** Check if a link exists */
  exists(id: string): boolean {
    return this.links.has(id)
  }

  /** Clear all links */
  clear(): void {
    this.links.clear()
  }
}
