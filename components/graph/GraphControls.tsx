"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GraphControls({ onAutoLayout }: { onAutoLayout: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <Button variant="ghost" size="icon" onClick={() => zoomIn()} aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => zoomOut()} aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => fitView({ padding: 0.2, duration: 300 })} aria-label="Fit tree">
        <Maximize className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onAutoLayout} aria-label="Auto layout">
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
