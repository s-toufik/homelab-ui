export type Nutrient = string | null;

export interface Energy {
  readonly regulation_1169_kj: Nutrient;
  readonly regulation_1169_kcal: Nutrient;
  readonly jones_with_fiber_kj: Nutrient;
  readonly jones_with_fiber_kcal: Nutrient;
}

export interface Macronutrients {
  readonly water_g: Nutrient;
  readonly protein_jones_g: Nutrient;
  readonly protein_6_25_g: Nutrient;
  readonly carbohydrates_g: Nutrient;
  readonly fat_g: Nutrient;
  readonly dietary_fiber_g: Nutrient;
  readonly total_polyols_g: Nutrient;
  readonly ash_g: Nutrient;
  readonly alcohol_g: Nutrient;
  readonly organic_acids_g: Nutrient;
}

export interface Sugars {
  readonly total_sugars_g: Nutrient;
  readonly fructose_g: Nutrient;
  readonly galactose_g: Nutrient;
  readonly glucose_g: Nutrient;
  readonly lactose_g: Nutrient;
  readonly maltose_g: Nutrient;
  readonly sucrose_g: Nutrient;
  readonly starch_g: Nutrient;
}

export interface FattyAcids {
  readonly saturated_g: Nutrient;
  readonly monounsaturated_g: Nutrient;
  readonly polyunsaturated_g: Nutrient;
  readonly butyric_acid_4_0_g: Nutrient;
  readonly caproic_acid_6_0_g: Nutrient;
  readonly caprylic_acid_8_0_g: Nutrient;
  readonly capric_acid_10_0_g: Nutrient;
  readonly lauric_acid_12_0_g: Nutrient;
  readonly myristic_acid_14_0_g: Nutrient;
  readonly palmitic_acid_16_0_g: Nutrient;
  readonly stearic_acid_18_0_g: Nutrient;
  readonly oleic_acid_18_1_g: Nutrient;
  readonly linoleic_acid_18_2_g: Nutrient;
  readonly alpha_linolenic_acid_18_3_g: Nutrient;
  readonly arachidonic_acid_20_4_g: Nutrient;
  readonly epa_20_5_g: Nutrient;
  readonly dha_22_6_g: Nutrient;
}

export interface Minerals {
  readonly cholesterol_mg: Nutrient;
  readonly sodium_chloride_g: Nutrient;
  readonly calcium_mg: Nutrient;
  readonly chloride_mg: Nutrient;
  readonly copper_mg: Nutrient;
  readonly iron_mg: Nutrient;
  readonly iodine_ug: Nutrient;
  readonly magnesium_mg: Nutrient;
  readonly manganese_mg: Nutrient;
  readonly phosphorus_mg: Nutrient;
  readonly potassium_mg: Nutrient;
  readonly selenium_ug: Nutrient;
  readonly sodium_mg: Nutrient;
  readonly zinc_mg: Nutrient;
}

export interface Vitamins {
  readonly retinol_ug: Nutrient;
  readonly beta_carotene_ug: Nutrient;
  readonly vitamin_d_ug: Nutrient;
  readonly vitamin_e_mg: Nutrient;
  readonly vitamin_k1_ug: Nutrient;
  readonly vitamin_k2_ug: Nutrient;
  readonly vitamin_c_mg: Nutrient;
  readonly vitamin_b1_mg: Nutrient;
  readonly vitamin_b2_mg: Nutrient;
  readonly vitamin_b3_mg: Nutrient;
  readonly vitamin_b5_mg: Nutrient;
  readonly vitamin_b6_mg: Nutrient;
  readonly vitamin_b9_ug: Nutrient;
  readonly vitamin_b12_ug: Nutrient;
}

export interface NutritionalComposition {
  readonly energy: Energy;
  readonly macronutrients: Macronutrients;
  readonly sugars: Sugars;
  readonly fatty_acids: FattyAcids;
  readonly minerals: Minerals;
  readonly vitamins: Vitamins;
}

