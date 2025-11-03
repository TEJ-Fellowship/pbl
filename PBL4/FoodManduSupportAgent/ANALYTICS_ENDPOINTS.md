# 📊 Analytics Endpoints Documentation

## Overview

The Foodmandu Support Agent now includes comprehensive analytics endpoints to track performance, identify peak support times, and analyze problematic areas and restaurants.

---

## 🔗 Available Endpoints

### 1. **GET /api/analytics/overview**
**General analytics overview for a specified time period**

#### Query Parameters
- `days` (optional): Number of days to analyze (default: 7)

#### Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2025-01-22T00:00:00.000Z",
      "days": 7
    },
    "chatStats": {
      "totalChats": 1250,
      "avgLatencyMs": 1250,
      "methodDistribution": [
        { "_id": "RAG", "count": 800 },
        { "_id": "MCP", "count": 450 }
      ],
      "languageDistribution": [
        { "_id": "en", "count": 750 },
        { "_id": "np", "count": 500 }
      ]
    },
    "ticketStats": {
      "totalTickets": 45,
      "resolvedTickets": 38,
      "resolutionRate": "84.44"
    }
  },
  "timestamp": "2025-01-22T10:30:00.000Z"
}
```

#### Use Cases
- Dashboard overview
- Performance monitoring
- Overall system health check
- Language usage statistics

---

### 2. **GET /api/analytics/peak-times**
**Identify peak support hours and meal rush times**

#### Query Parameters
- `days` (optional): Number of days to analyze (default: 7)

#### Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2025-01-22T00:00:00.000Z",
      "days": 7
    },
    "overall": {
      "totalQueries": 1250,
      "totalEscalations": 45,
      "escalationRate": "3.60"
    },
    "peakTimes": [
      {
        "hour": 19,
        "queryCount": 145,
        "avgLatencyMs": 1180,
        "escalationCount": 8
      },
      {
        "hour": 13,
        "queryCount": 132,
        "avgLatencyMs": 1100,
        "escalationCount": 5
      },
      {
        "hour": 8,
        "queryCount": 98,
        "avgLatencyMs": 1250,
        "escalationCount": 3
      }
    ],
    "mealRushes": [
      {
        "hour": 8,
        "queryCount": 98,
        "avgLatencyMs": 1250,
        "escalationCount": 3,
        "mealType": "breakfast"
      },
      {
        "hour": 13,
        "queryCount": 132,
        "avgLatencyMs": 1100,
        "escalationCount": 5,
        "mealType": "lunch"
      },
      {
        "hour": 19,
        "queryCount": 145,
        "avgLatencyMs": 1180,
        "escalationCount": 8,
        "mealType": "dinner"
      }
    ]
  },
  "timestamp": "2025-01-22T10:30:00.000Z"
}
```

#### Peak Hours Detected
- **Breakfast:** 7-9 AM
- **Lunch:** 1-3 PM (13-15)
- **Dinner:** 7-9 PM (19-21)

#### Use Cases
- Staff scheduling optimization
- Capacity planning
- Peak load management
- Escalation pattern analysis

---

### 3. **GET /api/analytics/problem-areas**
**Identify problematic restaurants and common issue types**

#### Query Parameters
- `days` (optional): Number of days to analyze (default: 7)

#### Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2025-01-22T00:00:00.000Z",
      "days": 7
    },
    "intentDistribution": [
      {
        "intent": "track_order",
        "count": 650,
        "escalationCount": 12,
        "escalationRate": 1.85
      },
      {
        "intent": "payment_issue",
        "count": 280,
        "escalationCount": 18,
        "escalationRate": 6.43
      },
      {
        "intent": "delivery_problem",
        "count": 150,
        "escalationCount": 15,
        "escalationRate": 10.0
      },
      {
        "intent": "refund_request",
        "count": 90,
        "escalationCount": 8,
        "escalationRate": 8.89
      }
    ],
    "problemIntents": [
      {
        "intent": "payment_issue",
        "count": 280,
        "escalationCount": 18,
        "escalationRate": 6.43
      },
      {
        "intent": "delivery_problem",
        "count": 150,
        "escalationCount": 15,
        "escalationRate": 10.0
      },
      {
        "intent": "refund_request",
        "count": 90,
        "escalationCount": 8,
        "escalationRate": 8.89
      }
    ],
    "problematicRestaurants": [
      {
        "restaurantName": "Bajeko Sekuwa",
        "ticketCount": 8,
        "urgentCount": 3,
        "avgDelayMinutes": 95
      },
      {
        "restaurantName": "Himalayan Flavours",
        "ticketCount": 5,
        "urgentCount": 1,
        "avgDelayMinutes": 72
      },
      {
        "restaurantName": "Momo Hut",
        "ticketCount": 4,
        "urgentCount": 2,
        "avgDelayMinutes": 88
      }
    ],
    "affectedOrders": 47
  },
  "timestamp": "2025-01-22T10:30:00.000Z"
}
```

#### Criteria for Problematic Restaurants
- **Minimum 2 tickets** in the period
- Sorted by ticket count (highest first)
- **Top 10** restaurants shown
- Includes urgent ticket count and average delay

#### Use Cases
- Restaurant performance monitoring
- Partnership management
- Quality control
- Issue trend analysis
- Root cause identification

---

## 📈 Key Metrics Explained

### **Chat Stats**
- **totalChats**: Total queries processed
- **avgLatencyMs**: Average response time in milliseconds
- **methodDistribution**: RAG vs MCP tool usage breakdown
- **languageDistribution**: English vs Nepali usage

### **Ticket Stats**
- **totalTickets**: Total escalation tickets created
- **resolvedTickets**: Successfully resolved tickets
- **resolutionRate**: Percentage of resolved tickets

### **Peak Times**
- **queryCount**: Number of queries in that hour
- **avgLatencyMs**: Average response time
- **escalationCount**: Number of escalations

### **Problem Analysis**
- **intentDistribution**: Breakdown by issue type
- **escalationRate**: Percentage of queries that escalate
- **problematicRestaurants**: Restaurants with repeated issues
- **avgDelayMinutes**: Average delivery delay for that restaurant

---

## 🎯 Business Value

### **Operational Benefits**
1. **Staff Optimization**: Schedule more agents during peak times
2. **Capacity Planning**: Predict resource needs based on patterns
3. **Restaurant Management**: Identify and address problematic partners
4. **Performance Tracking**: Monitor system latency and reliability

### **Strategic Insights**
1. **Trend Analysis**: Spot increasing problem areas early
2. **Quality Control**: Identify restaurants needing partnership review
3. **User Behavior**: Understand when and why users need support
4. **Language Preferences**: Optimize bilingual support allocation

---

## 🧪 Testing Examples

### **Get Overview (Last 7 Days)**
```bash
curl http://localhost:5000/api/analytics/overview
```

### **Get Overview (Last 30 Days)**
```bash
curl http://localhost:5000/api/analytics/overview?days=30
```

### **Get Peak Times (Last 7 Days)**
```bash
curl http://localhost:5000/api/analytics/peak-times
```

### **Get Problem Areas (Last 14 Days)**
```bash
curl http://localhost:5000/api/analytics/problem-areas?days=14
```

---

## 🔍 Data Sources

### **Chat Collection**
- All user queries and responses
- Intent classifications
- Tool usage (RAG vs MCP)
- Language detection
- Response times
- Escalation flags

### **Ticket Collection**
- All escalated issues
- Restaurant associations
- Delay information
- Priority levels
- Resolution status

---

## 📊 Usage Patterns

### **Daily Operations**
```bash
# Morning: Check yesterday's performance
GET /api/analytics/overview?days=1

# Afternoon: Review peak times for today
GET /api/analytics/peak-times?days=1

# Evening: Identify problem restaurants
GET /api/analytics/problem-areas?days=7
```

### **Weekly Reports**
```bash
# Generate comprehensive weekly report
GET /api/analytics/overview?days=7
GET /api/analytics/peak-times?days=7
GET /api/analytics/problem-areas?days=7
```

### **Strategic Planning**
```bash
# Monthly trends analysis
GET /api/analytics/overview?days=30
GET /api/analytics/problem-areas?days=30
```

---

## 🚀 Integration with Admin Dashboard

These endpoints are designed to power:
- **Real-time dashboards**: Live metrics and KPIs
- **Performance reports**: Weekly/monthly summaries
- **Alert systems**: Auto-detect anomalies
- **Quality tracking**: Restaurant partner scores
- **Capacity planning**: Resource allocation optimization

---

## 🔐 Security Considerations

- **Rate Limiting**: Apply API rate limits for abuse prevention
- **Access Control**: Restrict to admin users only
- **Data Privacy**: Anonymize sensitive information in exports
- **Audit Logging**: Track who accesses analytics data

---

## 📝 Future Enhancements

1. **Time Range Filtering**: Support date ranges beyond days parameter
2. **Comparison Mode**: Compare periods (this week vs last week)
3. **Custom Filtering**: Filter by specific restaurants, intents, or regions
4. **Export Functionality**: CSV/Excel downloads
5. **Real-time Updates**: WebSocket for live dashboard
6. **Advanced Visualizations**: Charts and graphs
7. **Predictive Analytics**: Forecast future trends

---

## ✅ Implementation Status

**Status:** ✅ **COMPLETE**

All analytics endpoints are fully implemented and ready for use!

- ✅ Peak support times analysis
- ✅ Problematic restaurant identification
- ✅ Intent distribution tracking
- ✅ Escalation rate monitoring
- ✅ Overall performance metrics

---

**Documentation Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** FoodMandu Support Agent Team

