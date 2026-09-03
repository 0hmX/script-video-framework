import { expect, test } from "bun:test"
import { resolveLocalInput } from "@script-video/assets"
test("local asset policy confines inputs", () => { expect(resolveLocalInput("/project", "./image.png")).toBe("/project/image.png"); expect(() => resolveLocalInput("/project", "../secret")).toThrow(); expect(() => resolveLocalInput("/project", "https://x.test/a")).toThrow() })
