// Nutrition field definitions and FDA 2020 Daily Value reference amounts.
// Used by both the recipe form (input) and recipe detail (display).
//
// dv: Daily Value in the same unit as the field. null = no official DV.
// indent: true = sub-item (displayed indented under a parent nutrient).

export const NUTRITION_GROUPS = [
  {
    key: 'macros',
    label: 'Macronutrients',
    fields: [
      { key: 'calories',           label: 'Calories',             unit: 'kcal',    dv: 2000  },
      { key: 'protein',            label: 'Protein',              unit: 'g',       dv: 50    },
      { key: 'totalFat',           label: 'Total Fat',            unit: 'g',       dv: 78    },
      { key: 'saturatedFat',       label: 'Saturated Fat',        unit: 'g',       dv: 20,   indent: true },
      { key: 'polyunsaturatedFat', label: 'Polyunsat. Fat',       unit: 'g',       dv: null, indent: true },
      { key: 'monounsaturatedFat', label: 'Monounsat. Fat',       unit: 'g',       dv: null, indent: true },
      { key: 'omega3',             label: 'Omega-3 (ALA)',        unit: 'g',       dv: null, indent: true },
      { key: 'cholesterol',        label: 'Cholesterol',          unit: 'mg',      dv: 300   },
      { key: 'totalCarbs',         label: 'Total Carbohydrates',  unit: 'g',       dv: 275   },
      { key: 'fiber',              label: 'Dietary Fiber',        unit: 'g',       dv: 28,   indent: true },
      { key: 'totalSugars',        label: 'Total Sugars',         unit: 'g',       dv: null, indent: true },
      { key: 'addedSugar',         label: 'Added Sugar',          unit: 'g',       dv: 50,   indent: true },
    ],
  },
  {
    key: 'minerals',
    label: 'Minerals',
    fields: [
      { key: 'calcium',     label: 'Calcium',     unit: 'mg', dv: 1300 },
      { key: 'potassium',   label: 'Potassium',   unit: 'mg', dv: 4700 },
      { key: 'copper',      label: 'Copper',      unit: 'mg', dv: 0.9  },
      { key: 'iron',        label: 'Iron',        unit: 'mg', dv: 18   },
      { key: 'magnesium',   label: 'Magnesium',   unit: 'mg', dv: 420  },
      { key: 'manganese',   label: 'Manganese',   unit: 'mg', dv: 2.3  },
      { key: 'selenium',    label: 'Selenium',    unit: 'μg', dv: 55   },
      { key: 'phosphorus',  label: 'Phosphorus',  unit: 'mg', dv: 1250 },
      { key: 'zinc',        label: 'Zinc',        unit: 'mg', dv: 11   },
      { key: 'sodium',      label: 'Sodium',      unit: 'mg', dv: 2300 },
    ],
  },
  {
    key: 'vitamins',
    label: 'Vitamins',
    fields: [
      { key: 'vitaminA',   label: 'Vitamin A',   unit: 'μg RAE', dv: 900  },
      { key: 'vitaminB6',  label: 'Vitamin B6',  unit: 'mg',     dv: 1.7  },
      { key: 'vitaminB12', label: 'Vitamin B12', unit: 'μg',     dv: 2.4  },
      { key: 'vitaminC',   label: 'Vitamin C',   unit: 'mg',     dv: 90   },
      { key: 'vitaminD',   label: 'Vitamin D',   unit: 'μg',     dv: 20   },
      { key: 'vitaminE',   label: 'Vitamin E',   unit: 'mg',     dv: 15   },
      { key: 'vitaminK',   label: 'Vitamin K',   unit: 'μg',     dv: 120  },
      { key: 'folate',     label: 'Folate',      unit: 'μg DFE', dv: 400  },
      { key: 'thiamin',    label: 'Thiamin',     unit: 'mg',     dv: 1.2  },
      { key: 'riboflavin', label: 'Riboflavin',  unit: 'mg',     dv: 1.3  },
      { key: 'niacin',     label: 'Niacin',      unit: 'mg',     dv: 16   },
      { key: 'choline',    label: 'Choline',     unit: 'mg',     dv: 550  },
    ],
  },
]

// All field keys in a flat list — useful for initialising empty nutrition objects.
export const ALL_NUTRITION_KEYS = NUTRITION_GROUPS.flatMap(g => g.fields.map(f => f.key))

/** Round a nutrition value for display (smart precision). */
export function fmtNutrient(value) {
  if (value === null || value === undefined) return null
  if (value >= 100) return Math.round(value)
  if (value >= 10)  return Math.round(value * 10) / 10
  return Math.round(value * 100) / 100
}

/** % DV colour class based on percentage (for the progress bar). */
export function dvColour(pct) {
  if (pct >= 30) return 'bg-indigo-500'
  if (pct >= 15) return 'bg-green-500'
  if (pct >= 5)  return 'bg-amber-400'
  return 'bg-slate-300'
}
