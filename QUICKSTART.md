# Quick Start Guide - Agent Visualizer

## Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React 18
- Recharts (for charts)
- TypeScript
- Tailwind CSS

## Step 2: Run the Development Server

```bash
npm run dev
```

## Step 3: Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You'll be automatically redirected to `/agent-visualizer`

## What You'll See

1. **Two Filter Dropdowns** at the top:
   - Filter by KAM Name
   - Filter by User Type (Premium/Trial/Basic/All)

2. **Scatter Plot Chart** showing:
   - X-axis: Number of Properties
   - Y-axis: Number of Enquiries
   - Green dots = Premium agents
   - Orange dots = Trial agents
   - Gray dots = Basic agents

3. **Interactive Tooltips**: Hover over any dot to see:
   - Agent name
   - KAM name
   - Properties count
   - Enquiries count
   - User type

4. **Summary Section** below the chart showing:
   - "Showing X of Y agents"
   - Breakdown by user type

## Troubleshooting

If you encounter any issues:

1. **Port 3000 already in use?**
   - The dev server will automatically try port 3001
   - Or specify a different port: `npm run dev -- -p 3001`

2. **Module not found errors?**
   - Delete `node_modules` folder and `package-lock.json`
   - Run `npm install` again

3. **Chart not displaying?**
   - Make sure `data/agents.json` exists and has valid data
   - Check browser console for errors

## Next Steps

- Customize colors in `components/AgentVisualizer.tsx`
- Adjust chart height or add more filters
- Add additional chart types if needed
- Deploy to Vercel, Netlify, or your preferred hosting platform

Enjoy visualizing your agent data! 🚀
