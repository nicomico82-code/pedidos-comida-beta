import { describe, expect, it } from "vitest";
import {
  customizationPrice,
  customizationSummary,
  defaultCustomization,
  formatOrderItemName,
} from "./customization";

describe("personalización de completos", () => {
  it("parte con los ingredientes incluidos", () => {
    expect(defaultCustomization()).toEqual(["tomate", "palta", "mayo"]);
  });

  it("calcula los extras con recargo", () => {
    expect(customizationPrice(["queso-extra", "vienesa-extra"])).toBe(1200);
  });

  it("conserva los ingredientes quitados en el detalle", () => {
    const summary = customizationSummary(["palta"]);
    expect(summary).toContain("Sin tomate");
    expect(summary).toContain("Sin mayo");
    expect(formatOrderItemName({ id: "prod-1", name: "Producto 1" }, [])).toContain("Sin tomate");
  });
});
