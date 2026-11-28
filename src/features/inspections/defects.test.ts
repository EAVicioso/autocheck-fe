import { describe, expect, it } from "vitest";
import { defectListSchema, versionSchema } from "./defects";

const defect = {
  categoria: "FRENOS", subcategoria: "DISCOS", descripcion: " Desgaste visible ", severidad: "Leve", cantidad: 1,
};

describe("registro de inspección", () => {
  it("admite declarar cero defectos y exige que el registro exista", () => {
    expect(defectListSchema.parse({ defectos: [] })).toEqual({ defectos: [] });
    expect(defectListSchema.safeParse({ defectos: null }).success).toBe(false);
  });

  it("valida categorías, cantidades y tamaño", () => {
    expect(defectListSchema.parse({ defectos: [defect] }).defectos[0].descripcion).toBe("Desgaste visible");
    expect(defectListSchema.safeParse({ defectos: [{ ...defect, subcategoria: "" }] }).success).toBe(false);
    expect(defectListSchema.safeParse({ defectos: [{ ...defect, cantidad: 101 }] }).success).toBe(false);
    expect(defectListSchema.safeParse({ defectos: Array(101).fill(defect) }).success).toBe(false);
  });

  it("acepta solo versiones enteras no negativas dentro del rango seguro", () => {
    expect(versionSchema.safeParse(0).success).toBe(true);
    expect(versionSchema.safeParse(-1).success).toBe(false);
    expect(versionSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
  });
});
