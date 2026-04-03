import React from "react"
import SentimentGauge from "./sentiment_gauge"
import AssetOverviewPanel from "./asset_overview_panel"
import WhaleTrackerCard from "./whale_tracker_card"

export const AnalyticsDashboard: React.FC = () => (
  <div className="p-8 bg-gray-100 min-h-screen">
    <h1 className="text-4xl font-bold mb-6">Analytics Dashboard</h1>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SentimentGauge symbol="SOL" />
      <AssetOverviewPanel assetId="SOL-01" />
      <WhaleTrackerCard />
    </div>
  </div>
)

export default AnalyticsDashboard
