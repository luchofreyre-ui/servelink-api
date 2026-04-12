import React from "react";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, expect, vi } from "vitest";

expect.extend(matchers);

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown> & { src?: string; alt?: string }) => {
    const { src, alt, fill: _f, priority: _p, ...rest } = props;
    return React.createElement("img", { ...rest, src, alt } as React.ImgHTMLAttributes<HTMLImageElement>);
  },
}));

afterEach(() => {
  cleanup();
});
