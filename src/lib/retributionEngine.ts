import { Application, RetributionCalculation, RetributionComponent } from '../types';

export const FORMULA_VERSION = 'RETRIBUSI-2026-01';

// Function Index mapping (PP 16/2021)
export const FUNCTION_INDEX_MAP: Record<string, number> = {
  HUNIAN: 0.15,
  KEAGAMAAN: 0.00, // Bebas retribusi sesuai regulasi nasional
  SOSIAL_BUDAYA: 0.10,
  USAHA: 0.30,
  CAMPURAN: 0.25,
  KHUSUS: 0.40,
};

// Complexity Index mapping
export const COMPLEXITY_INDEX_MAP: Record<string, number> = {
  SEDERHANA: 0.10,
  TIDAK_SEDERHANA: 0.20,
  KHUSUS: 0.30,
};

// Permanence Index mapping
export const PERMANENCE_INDEX_MAP: Record<string, number> = {
  PERMANEN: 0.20,
  SEMI_PERMANEN: 0.15,
  NON_PERMANEN: 0.10,
};

// Standard Garut Base SHST Reference (Rp/m²)
export const DEFAULT_SHST_GARUT = 3650000;
export const DEFAULT_LOCALITY_INDEX = 0.50; // Indeks Wilayah & Parameter Daerah

export function resolveFunctionIndex(functionType: string): number {
  if (!functionType) return 0.15;
  const upper = functionType.toUpperCase();
  if (upper.includes('KEAGAMAAN') || upper.includes('IBADAH') || upper.includes('MASJID') || upper.includes('GEREJA') || upper.includes('PURA') || upper.includes('VIHARA')) {
    return 0.00;
  }
  if (upper.includes('USAHA') || upper.includes('KOMERSIAL') || upper.includes('BISNIS') || upper.includes('TOKO') || upper.includes('RUKO') || upper.includes('PASAR') || upper.includes('HOTEL')) {
    return 0.30;
  }
  if (upper.includes('SOSIAL') || upper.includes('BUDAYA') || upper.includes('PENDIDIKAN') || upper.includes('KESEHATAN') || upper.includes('SEKOLAH') || upper.includes('KLINIK') || upper.includes('RUMAH SAKIT')) {
    return 0.10;
  }
  if (upper.includes('KHUSUS') || upper.includes('SPBU') || upper.includes('INDUSTRI') || upper.includes('PABRIK') || upper.includes('GARDU')) {
    return 0.40;
  }
  if (upper.includes('CAMPURAN') || upper.includes('MIX')) {
    return 0.25;
  }
  if (upper.includes('HUNIAN') || upper.includes('RUMAH') || upper.includes('TINGGAL') || upper.includes('VILLA') || upper.includes('KOST')) {
    return 0.15;
  }
  return FUNCTION_INDEX_MAP[upper] ?? 0.15;
}

export function calculateFloorIndex(floors: number): number {
  if (floors <= 1) return 1.00;
  if (floors === 2) return 1.09;
  if (floors === 3) return 1.12;
  if (floors === 4) return 1.135;
  return 1.135 + (floors - 4) * 0.01;
}

