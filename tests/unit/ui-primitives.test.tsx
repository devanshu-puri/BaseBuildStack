import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { OptionButton } from "@/components/ui/option-button";
import { CodeBlock } from "@/components/ui/code-block";

describe("UI Primitives Unit Tests", () => {
  it("renders SegmentedTabs and triggers onChange", () => {
    const handleChange = vi.fn();
    const tabs = [
      { id: "tab-1", label: "Overview" },
      { id: "tab-2", label: "Analysis" },
    ];

    render(<SegmentedTabs items={tabs} value="tab-1" onChange={handleChange} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Analysis"));
    expect(handleChange).toHaveBeenCalledWith("tab-2");
  });

  it("renders OptionButton and handles click when active", () => {
    const handleClick = vi.fn();
    render(
      <OptionButton
        prefix="A"
        label="Binary Search O(log N)"
        state="idle"
        onClick={handleClick}
      />
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Binary Search O(log N)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders CodeBlock and allows line selection", () => {
    const handleSelectLine = vi.fn();
    const code = "const a = 1;\nconst b = 2;\nreturn a + b;";

    render(
      <CodeBlock
        code={code}
        selectableLines
        onSelectLine={handleSelectLine}
        selectedLine={2}
      />
    );

    expect(screen.getByText("const a = 1;")).toBeInTheDocument();
    expect(screen.getByText("return a + b;")).toBeInTheDocument();

    fireEvent.click(screen.getByText("return a + b;"));
    expect(handleSelectLine).toHaveBeenCalledWith(3);
  });
});