export interface FoodClassification {
  readonly group_code: string;
  readonly subgroup_code: string;
  readonly sub_subgroup_code: string;
  readonly group_name: string;
  readonly subgroup_name: string;
  readonly sub_subgroup_name: string;
}

interface NutrientMeta {
  readonly label: string;
  readonly unit: string;
}

export interface NutrientSection {
  readonly title: string;
  readonly entries: readonly { readonly label: string; readonly value: string }[];
}

const ENERGY_META: Record<keyof Energy, NutrientMeta> = {
  regulation_1169_kj: { label: 'Energy (EU regulation)', unit: 'kJ' },
  regulation_1169_kcal: { label: 'Energy (EU regulation)', unit: 'kcal' },
  jones_with_fiber_kj: { label: 'Energy (Jones, with fiber)', unit: 'kJ' },
  jones_with_fiber_kcal: { label: 'Energy (Jones, with fiber)', unit: 'kcal' },
};

const MACRONUTRIENTS_META: Record<keyof Macronutrients, NutrientMeta> = {
  water_g: { label: 'Water', unit: 'g' },
  protein_jones_g: { label: 'Protein (Jones factor)', unit: 'g' },
  protein_6_25_g: { label: 'Protein (N × 6.25)', unit: 'g' },
  carbohydrates_g: { label: 'Carbohydrates', unit: 'g' },
  fat_g: { label: 'Fat', unit: 'g' },
  dietary_fiber_g: { label: 'Dietary fiber', unit: 'g' },
  total_polyols_g: { label: 'Polyols', unit: 'g' },
  ash_g: { label: 'Ash', unit: 'g' },
  alcohol_g: { label: 'Alcohol', unit: 'g' },
  organic_acids_g: { label: 'Organic acids', unit: 'g' },
};

const SUGARS_META: Record<keyof Sugars, NutrientMeta> = {
  total_sugars_g: { label: 'Total sugars', unit: 'g' },
  fructose_g: { label: 'Fructose', unit: 'g' },
  galactose_g: { label: 'Galactose', unit: 'g' },
  glucose_g: { label: 'Glucose', unit: 'g' },
  lactose_g: { label: 'Lactose', unit: 'g' },
  maltose_g: { label: 'Maltose', unit: 'g' },
  sucrose_g: { label: 'Sucrose', unit: 'g' },
  starch_g: { label: 'Starch', unit: 'g' },
};

const FATTY_ACIDS_META: Record<keyof FattyAcids, NutrientMeta> = {
  saturated_g: { label: 'Saturated', unit: 'g' },
  monounsaturated_g: { label: 'Monounsaturated', unit: 'g' },
  polyunsaturated_g: { label: 'Polyunsaturated', unit: 'g' },
  butyric_acid_4_0_g: { label: 'Butyric acid (4:0)', unit: 'g' },
  caproic_acid_6_0_g: { label: 'Caproic acid (6:0)', unit: 'g' },
  caprylic_acid_8_0_g: { label: 'Caprylic acid (8:0)', unit: 'g' },
  capric_acid_10_0_g: { label: 'Capric acid (10:0)', unit: 'g' },
  lauric_acid_12_0_g: { label: 'Lauric acid (12:0)', unit: 'g' },
  myristic_acid_14_0_g: { label: 'Myristic acid (14:0)', unit: 'g' },
  palmitic_acid_16_0_g: { label: 'Palmitic acid (16:0)', unit: 'g' },
  stearic_acid_18_0_g: { label: 'Stearic acid (18:0)', unit: 'g' },
  oleic_acid_18_1_g: { label: 'Oleic acid (18:1)', unit: 'g' },
  linoleic_acid_18_2_g: { label: 'Linoleic acid (18:2)', unit: 'g' },
  alpha_linolenic_acid_18_3_g: { label: 'Alpha-linolenic acid (18:3)', unit: 'g' },
  arachidonic_acid_20_4_g: { label: 'Arachidonic acid (20:4)', unit: 'g' },
  epa_20_5_g: { label: 'EPA (20:5)', unit: 'g' },
  dha_22_6_g: { label: 'DHA (22:6)', unit: 'g' },
};

