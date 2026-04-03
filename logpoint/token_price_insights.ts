export interface PricePoint {
  timestamp: number
  price: number
}

export interface TokenMetrics {
  averagePrice: number
  volatility: number
  maxPrice: number
  minPrice: number
  priceRange?: number
  coefficientOfVariation?: number
}

export class TokenAnalysisCalculator {
  constructor(private data: PricePoint[]) {}

  getAveragePrice(): number {
    if (this.data.length === 0) return 0
    const sum = this.data.reduce((acc, p) => acc + p.price, 0)
    return sum / this.data.length
  }

  getVolatility(): number {
    const avg = this.getAveragePrice()
    const variance =
      this.data.reduce((acc, p) => acc + (p.price - avg) ** 2, 0) /
      (this.data.length || 1)
    return Math.sqrt(variance)
  }

  getMaxPrice(): number {
    return this.data.reduce((max, p) => (p.price > max ? p.price : max), 0)
  }

  getMinPrice(): number {
    return this.data.reduce((min, p) => (p.price < min ? p.price : min), Infinity)
  }

  getPriceRange(): number {
    return this.getMaxPrice() - this.getMinPrice()
  }

  getCoefficientOfVariation(): number {
    const avg = this.getAveragePrice()
    return avg !== 0 ? this.getVolatility() / avg : 0
  }

  computeMetrics(): TokenMetrics {
    const avg = this.getAveragePrice()
    const vol = this.getVolatility()
    const max = this.getMaxPrice()
    const min = this.getMinPrice()
    return {
      averagePrice: avg,
      volatility: vol,
      maxPrice: max,
      minPrice: min,
      priceRange: max - min,
      coefficientOfVariation: avg !== 0 ? vol / avg : 0,
    }
  }
}
