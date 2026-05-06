// components/FilterBar.tsx
import * as React from "react";
import { Box, ToggleButtonGroup, ToggleButton, Badge } from "@mui/material";

type Props = {
  type: string;
  setType: (type: string) => void;
};

export default function FilterBar({ type, setType }: Props) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType) setType(newType);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={handleChange}
        aria-label="filter"
      >
        <ToggleButton value="All" aria-label="all">
          All
        </ToggleButton>
        <ToggleButton value="Placement" aria-label="placement">
          Placement
        </ToggleButton>
        <ToggleButton value="Result" aria-label="result">
          Result
        </ToggleButton>
        <ToggleButton value="Event" aria-label="event">
          Event
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
