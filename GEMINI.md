# Notion Minimalist Timer

## Project Overview

This is a **minimalist time tracking application** built with **React**, **TypeScript**, and **Vite**. The design is heavily inspired by Notion, featuring a clean, monochromatic aesthetic (using colors like `#37352f` and `#e9e9e7`).

**Core Features:**
*   **Multiple Timers:** Create and manage multiple independent task timers.
*   **Notion Aesthetic:** Minimalist UI with specific Notion-like colors and typography.
*   **Robust Timing:** Uses `Date.now()` deltas rather than `setInterval` accumulation for accuracy across background/sleep states.
*   **Persistence:** automatically saves all data to `localStorage`.
*   **Clipboard Integration:** Copy task titles and formatted durations (e.g., "2h 15m") directly to the clipboard.
*   **Manual Editing:** Click on the time display to manually edit the elapsed time.

## Tech Stack

*   **Framework:** React 19
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (inferred from class usage in components)
*   **Icons:** Custom SVG components

## Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```
The app will typically be available at `http://localhost:3000` (or similar, check console output).

### Building for Production

```bash
npm run build
```
Output will be generated in the `dist/` directory.

## Architecture & Key Files

### Entry Point
*   **`index.tsx`**: Mounts the React application.
*   **`App.tsx`**: The main container. It manages the global list of timers (`timers` state) and handles the "Total Time Today" calculation. It initiates the `localStorage` sync.

### Data Model (`types.ts`)
The `Timer` interface is the core data structure:
```typescript
interface Timer {
  id: string;
  title: string;
  baseSeconds: number;      // Stored duration (when paused)
  isRunning: boolean;
  sessionStartTime: number | null; // Timestamp when current session started
  createdAt: number;
}
```

### Key Components

*   **`components/TimerCard.tsx`**:
    *   Renders an individual timer.
    *   Handles local interactions like copying to clipboard and toggling the "edit time" mode.
    *   Uses a local `setInterval` only for updating the UI every second; actual time calculation is derived from `props.timer` data.

### Storage

*   **`utils/storage.ts`**:
    *   Wraps `localStorage`.
    *   Key: `'notion_timers_v1'`.
    *   Loads data on mount and saves on every state change in `App.tsx`.

## Development Conventions

*   **Styling:** Use Tailwind CSS utility classes. Stick to the specific color palette defined in existing components (e.g., Text: `#37352f`, Muted: `#a4a4a2`, Border: `#e9e9e7`).
*   **State Management:** Local React state (`useState`) lifted to `App.tsx` is currently sufficient. Complex reducers are defined in `types.ts` but not currently utilized in the main flow.
*   **Time Calculation:** Always calculate elapsed time as `baseSeconds + (now - sessionStartTime)`. Never rely on incrementing a counter every second.
