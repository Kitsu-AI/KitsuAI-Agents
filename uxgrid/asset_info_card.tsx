import React, { useEffect, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
  marketCapUsd?: number
  volume24hUsd?: number
}

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({ assetId }) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchInfo() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/assets/${assetId}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch asset ${assetId}: ${res.status}`)
        }
        const json = await res.json()
        setInfo(json)
      } catch (err: any) {
        setError(err.message ?? String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchInfo()
  }, [assetId])

  if (loading) return <div className="p-4">Loading asset overview...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!info) return <div className="p-4">No asset data found.</div>

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Asset Overview</h2>
      <p><strong>ID:</strong> {assetId}</p>
      <p><strong>Name:</strong> {info.name}</p>
      <p><strong>Price (USD):</strong> ${info.priceUsd.toFixed(2)}</p>
      <p><strong>Circulating Supply:</strong> {info.supply.toLocaleString()}</p>
      <p><strong>Holders:</strong> {info.holders.toLocaleString()}</p>
      {info.marketCapUsd !== undefined && (
        <p><strong>Market Cap:</strong> ${info.marketCapUsd.toLocaleString()}</p>
      )}
      {info.volume24hUsd !== undefined && (
        <p><strong>24h Volume:</strong> ${info.volume24hUsd.toLocaleString()}</p>
      )}
    </div>
  )
}

export default AssetOverviewPanel
