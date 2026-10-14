import React from "react";

export interface HeatmapCell {
  id?: string;
  label?: string;
  level: 0 | 1 | 2 | 3 | 4;
  tooltip?: string;
}

export interface HeatmapProps {
  cells: HeatmapCell[];
  columns?: number;
  showLegend?: boolean;
  className?: string;
}

export function Heatmap({
  cells,
  columns = 7,
  showLegend = true,
  className = "",
}: HeatmapProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="heat"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: "8px",
        }}
      >
        {cells.map((cell, idx) => (
          <div
            key={cell.id || idx}
            className="c"
            data-l={cell.level}
            title={cell.tooltip || cell.label || `Level ${cell.level}`}
            style={{
              aspectRatio: "1",
              minWidth: "28px",
              minHeight: "28px",
              maxWidth: "36px",
              borderRadius: "10px",
              transition: "transform 150ms ease, box-shadow 150ms ease",
              cursor: cell.tooltip ? "pointer" : "default",
            }}
          />
        ))}
      </div>

      {showLegend && (
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          <span>Less</span>
          <div className="flex items-center gap-1.5 heat">
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <div
                key={lvl}
                className="c"
                data-l={lvl}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                }}
                title={`Level ${lvl}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
    </div>
  );
}
