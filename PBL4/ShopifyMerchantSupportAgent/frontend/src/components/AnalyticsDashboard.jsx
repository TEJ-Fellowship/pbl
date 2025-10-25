import React, { useState, useEffect } from "react";
import "./AnalyticsDashboard.css";

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    merchantSegment: "",
    intent: "",
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) queryParams.append("dateTo", filters.dateTo);
      if (filters.merchantSegment)
        queryParams.append("merchantSegment", filters.merchantSegment);
      if (filters.intent) queryParams.append("intent", filters.intent);

      console.log("Fetching analytics with filters:", filters);
      console.log("Query params:", queryParams.toString());

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`);

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Analytics data received:", data);

      if (data.success) {
        setAnalyticsData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch analytics data");
      }
    } catch (err) {
      setError(`Failed to fetch analytics data: ${err.message}`);
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAnalyticsData();
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      merchantSegment: "",
      intent: "",
    });
    fetchAnalyticsData();
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard">
        <div className="no-data">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <p>Track most-asked questions by merchant segment</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Date From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Date To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Merchant Segment:</label>
            <select
              value={filters.merchantSegment}
              onChange={(e) =>
                handleFilterChange("merchantSegment", e.target.value)
              }
            >
              <option value="">All Segments</option>
              <option value="basic">Basic</option>
              <option value="shopify">Shopify</option>
              <option value="advanced">Advanced</option>
              <option value="plus">Plus</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Intent:</label>
            <select
              value={filters.intent}
              onChange={(e) => handleFilterChange("intent", e.target.value)}
            >
              <option value="">All Intents</option>
              <option value="setup">Setup</option>
              <option value="troubleshooting">Troubleshooting</option>
              <option value="optimization">Optimization</option>
              <option value="billing">Billing</option>
              <option value="technical_api">Technical API</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={applyFilters} className="apply-btn">
            Apply Filters
          </button>
          <button onClick={clearFilters} className="clear-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card">
          <div className="card-header">Total Questions</div>
          <div className="card-value">{analyticsData.totalQuestions}</div>
        </div>
        <div className="card">
          <div className="card-header">Average Confidence</div>
          <div className="card-value">
            {(analyticsData.confidenceTrends.averageConfidence * 100).toFixed(
              1
            )}
            %
          </div>
        </div>
        <div className="card">
          <div className="card-header">High Confidence</div>
          <div className="card-value">
            {analyticsData.confidenceTrends.confidenceDistribution.high}
          </div>
        </div>
        <div className="card">
          <div className="card-header">Medium Confidence</div>
          <div className="card-value">
            {analyticsData.confidenceTrends.confidenceDistribution.medium}
          </div>
        </div>
        <div className="card">
          <div className="card-header">Low Confidence</div>
          <div className="card-value">
            {analyticsData.confidenceTrends.confidenceDistribution.low}
          </div>
        </div>
      </div>

      {/* Top Questions */}
      <div className="section">
        <h3>🔝 Top Questions</h3>
        <div className="questions-list">
          {analyticsData.topQuestions.map((item, index) => (
            <div key={index} className="question-item">
              <div className="question-rank">#{index + 1}</div>
              <div className="question-text">{item.question}</div>
              <div className="question-count">{item.count} times</div>
            </div>
          ))}
        </div>
      </div>

      {/* Intent Distribution */}
      <div className="section">
        <h3>🎯 Intent Distribution</h3>
        <div className="intent-distribution">
          {Object.entries(analyticsData.intentDistribution).map(
            ([intent, count]) => (
              <div key={intent} className="intent-item">
                <div className="intent-name">{intent.replace(/_/g, " ")}</div>
                <div className="intent-bar">
                  <div
                    className="intent-fill"
                    style={{
                      width: `${(count / analyticsData.totalQuestions) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="intent-count">{count}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Merchant Segment Insights */}
      <div className="section">
        <h3>🏪 Merchant Segment Insights</h3>
        <div className="segment-insights">
          <div className="segment-group">
            <h4>By Plan Tier</h4>
            {Object.entries(
              analyticsData.merchantSegmentInsights.byPlanTier
            ).map(([tier, data]) => (
              <div key={tier} className="segment-item">
                <div className="segment-name">{tier}</div>
                <div className="segment-count">{data.count} questions</div>
                <div className="segment-intents">
                  {Object.entries(data.intents).map(([intent, count]) => (
                    <span key={intent} className="intent-tag">
                      {intent}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="segment-group">
            <h4>By Store Type</h4>
            {Object.entries(
              analyticsData.merchantSegmentInsights.byStoreType
            ).map(([type, data]) => (
              <div key={type} className="segment-item">
                <div className="segment-name">{type}</div>
                <div className="segment-count">{data.count} questions</div>
                <div className="segment-intents">
                  {Object.entries(data.intents).map(([intent, count]) => (
                    <span key={intent} className="intent-tag">
                      {intent}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Effectiveness */}
      <div className="section">
        <h3>📚 Source Effectiveness</h3>
        <div className="source-effectiveness">
          {analyticsData.sourceEffectiveness
            .slice(0, 10)
            .map((source, index) => (
              <div key={index} className="source-item">
                <div className="source-title">{source.title}</div>
                <div className="source-category">{source.category}</div>
                <div className="source-stats">
                  <span>Used {source.usageCount} times</span>
                  <span>
                    Avg Score: {(source.averageScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
