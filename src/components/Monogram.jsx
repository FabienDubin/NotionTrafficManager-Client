import React from "react";
import { useTheme } from "@/components/ThemeProvider";

const Monogram = () => {
  // THEME
  const { theme } = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      className="fill-foreground"
      preserveAspectRatio="xMidYMid meet"
      // Edit the viewbox
      viewBox="0 0 1080 1080"
    >
      {/* Paste the code here to replace the existing SVG path with your own custom logo design. */}

      <path
        class="st0"
        d="M540,0C241.77,0,0,241.77,0,540s241.77,540,540,540,540-241.77,540-540S838.23,0,540,0ZM894.16,775.95h-126.52v-246.57c0-68.34-22.17-109.89-72.04-109.89-54.48,0-92.35,42.48-92.35,131.12v225.33h-126.52v-246.57c0-68.34-22.17-109.89-72.04-109.89-54.48,0-92.35,42.48-92.35,131.12v225.33h-126.52v-461.73l.02-.02h126.52v52.64c24.94-36.01,66.48-62.79,122.82-62.79,67.41,0,115.42,31.4,143.14,84.95,28.63-57.25,90.49-84.95,143.13-84.95,109.89,0,172.69,79.41,172.69,204.09v267.8Z"
      />
    </svg>
  );
};

export default Monogram;
