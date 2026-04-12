import React from "react";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, expect, vi } from "vitest";

expect.extend(matchers);

// Vitest does not load `next.config` into `next/image`; remotePatterns from config
// are ignored in unit tests, so real product image URLs would throw. Map to <img>.
vi.mock("next/image", () => ({
  default: function NextImageMock(props: Record<string, unknown>) {
    const {
      src,
      alt,
      fill: _fill,
      priority: _priority,
      placeholder: _placeholder,
      blurDataURL: _blur,
      onLoadingComplete: _onLoadingComplete,
      loader: _loader,
      ...rest
    } = props;
    const srcStr = typeof src === "string" ? src : "";
    return React.createElement("img", {
      src: srcStr,
      alt: typeof alt === "string" ? alt : "",
      ...(rest as React.ImgHTMLAttributes<HTMLImageElement>),
    });
  },
}));

afterEach(() => {
  cleanup();
});
