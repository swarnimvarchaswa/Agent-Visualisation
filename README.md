# Agent Visualizer - Analytics Dashboard

A Next.js TypeScript application for visualizing agent performance data with interactive scatter plots.

## Features

- 📊 **Interactive Scatter Plot**: Visualize agents based on number of properties and enquiries
- 🎨 **Color-Coded User Types**: 
  - Premium agents → Green (#16a34a)
  - Trial agents → Orange (#f97316)
  - Basic agents → Gray (#9ca3af)
- 🔍 **Advanced Filtering**: Filter by KAM name and user type
- 💡 **Rich Tooltips**: Hover over any agent dot to see detailed information
- 📱 **Responsive Design**: Fully responsive layout using Tailwind CSS
- 📈 **Real-time Summary**: Shows count of filtered agents vs total agents

## Project Structure

```
Agent Visualiser/
├── app/
│   ├── agent-visualizer/
│   │   └── page.tsx          # Main visualization page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page (redirects to agent-visualizer)
│   └── globals.css            # Global styles
├── components/
│   └── AgentVisualizer.tsx    # Main chart component
├── data/
│   └── agents.json            # Agent data
├── lib/
│   └── types.ts               # TypeScript interfaces
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Required Dependencies

- **next**: ^14.2.0 - React framework
- **react**: ^18.3.0 - UI library
- **react-dom**: ^18.3.0 - React DOM rendering
- **recharts**: ^2.12.0 - Chart library
- **typescript**: ^5.0.0 - TypeScript support
- **tailwindcss**: ^3.4.0 - CSS framework
- **autoprefixer**: ^10.4.0 - CSS post-processor
- **postcss**: ^8.4.0 - CSS transformation

## Usage

### Viewing the Dashboard

1. Navigate to `/agent-visualizer` to see the analytics dashboard
2. Use the dropdown filters to:
   - Filter agents by KAM name
   - Filter agents by user type (Premium, Trial, Basic, or All)
3. Hover over any dot on the scatter plot to see detailed agent information

### Data Structure

The application expects agent data in the following format:

```typescript
interface IAgent {
  cpId: string;
  name: string;
  kamName: string;
  kamId: string;
  userType: 'premium' | 'trial' | 'basic';
  noOfInventories: number;
  noOfEnquiries: number;
  // ... additional fields
}
```

### Customization

#### Changing Colors

Edit the colors in `components/AgentVisualizer.tsx`:

```typescript
// Premium agents
fill="#16a34a"  // Green

// Trial agents
fill="#f97316"  // Orange

// Basic agents
fill="#9ca3af"  // Gray
```

#### Chart Size

Adjust the chart height in `components/AgentVisualizer.tsx`:

```typescript
<div className="w-full" style={{ height: '500px' }}>
```

## Build for Production

```bash
npm run build
npm start
```

## Features Breakdown

### 1. Scatter Plot Visualization
- X-axis: Number of Properties (inventories)
- Y-axis: Number of Enquiries
- Each dot represents one agent
- Dot size can be adjusted based on requirements

### 2. Interactive Filters
- **KAM Filter**: Filter agents by their Key Account Manager
- **User Type Filter**: Filter by Premium, Trial, Basic, or view All

### 3. Tooltips
Hovering over any agent dot shows:
- Agent name
- KAM name
- Number of properties
- Number of enquiries
- User type

### 4. Summary Statistics
- Total agents count
- Filtered agents count
- Breakdown by user type (Premium, Trial, Basic)

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Recharts**: Powerful charting library
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: useState, useMemo for state management

## License

MIT