const MINERALS_META: Record<keyof Minerals, NutrientMeta> = {
  cholesterol_mg: { label: 'Cholesterol', unit: 'mg' },
  sodium_chloride_g: { label: 'Salt', unit: 'g' },
  calcium_mg: { label: 'Calcium', unit: 'mg' },
  chloride_mg: { label: 'Chloride', unit: 'mg' },
  copper_mg: { label: 'Copper', unit: 'mg' },
  iron_mg: { label: 'Iron', unit: 'mg' },
  iodine_ug: { label: 'Iodine', unit: 'µg' },
  magnesium_mg: { label: 'Magnesium', unit: 'mg' },
  manganese_mg: { label: 'Manganese', unit: 'mg' },
  phosphorus_mg: { label: 'Phosphorus', unit: 'mg' },
  potassium_mg: { label: 'Potassium', unit: 'mg' },
  selenium_ug: { label: 'Selenium', unit: 'µg' },
  sodium_mg: { label: 'Sodium', unit: 'mg' },
  zinc_mg: { label: 'Zinc', unit: 'mg' },
};

const VITAMINS_META: Record<keyof Vitamins, NutrientMeta> = {
  retinol_ug: { label: 'Retinol', unit: 'µg' },
  beta_carotene_ug: { label: 'Beta-carotene', unit: 'µg' },
  vitamin_d_ug: { label: 'Vitamin D', unit: 'µg' },
  vitamin_e_mg: { label: 'Vitamin E', unit: 'mg' },
  vitamin_k1_ug: { label: 'Vitamin K1', unit: 'µg' },
  vitamin_k2_ug: { label: 'Vitamin K2', unit: 'µg' },
  vitamin_c_mg: { label: 'Vitamin C', unit: 'mg' },
  vitamin_b1_mg: { label: 'Vitamin B1 (thiamine)', unit: 'mg' },
  vitamin_b2_mg: { label: 'Vitamin B2 (riboflavin)', unit: 'mg' },
  vitamin_b3_mg: { label: 'Vitamin B3 (niacin)', unit: 'mg' },
  vitamin_b5_mg: { label: 'Vitamin B5 (pantothenic acid)', unit: 'mg' },
  vitamin_b6_mg: { label: 'Vitamin B6', unit: 'mg' },
  vitamin_b9_ug: { label: 'Vitamin B9 (folate)', unit: 'µg' },
  vitamin_b12_ug: { label: 'Vitamin B12', unit: 'µg' },
};

function section<T extends object>(
  title: string,
  values: T,
  meta: Record<keyof T, NutrientMeta>,
): NutrientSection {
  const entries = (Object.keys(meta) as (keyof T)[])
    .filter((key) => values[key] !== null)
    .map((key) => {
      const nutrientMeta = meta[key];
      return {
        label: nutrientMeta.label,
        value: `${values[key]}${nutrientMeta.unit ? ' ' + nutrientMeta.unit : ''}`,
      };
    });
  return { title, entries };
}

export function nutrientSections(nutrition: NutritionalComposition): readonly NutrientSection[] {
  return [
    section('Energy', nutrition.energy, ENERGY_META),
    section('Macronutrients', nutrition.macronutrients, MACRONUTRIENTS_META),
    section('Sugars', nutrition.sugars, SUGARS_META),
    section('Fatty acids', nutrition.fatty_acids, FATTY_ACIDS_META),
    section('Minerals', nutrition.minerals, MINERALS_META),
    section('Vitamins', nutrition.vitamins, VITAMINS_META),
  ].filter((group) => group.entries.length > 0);
}
