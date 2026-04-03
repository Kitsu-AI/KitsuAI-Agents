export class SigningEngine {
  private keyPair: CryptoKeyPair | null = null
  private readonly algorithm = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256" as const,
  }

  constructor() {}

  private async ensureKeys(): Promise<CryptoKeyPair> {
    if (!this.keyPair) {
      this.keyPair = await crypto.subtle.generateKey(this.algorithm, true, ["sign", "verify"])
    }
    return this.keyPair
  }

  async sign(data: string): Promise<string> {
    const keyPair = await this.ensureKeys()
    const enc = new TextEncoder().encode(data)
    const sig = await crypto.subtle.sign(this.algorithm.name, keyPair.privateKey, enc)
    return Buffer.from(sig).toString("base64")
  }

  async verify(data: string, signature: string): Promise<boolean> {
    const keyPair = await this.ensureKeys()
    const enc = new TextEncoder().encode(data)
    const sig = Buffer.from(signature, "base64")
    return crypto.subtle.verify(this.algorithm.name, keyPair.publicKey, sig, enc)
  }

  async exportPublicKey(): Promise<string> {
    const keyPair = await this.ensureKeys()
    const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey)
    return Buffer.from(spki).toString("base64")
  }

  async exportPrivateKey(): Promise<string> {
    const keyPair = await this.ensureKeys()
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
    return Buffer.from(pkcs8).toString("base64")
  }

  async importPublicKey(spkiBase64: string): Promise<void> {
    const spki = Buffer.from(spkiBase64, "base64")
    const pubKey = await crypto.subtle.importKey("spki", spki, this.algorithm, true, ["verify"])
    if (this.keyPair) {
      this.keyPair = { ...this.keyPair, publicKey: pubKey }
    } else {
      this.keyPair = { publicKey: pubKey, privateKey: null as any }
    }
  }

  async importPrivateKey(pkcs8Base64: string): Promise<void> {
    const pkcs8 = Buffer.from(pkcs8Base64, "base64")
    const privKey = await crypto.subtle.importKey("pkcs8", pkcs8, this.algorithm, true, ["sign"])
    if (this.keyPair) {
      this.keyPair = { ...this.keyPair, privateKey: privKey }
    } else {
      this.keyPair = { publicKey: null as any, privateKey: privKey }
    }
  }
}
