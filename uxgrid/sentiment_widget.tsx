import React from "react"

interface MarketSentimentWidgetProps {
  sentimentScore: number // value from 0 to 100
  trend: "Bullish" | "Bearish" | "Neutral"
  dominantToken: string
  totalVolume24h: number
  updatedAt?: string
}

const getSentimentColor = (score: number) => {
  if (score >= 70) return "#4caf50"
  if (score >= 40) return "#ff9800"
  return "#f44336"
}

export const MarketSentimentWidget: React.FC<MarketSentimentWidgetProps> = ({
  sentimentScore,
  trend,
  dominantToken,
  totalVolume24h,
  updatedAt
}) => {
  return (
    <div className="p-4 bg-white rounded shadow market-sentiment-widget">
      <h3 className="text-lg font-semibold mb-2">Market Sentiment</h3>
      <div className="flex items-center gap-4 sentiment-info">
        <div
          className="flex items-center justify-center rounded-full text-white font-bold w-16 h-16 score-circle"
          style={{ backgroundColor: getSentimentColor(sentimentScore) }}
        >
          {sentimentScore}%
        </div>
        <ul className="sentiment-details text-sm">
          <li>
            <strong>Trend:</strong> {trend}
          </li>
          <li>
            <strong>Dominant Token:</strong> {dominantToken}
          </li>
          <li>
            <strong>24h Volume:</strong> ${totalVolume24h.toLocaleString()}
          </li>
          {updatedAt && (
            <li>
              <strong>Updated:</strong> {updatedAt}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default MarketSentimentWidget
