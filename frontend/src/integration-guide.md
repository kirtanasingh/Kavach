# JSX Integration Guide for Kavach Digital Farm Management Portal

## Epidemiological Conditions Components

I've converted the epidemiological conditions functionality to JSX format for easy integration into your existing codebase. Here are the key components:

### 1. Farm Owner Epidemiological Conditions
**File:** `/components/EpidemiologicalConditions.jsx`

This component shows:
- Current weather conditions (temperature, humidity, wind speed, rainfall)
- Temperature trends (7-day chart)
- Rainfall patterns (4-month chart)
- Environmental risk assessment with factor-based analysis
- Disease risk explanations based on weather conditions

**Usage:**
```jsx
import { EpidemiologicalConditions } from './components/EpidemiologicalConditions';

// In your Farm Owner Dashboard
<EpidemiologicalConditions />
```

### 2. Government/Authority Epidemiological Overview
**File:** `/components/EpidemiologicalConditionsOverview.jsx`

This component shows:
- Regional climate summary across multiple areas
- Seasonal disease patterns vs climate data
- State-wise climate risk mapping
- National environmental risk assessment
- Filter options for region, condition type, and date range

**Usage:**
```jsx
import { EpidemiologicalConditionsOverview } from './components/EpidemiologicalConditionsOverview';

// In your Authority Dashboard
<EpidemiologicalConditionsOverview />
```

## Main App Structure
**File:** `/App.jsx` (converted from TypeScript)

## Key Changes Made:

### 1. Removed TypeScript Features:
- Removed all interface definitions
- Removed type annotations (`: string`, `: number`, etc.)
- Removed generic types (`<any>`, `<string>`, etc.)
- Kept only essential interfaces needed for functionality

### 2. Dependencies Required:
```json
{
  "recharts": "^2.8.0", // For charts
  "lucide-react": "^0.263.1" // For icons
}
```

### 3. UI Components Used:
- Card (CardContent, CardHeader, CardTitle)
- Badge
- Select (SelectContent, SelectItem, SelectTrigger, SelectValue)
- Button
- Icons from lucide-react

## Integration Steps:

1. **Copy the JSX files** to your components directory
2. **Install dependencies** if not already present:
   ```bash
   npm install recharts lucide-react
   ```
3. **Import and use** in your existing dashboards:
   ```jsx
   // For Farm Owner Dashboard
   import { EpidemiologicalConditions } from './EpidemiologicalConditions';
   
   // For Authority Dashboard
   import { EpidemiologicalConditionsOverview } from './EpidemiologicalConditionsOverview';
   ```

## Mock Data Structure:
Both components use realistic mock data that represents:
- Temperature readings in Celsius
- Humidity percentages
- Rainfall in millimeters
- Wind speed in km/h
- Regional and seasonal variations
- Risk assessment factors

## Customization Options:
1. **Update mock data** with real API endpoints
2. **Modify color schemes** to match your brand colors
3. **Add more chart types** using recharts library
4. **Integrate with weather APIs** for real-time data
5. **Add more risk factors** based on your biosecurity requirements

## File Structure:
```
/components/
  ├── EpidemiologicalConditions.jsx          # Farm Owner component
  ├── EpidemiologicalConditionsOverview.jsx  # Authority component
  ├── FarmOwnerDashboard.tsx                 # Updated with epidemiological section
  └── AuthorityDashboard.tsx                 # Updated with epidemiological section
/App.jsx                                     # Main app converted to JSX
```

The components are self-contained and can be easily integrated into your existing codebase without breaking changes to your current TypeScript setup.