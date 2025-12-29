"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import type { AnalysisResult } from '@/lib/api-client'

interface AnalysisPieChartProps {
  analysisResult: AnalysisResult
}

// Color palette for different conditions with medical context
const getConditionColor = (condition: string, severity: string): string => {
  const conditionLower = condition.toLowerCase()
  
  // High-risk conditions (reds)
  if (conditionLower.includes('melanoma') || conditionLower.includes('carcinoma') || conditionLower.includes('cancer')) {
    return '#ef4444' // red-500
  }
  
  // Moderate-risk conditions (oranges/yellows)
  if (conditionLower.includes('eczema') || conditionLower.includes('psoriasis') || conditionLower.includes('dermatitis')) {
    return '#f97316' // orange-500
  }
  
  // Infectious conditions (amber)
  if (conditionLower.includes('fungal') || conditionLower.includes('infection')) {
    return '#f59e0b' // amber-500
  }
  
  // Common conditions (blue)
  if (conditionLower.includes('acne') || conditionLower.includes('rash')) {
    return '#3b82f6' // blue-500
  }
  
  // Healthy/normal (green)
  if (conditionLower.includes('healthy') || conditionLower.includes('normal')) {
    return '#10b981' // emerald-500
  }
  
  // Benign conditions (teal)
  if (conditionLower.includes('keratosis') || conditionLower.includes('benign')) {
    return '#14b8a6' // teal-500
  }
  
  // Default based on severity
  switch (severity) {
    case 'severe': return '#dc2626' // red-600
    case 'moderate': return '#ea580c' // orange-600
    case 'mild': return '#059669' // emerald-600
    default: return '#6b7280' // gray-500
  }
}

const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'moderate':
      return <AlertCircle className="w-4 h-4 text-orange-500" />
    case 'low':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />
  }
}

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200'
    case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'low': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground mb-2">{data.category}</p>
        <p className="text-primary font-medium">{(data.value * 100).toFixed(1)}% confidence</p>
        <p className="text-xs text-muted-foreground mt-1">
          Severity: <span className="capitalize">{data.severity}</span>
        </p>
      </div>
    )
  }
  return null
}

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.value} ({(entry.payload.value * 100).toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalysisPieChart({ analysisResult }: AnalysisPieChartProps) {
  // Prepare data for the pie chart
  const chartData = analysisResult.predictions.slice(0, 5).map((prediction) => ({
    name: prediction.condition,
    value: prediction.confidence,
    severity: prediction.severity,
    category: prediction.category,
    requiresAttention: prediction.requiresAttention,
    description: prediction.description,
    color: getConditionColor(prediction.condition, prediction.severity)
  }))

  // Get the top prediction for highlighting
  const topPrediction = analysisResult.predictions[0]

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 border-border/50 shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Condition Probability Analysis</h3>
          <p className="text-muted-foreground">
            Visual breakdown of potential skin conditions detected by BiomedCLIP AI
          </p>
        </div>

        {/* Risk Level Badge */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={`px-4 py-2 text-sm font-semibold border-2 ${getRiskColor(analysisResult.riskLevel)}`}
          >
            <div className="flex items-center gap-2">
              {getRiskIcon(analysisResult.riskLevel)}
              <span className="capitalize">{analysisResult.riskLevel} Risk Level</span>
            </div>
          </Badge>
        </div>

        {/* Pie Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={index === 0 ? '#ffffff' : 'transparent'}
                    strokeWidth={index === 0 ? 3 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Prediction Highlight */}
        {topPrediction && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
            <div className="text-center space-y-3">
              <h4 className="text-lg font-semibold text-foreground">Most Likely Condition</h4>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">{topPrediction.condition}</p>
                <p className="text-lg text-muted-foreground">
                  {(topPrediction.confidence * 100).toFixed(1)}% confidence
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {topPrediction.severity} severity
                  </Badge>
                  <Badge variant="outline">
                    {topPrediction.category}
                  </Badge>
                  {topPrediction.requiresAttention && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Requires Attention
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground text-center">Detailed Analysis</h4>
          <div className="space-y-2">
            {analysisResult.predictions.slice(0, 5).map((prediction, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  index === 0 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'bg-muted/20 border-border/50 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: getConditionColor(prediction.condition, prediction.severity) }}
                  />
                  <div>
                    <p className={`font-medium ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                      {prediction.condition}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {prediction.severity} • {prediction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                    {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                  {prediction.requiresAttention && (
                    <AlertTriangle className="w-3 h-3 text-orange-500 ml-auto mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Info */}
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Analysis completed using <span className="font-semibold text-primary">{analysisResult.processingInfo.modelUsed}</span> 
            {' '}in {analysisResult.processingInfo.processingTime}ms
          </p>
          {analysisResult.processingInfo.symptomsIncluded && (
            <p className="text-xs text-muted-foreground mt-1">
              ✓ Symptom information was included in the analysis
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}