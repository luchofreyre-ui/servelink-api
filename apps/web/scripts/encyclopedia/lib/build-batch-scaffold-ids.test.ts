import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  dedupeIdsPreserveOrder,
  loadIdsFromFile,
  parseCommaSeparatedIds,
  resolveScaffoldIds,
} from "./build-batch-scaffold-ids";

describe("build-batch-scaffold-ids", () => {
  it("dedupeIdsPreserveOrder keeps first occurrence", () => {
    expect(dedupeIdsPreserveOrder(["A", "B", "A", "C", "B"])).toEqual(["A", "B", "C"]);
  });

  it("loadIdsFromFile: JSON array", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-ids-"));
    const f = path.join(dir, "x.json");
    fs.writeFileSync(f, JSON.stringify(["ID1", "ID2", "ID1"]), "utf8");
    expect(loadIdsFromFile(f, dir)).toEqual(["ID1", "ID2"]);
  });

  it("loadIdsFromFile: JSON object with ids", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-ids-"));
    const f = path.join(dir, "x.json");
    fs.writeFileSync(f, JSON.stringify({ ids: ["X", "Y"] }), "utf8");
    expect(loadIdsFromFile(f, dir)).toEqual(["X", "Y"]);
  });

  it("loadIdsFromFile: TXT line-delimited, trims and skips blanks", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-ids-"));
    const f = path.join(dir, "x.txt");
    fs.writeFileSync(f, "  A  \n\nB\r\nC\n", "utf8");
    expect(loadIdsFromFile(f, dir)).toEqual(["A", "B", "C"]);
  });

  it("loadIdsFromFile: throws when file missing", () => {
    expect(() => loadIdsFromFile("does-not-exist-xyz.txt", os.tmpdir())).toThrow(/not found/);
  });

  it("loadIdsFromFile: throws when empty after parse", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-ids-"));
    const f = path.join(dir, "empty.json");
    fs.writeFileSync(f, "[]", "utf8");
    expect(() => loadIdsFromFile(f, dir)).toThrow(/empty ID list/);
  });

  it("parseCommaSeparatedIds dedupes", () => {
    expect(parseCommaSeparatedIds("a,b,a")).toEqual(["a", "b"]);
  });

  it("resolveScaffoldIds throws when both --ids and --ids-file", () => {
    expect(() =>
      resolveScaffoldIds(["--ids=A", "--ids-file=x.json"], os.tmpdir()),
    ).toThrow(/both --ids and --ids-file/);
  });

  it("resolveScaffoldIds returns none when neither flag", () => {
    expect(resolveScaffoldIds(["--output=out.json"], "/tmp")).toEqual({ source: "none", ids: [] });
  });
});
