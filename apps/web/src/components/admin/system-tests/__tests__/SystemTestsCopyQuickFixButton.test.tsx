import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemTestsCopyQuickFixButton } from "../SystemTestsCopyQuickFixButton";

describe("SystemTestsCopyQuickFixButton", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    const realNav = globalThis.navigator;
    vi.stubGlobal(
      "navigator",
      new Proxy(realNav, {
        get(target, prop, receiver) {
          if (prop === "clipboard") {
            return { writeText };
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes text to clipboard and shows Copied", async () => {
    const user = userEvent.setup();
    render(<SystemTestsCopyQuickFixButton text="hello handoff" />);

    await user.click(screen.getByTestId("system-tests-copy-quick-fix-button"));
    expect(writeText).toHaveBeenCalledWith("hello handoff");
    expect(screen.getByTestId("system-tests-copy-quick-fix-button")).toHaveTextContent("Copied");
  });

  it("shows Copy failed when clipboard rejects", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const user = userEvent.setup();
    render(<SystemTestsCopyQuickFixButton text="x" />);

    await user.click(screen.getByTestId("system-tests-copy-quick-fix-button"));
    expect(screen.getByTestId("system-tests-copy-quick-fix-button")).toHaveTextContent("Copy failed");
  });
});