export function calculateRetribution(
  app: Application,
  customInfrastructureOrShst?: RetributionComponent[] | number,
  customShst?: number,
  operatorName: string = 'Operator SIMBG DPUPR'
): RetributionCalculation {
  let resolvedInfrastructure: RetributionComponent[] | undefined = undefined;
  let resolvedShst: number = DEFAULT_SHST_GARUT;

  if (typeof customInfrastructureOrShst === 'number') {
    resolvedShst = customInfrastructureOrShst;
  } else if (Array.isArray(customInfrastructureOrShst)) {
    resolvedInfrastructure = customInfrastructureOrShst;
    if (typeof customShst === 'number') {
      resolvedShst = customShst;
    }
  } else if (typeof customShst === 'number') {
    resolvedShst = customShst;
  }

  const functionIndex = resolveFunctionIndex(app.building.functionType);
  const complexityIndex = COMPLEXITY_INDEX_MAP[app.building.complexity] ?? 0.10;
  const permanenceIndex = PERMANENCE_INDEX_MAP[app.building.permanence] ?? 0.20;
  const floorIndex = calculateFloorIndex(app.building.floors);
  const localityIndex = DEFAULT_LOCALITY_INDEX;
  const shst = resolvedShst || DEFAULT_SHST_GARUT;

  // Integrated Index (Indeks Terintegrasi / It)
  // It = Indeks Fungsi * (Indeks Kompleksitas + Indeks Permanensi + Indeks Ketinggian/Lantai)
  const integratedIndex = functionIndex * (complexityIndex + permanenceIndex + (floorIndex - 1 + 0.10));

  // Calculation A (Primary Method - PP 16/2021)
  // Bangunan Gedung Retribution = Luas Bangunan * Indeks Terintegrasi * Indeks Lokalitas * SHST * 0.005 (koefisien tarif)
  const tariffCoefficient = 0.005;
  const buildingSubtotalA = Math.round(
    app.building.buildingArea * integratedIndex * localityIndex * shst * tariffCoefficient
  );

  // Infrastructure items (Prasarana)
  const infrastructureItems: RetributionComponent[] = (Array.isArray(resolvedInfrastructure) && resolvedInfrastructure.length > 0)
    ? resolvedInfrastructure
    : [
        {
          id: 'INFRA-01',
          name: 'Pagar Keliling / Pembatas Kavling',
          volume: 45,
          unit: 'm¹',
          index: 0.10,
          unitPrice: 350000,
          subtotal: Math.round(45 * 0.10 * 350000 * tariffCoefficient)
        },
        {
          id: 'INFRA-02',
          name: 'Perkerasan Halaman & Parkir (Paving / Beton)',
          volume: 80,
          unit: 'm²',
          index: 0.10,
          unitPrice: 250000,
          subtotal: Math.round(80 * 0.10 * 250000 * tariffCoefficient)
        },
        {
          id: 'INFRA-03',
          name: 'Saluran Drainase Lingkungan',
          volume: 30,
          unit: 'm¹',
          index: 0.10,
          unitPrice: 180000,
          subtotal: Math.round(30 * 0.10 * 180000 * tariffCoefficient)
        }
      ];

  const infrastructureSubtotal = Array.isArray(infrastructureItems)
    ? infrastructureItems.reduce((acc, item) => acc + (item.subtotal || 0), 0)
    : 0;
  const totalPrimary = buildingSubtotalA + infrastructureSubtotal;

  // Calculation B (Secondary Verification Method - Line-item Cross-Check)
  const baseFloorCost = app.building.buildingArea * floorIndex;
  const weightedRate = (shst * tariffCoefficient * localityIndex);
  const buildingSubtotalB = Math.round(
    baseFloorCost * functionIndex * (complexityIndex + permanenceIndex + 0.10) * weightedRate
  );
  const totalSecondary = buildingSubtotalB + infrastructureSubtotal;

  const variance = Math.abs(totalPrimary - totalSecondary);
  const isVerified = variance <= 500; // tolerance threshold in Rupiah

  return {
    id: `RET-${app.id}-${Date.now().toString().slice(-4)}`,
    formulaVersion: FORMULA_VERSION,
    calculatedAt: new Date().toISOString(),
    calculatedBy: operatorName,
    indexFungsi: functionIndex,
    indexKompleksitas: complexityIndex,
    indexPermanensi: permanenceIndex,
    indexJumlahLantai: Number(floorIndex.toFixed(3)),
    indeksLokalitas: localityIndex,
    shst,
    buildingSubtotal: buildingSubtotalA,
    infrastructureItems,
    infrastructureSubtotal,
    totalPrimary,
    totalSecondary,
    variance,
    isVerified,
    finalRetribution: totalPrimary,
    status: isVerified ? 'VERIFIED' : 'DRAFT',
    notes: isVerified
      ? 'Perhitungan ganda (Dual Calculation A & B) telah cocok dan memenuhi toleransi presisi regulasi.'
      : `Terdapat deviasi variansi sebesar Rp ${variance.toLocaleString('id-ID')} antara Metode A dan B.`
  };
}
