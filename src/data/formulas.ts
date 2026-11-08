/**
 * The ChemBank formula sheet. Every expression is written in KaTeX syntax so
 * the same string can render on the web page and in a printed revision sheet.
 * Groupings follow the seven supplied chapter papers plus the analytical and
 * laboratory topics that cut across them.
 */

export interface Formula {
  name: string;
  tex: string;
  note?: string;
}

export interface FormulaSection {
  slug: string;
  title: string;
  summary: string;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  formulas: Formula[];
}

export interface PhysicalConstant {
  symbol: string;
  name: string;
  value: string;
  unit: string;
  note?: string;
}

export interface RuleGroup {
  heading: string;
  rules: string[];
}

/** CODATA-style values rounded for exam work. */
export const CONSTANTS: PhysicalConstant[] = [
  {
    symbol: "N_A",
    name: "Avogadro constant",
    value: "6.022 140 76 × 10²³",
    unit: "mol⁻¹",
    note: "Exact by definition of the mole.",
  },
  {
    symbol: "R",
    name: "Molar gas constant",
    value: "8.314 462 618",
    unit: "J mol⁻¹ K⁻¹",
    note: "Also 0.082 057 L atm mol⁻¹ K⁻¹.",
  },
  {
    symbol: "k_B",
    name: "Boltzmann constant",
    value: "1.380 649 × 10⁻²³",
    unit: "J K⁻¹",
    note: "R = N_A k_B.",
  },
  {
    symbol: "F",
    name: "Faraday constant",
    value: "96 485.332 12",
    unit: "C mol⁻¹",
    note: "Charge on one mole of electrons.",
  },
  {
    symbol: "h",
    name: "Planck constant",
    value: "6.626 070 15 × 10⁻³⁴",
    unit: "J s",
  },
  {
    symbol: "c",
    name: "Speed of light in vacuum",
    value: "2.997 924 58 × 10⁸",
    unit: "m s⁻¹",
  },
  {
    symbol: "e",
    name: "Elementary charge",
    value: "1.602 176 634 × 10⁻¹⁹",
    unit: "C",
  },
  {
    symbol: "m_e",
    name: "Electron rest mass",
    value: "9.109 383 7 × 10⁻³¹",
    unit: "kg",
  },
  {
    symbol: "R_H",
    name: "Rydberg constant",
    value: "1.097 373 156 8 × 10⁷",
    unit: "m⁻¹",
  },
  {
    symbol: "g",
    name: "Standard gravitational acceleration",
    value: "9.806 65",
    unit: "m s⁻²",
  },
  {
    symbol: "P°",
    name: "Standard pressure",
    value: "1",
    unit: "bar (10⁵ Pa)",
    note: "1 atm = 101 325 Pa.",
  },
  {
    symbol: "T°",
    name: "Standard temperature",
    value: "273.15",
    unit: "K",
  },
  {
    symbol: "c_w",
    name: "Specific heat of liquid water",
    value: "4.184",
    unit: "J g⁻¹ K⁻¹",
    note: "At 25 °C; 1 cal = 4.184 J.",
  },
  {
    symbol: "ρ_w",
    name: "Density of liquid water",
    value: "0.997 0",
    unit: "g mL⁻¹",
    note: "At 25 °C; use 1.00 g mL⁻¹ for rough work.",
  },
  {
    symbol: "K_w",
    name: "Ion-product constant of water",
    value: "1.0 × 10⁻¹⁴",
    unit: "(mol L⁻¹)²",
    note: "At 25 °C; pH 7 is neutral only at this temperature.",
  },
];

export const FORMULA_SECTIONS: FormulaSection[] = [
  {
    slug: "measurement",
    title: "Measurement, units, and error",
    summary:
      "Convert first, then calculate. Significant figures describe the measurement, not the arithmetic.",
    chapter: 1,
    formulas: [
      {
        name: "Density",
        tex: String.raw`\rho = \frac{m}{V}`,
        note: "Mass per unit volume; g mL⁻¹ and g cm⁻³ are numerically equal.",
      },
      {
        name: "Temperature conversion",
        tex: String.raw`T_{\mathrm{K}} = T_{^{\circ}\mathrm{C}} + 273.15`,
      },
      {
        name: "Relative uncertainty",
        tex: String.raw`\text{relative uncertainty} = \frac{\delta x}{x}`,
        note: "Multiply by 100% for percentage uncertainty.",
      },
      {
        name: "Error propagation: sums and differences",
        tex: String.raw`\delta q = \sqrt{(\delta a)^2 + (\delta b)^2}`,
        note: "Absolute uncertainties add in quadrature for independent random errors.",
      },
      {
        name: "Error propagation: products and quotients",
        tex: String.raw`\frac{\delta q}{q} = \sqrt{\left(\frac{\delta a}{a}\right)^2 + \left(\frac{\delta b}{b}\right)^2}`,
      },
      {
        name: "Error propagation: powers",
        tex: String.raw`q = a^n \quad\Rightarrow\quad \frac{\delta q}{q} = |n|\,\frac{\delta a}{a}`,
      },
      {
        name: "Percent error",
        tex: String.raw`\%\ \text{error} = \frac{|\text{measured} - \text{accepted}|}{\text{accepted}} \times 100\%`,
      },
      {
        name: "Percent yield",
        tex: String.raw`\%\ \text{yield} = \frac{\text{actual yield}}{\text{theoretical yield}} \times 100\%`,
      },
    ],
  },
  {
    slug: "atomic-structure",
    title: "Atoms, moles, and formulas",
    summary:
      "The mole is the bridge between counted particles and weighed samples. Charge balance writes the formula.",
    chapter: 2,
    formulas: [
      {
        name: "Mass number",
        tex: String.raw`A = Z + N`,
      },
      {
        name: "Average atomic mass",
        tex: String.raw`\bar{m} = \sum_i f_i\,m_i`,
        note: "f_i is the fractional abundance of isotope i.",
      },
      {
        name: "Mole definition",
        tex: String.raw`n = \frac{N}{N_A}`,
      },
      {
        name: "Moles from mass",
        tex: String.raw`n = \frac{m}{M}`,
      },
      {
        name: "Mass percent of an element",
        tex: String.raw`\%\,E = \frac{n_E M_E}{M_{\text{compound}}} \times 100\%`,
      },
      {
        name: "Empirical formula from mass percent",
        tex: String.raw`n_i = \frac{\%\,i}{M_i} \quad\Rightarrow\quad \text{divide by the smallest } n_i`,
      },
      {
        name: "Molecular formula from empirical formula",
        tex: String.raw`\text{molecular formula} = \left(\text{empirical formula}\right)_k,\qquad k = \frac{M_{\text{molecular}}}{M_{\text{empirical}}}`,
      },
      {
        name: "Ion charge",
        tex: String.raw`\text{charge} = (\text{protons}) - (\text{electrons})`,
      },
    ],
  },
  {
    slug: "stoichiometry",
    title: "Stoichiometry and limiting reagents",
    summary:
      "Balance the equation, convert to moles, compare the mole ratios, then convert back to the requested unit.",
    chapter: 3,
    formulas: [
      {
        name: "Mole ratio",
        tex: String.raw`n_B = n_A \times \frac{b}{a}`,
        note: "For aA → bB after the equation is balanced.",
      },
      {
        name: "Limiting-reagent test",
        tex: String.raw`\text{compare } \frac{n_A}{a}\ \text{and}\ \frac{n_B}{b}`,
        note: "The smaller quotient is limiting.",
      },
      {
        name: "Theoretical yield",
        tex: String.raw`m_{\text{product}} = n_{\text{limiting}} \times \frac{\text{coefficient of product}}{\text{coefficient of limiting}} \times M_{\text{product}}`,
      },
      {
        name: "Percent yield",
        tex: String.raw`\%\ \text{yield} = \frac{m_{\text{actual}}}{m_{\text{theoretical}}} \times 100\%`,
      },
      {
        name: "Molarity",
        tex: String.raw`c = \frac{n}{V}`,
        note: "V in litres when c is mol L⁻¹.",
      },
      {
        name: "Dilution",
        tex: String.raw`c_1 V_1 = c_2 V_2`,
        note: "Moles of solute are conserved.",
      },
      {
        name: "Mass–volume bridge",
        tex: String.raw`n = \frac{m}{M} = cV = \frac{PV}{RT}`,
      },
    ],
  },
  {
    slug: "aqueous-and-redox",
    title: "Aqueous reactions, redox, and titration",
    summary:
      "Net ionic equations keep only the species that change. Redox is electron bookkeeping; titration is mole bookkeeping.",
    chapter: 4,
    formulas: [
      {
        name: "Moles from titration",
        tex: String.raw`n_{\text{analyte}} = \frac{a}{b}\,c_{\text{titrant}}V_{\text{titrant}}`,
        note: "a/b is the analyte-to-titrant mole ratio from the balanced equation; it is not always 1:1.",
      },
      {
        name: "Titration with a 1:1 ratio",
        tex: String.raw`c_A V_A = c_B V_B`,
      },
      {
        name: "Back-titration",
        tex: String.raw`n_{\text{analyte}} = n_{\text{reagent total}} - n_{\text{reagent excess}}`,
      },
      {
        name: "Oxidation number of an atom",
        tex: String.raw`\sum_i \left(\text{oxidation state}\right)_i = \text{overall charge}`,
      },
      {
        name: "Electrons transferred",
        tex: String.raw`n_e = n_{\text{substance}} \times (\text{electrons per formula unit})`,
      },
      {
        name: "Gravimetric percent composition",
        tex: String.raw`\%\,X = \frac{m_X}{m_{\text{sample}}} \times 100\%`,
        note: "m_X is the mass of X in the weighed precipitate, converted by formula mass.",
      },
      {
        name: "Solubility product",
        tex: String.raw`K_{sp} = [A^+]^a[B^-]^b`,
        note: "For A_aB_b(s) dissolving to a A⁺ + b B⁻.",
      },
    ],
  },
  {
    slug: "gases",
    title: "Gases and kinetic theory",
    summary:
      "Use kelvin, match the pressure and volume units to the gas constant, and correct collected gas for water vapour.",
    chapter: 5,
    formulas: [
      {
        name: "Ideal gas law",
        tex: String.raw`PV = nRT`,
      },
      {
        name: "Combined gas law",
        tex: String.raw`\frac{P_1 V_1}{T_1} = \frac{P_2 V_2}{T_2}`,
      },
      {
        name: "Dalton's law of partial pressures",
        tex: String.raw`P_{\text{total}} = \sum_i P_i`,
      },
      {
        name: "Partial pressure from mole fraction",
        tex: String.raw`P_i = x_i P_{\text{total}},\qquad x_i = \frac{n_i}{n_{\text{total}}}`,
      },
      {
        name: "Gas collected over water",
        tex: String.raw`P_{\text{dry gas}} = P_{\text{barometric}} - P_{\mathrm{H_2O}}`,
        note: "Use the vapour pressure at the measured temperature.",
      },
      {
        name: "Molar mass from gas density",
        tex: String.raw`M = \frac{mRT}{PV} = \frac{\rho RT}{P}`,
      },
      {
        name: "Root-mean-square speed",
        tex: String.raw`u_{\text{rms}} = \sqrt{\frac{3RT}{M}}`,
        note: "M in kg mol⁻¹.",
      },
      {
        name: "Graham's law of effusion",
        tex: String.raw`\frac{r_1}{r_2} = \sqrt{\frac{M_2}{M_1}}`,
      },
      {
        name: "van der Waals equation",
        tex: String.raw`\left(P + \frac{an^2}{V^2}\right)(V - nb) = nRT`,
      },
    ],
  },
  {
    slug: "thermochemistry",
    title: "Thermochemistry and calorimetry",
    summary:
      "Heat is a path function; enthalpy is a state function. Signs matter more than arithmetic elegance.",
    chapter: 6,
    formulas: [
      {
        name: "Heat transfer",
        tex: String.raw`q = mc\Delta T`,
      },
      {
        name: "Calorimetry with heat capacity",
        tex: String.raw`q = C\Delta T`,
      },
      {
        name: "Enthalpy change per mole",
        tex: String.raw`\Delta H = \frac{q_p}{n}`,
      },
      {
        name: "Hess's law",
        tex: String.raw`\Delta H_{\text{reaction}} = \sum \Delta H_f^{\circ}(\text{products}) - \sum \Delta H_f^{\circ}(\text{reactants})`,
      },
      {
        name: "Bond-enthalpy estimate",
        tex: String.raw`\Delta H \approx \sum D_{\text{broken}} - \sum D_{\text{formed}}`,
      },
      {
        name: "Internal energy",
        tex: String.raw`\Delta U = q + w`,
      },
      {
        name: "Pressure–volume work",
        tex: String.raw`w = -P_{\text{ext}}\Delta V`,
      },
      {
        name: "Enthalpy from internal energy",
        tex: String.raw`\Delta H = \Delta U + \Delta(PV) \approx \Delta U + \Delta n_g RT`,
      },
      {
        name: "Gibbs energy",
        tex: String.raw`\Delta G^{\circ} = \Delta H^{\circ} - T\Delta S^{\circ}`,
      },
    ],
  },
  {
    slug: "quantum",
    title: "Quantum theory, structure, and spectroscopy",
    summary:
      "Quantisation shows up as discrete lines. Convert between wavelength, frequency, and energy before comparing.",
    chapter: 7,
    formulas: [
      {
        name: "Photon energy",
        tex: String.raw`E = h\nu = \frac{hc}{\lambda}`,
      },
      {
        name: "Wave relation",
        tex: String.raw`c = \lambda\nu`,
      },
      {
        name: "de Broglie wavelength",
        tex: String.raw`\lambda = \frac{h}{mv}`,
      },
      {
        name: "Rydberg equation",
        tex: String.raw`\frac{1}{\lambda} = R_H\left(\frac{1}{n_1^2} - \frac{1}{n_2^2}\right),\qquad n_2 > n_1`,
      },
      {
        name: "Orbital count in a shell",
        tex: String.raw`\text{orbitals} = n^2,\qquad \text{electron capacity} = 2n^2`,
      },
      {
        name: "Photon energy from an electron transition",
        tex: String.raw`\Delta E = -2.18\times 10^{-18}\ \mathrm{J}\left(\frac{1}{n_f^2} - \frac{1}{n_i^2}\right)`,
        note: "Hydrogen atom; the negative sign means emission when n_i > n_f.",
      },
      {
        name: "Beer–Lambert law",
        tex: String.raw`A = \varepsilon bc`,
        note: "A is absorbance, ε molar absorptivity, b path length, c concentration.",
      },
      {
        name: "Transmittance",
        tex: String.raw`A = -\log_{10} T,\qquad T = \frac{I}{I_0}`,
      },
    ],
  },
  {
    slug: "equilibrium",
    title: "Equilibrium, acids, and bases",
    summary:
      "Write the equilibrium expression from the balanced equation, then decide whether an approximation is honest.",
    formulas: [
      {
        name: "Equilibrium constant",
        tex: String.raw`K_c = \frac{\prod [\text{products}]^{\nu}}{\prod [\text{reactants}]^{\nu}}`,
        note: "Pure solids and liquids do not appear in the expression.",
      },
      {
        name: "Reaction quotient",
        tex: String.raw`Q = \frac{\prod [\text{products}]^{\nu}}{\prod [\text{reactants}]^{\nu}}`,
        note: "Q < K shifts right; Q > K shifts left.",
      },
      {
        name: "K_p and K_c",
        tex: String.raw`K_p = K_c(RT)^{\Delta n_g}`,
      },
      {
        name: "Acid dissociation constant",
        tex: String.raw`K_a = \frac{[\mathrm{H^+}][\mathrm{A^-}]}{[\mathrm{HA}]}`,
      },
      {
        name: "Base dissociation constant",
        tex: String.raw`K_b = \frac{[\mathrm{BH^+}][\mathrm{OH^-}]}{[\mathrm{B}]}`,
      },
      {
        name: "Conjugate pair relation",
        tex: String.raw`K_a K_b = K_w`,
      },
      {
        name: "pH and pOH",
        tex: String.raw`\mathrm{pH} = -\log[\mathrm{H^+}],\qquad \mathrm{pOH} = -\log[\mathrm{OH^-}],\qquad \mathrm{pH} + \mathrm{pOH} = 14.00`,
      },
      {
        name: "Weak-acid approximation",
        tex: String.raw`[\mathrm{H^+}] \approx \sqrt{K_a c_0}`,
        note: "Valid when the percent dissociation is small (roughly < 5%).",
      },
      {
        name: "Henderson–Hasselbalch",
        tex: String.raw`\mathrm{pH} = \mathrm{p}K_a + \log\frac{[\mathrm{A^-}]}{[\mathrm{HA}]}`,
      },
      {
        name: "Buffer capacity check",
        tex: String.raw`\text{buffer works best when } \frac{[\mathrm{A^-}]}{[\mathrm{HA}]}\ \text{is between } 0.1\ \text{and } 10`,
      },
    ],
  },
  {
    slug: "electrochemistry",
    title: "Electrochemistry",
    summary:
      "Cell potential is a state function: add half-reactions only after reversing the oxidation couple and changing its sign.",
    formulas: [
      {
        name: "Standard cell potential",
        tex: String.raw`E^{\circ}_{\text{cell}} = E^{\circ}_{\text{cathode}} - E^{\circ}_{\text{anode}}`,
        note: "Cathode is reduction; anode is oxidation.",
      },
      {
        name: "Cell potential and free energy",
        tex: String.raw`\Delta G^{\circ} = -nFE^{\circ}_{\text{cell}}`,
      },
      {
        name: "Nernst equation",
        tex: String.raw`E = E^{\circ} - \frac{RT}{nF}\ln Q`,
        note: "At 25 °C: E = E° − (0.0592 V/n) log Q.",
      },
      {
        name: "Equilibrium from potential",
        tex: String.raw`\log K = \frac{nE^{\circ}}{0.0592\ \mathrm{V}}`,
        note: "25 °C.",
      },
      {
        name: "Charge passed",
        tex: String.raw`Q = It`,
      },
      {
        name: "Moles from electrolysis",
        tex: String.raw`n = \frac{It}{n_e F}`,
        note: "n_e is the number of electrons per mole of product.",
      },
      {
        name: "Mass deposited",
        tex: String.raw`m = \frac{MIt}{n_eF}`,
      },
    ],
  },
  {
    slug: "solutions",
    title: "Solutions, colligative properties, and kinetics",
    summary:
      "Concentration has several equivalent currencies; colligative properties count particles, and kinetics reads the rate law from experiment.",
    formulas: [
      {
        name: "Mass percent",
        tex: String.raw`\%\ \text{by mass} = \frac{m_{\text{solute}}}{m_{\text{solution}}} \times 100\%`,
      },
      {
        name: "Mole fraction",
        tex: String.raw`x_i = \frac{n_i}{\sum_j n_j}`,
      },
      {
        name: "Molality",
        tex: String.raw`m = \frac{n_{\text{solute}}}{m_{\text{solvent in kg}}}`,
      },
      {
        name: "Molarity from density and mass percent",
        tex: String.raw`c = \frac{10\,\rho\,(\%\,\text{by mass})}{M}`,
        note: "ρ in g mL⁻¹ gives c in mol L⁻¹.",
      },
      {
        name: "Dilution",
        tex: String.raw`c_1V_1 = c_2V_2`,
      },
      {
        name: "Raoult's law",
        tex: String.raw`P_{\text{solution}} = x_{\text{solvent}}P^{\circ}_{\text{solvent}}`,
      },
      {
        name: "Boiling-point elevation",
        tex: String.raw`\Delta T_b = iK_b m`,
      },
      {
        name: "Freezing-point depression",
        tex: String.raw`\Delta T_f = iK_f m`,
      },
      {
        name: "Osmotic pressure",
        tex: String.raw`\Pi = iMRT`,
      },
      {
        name: "Rate law",
        tex: String.raw`\text{rate} = k[A]^m[B]^n`,
        note: "Exponents are experimental orders, not stoichiometric coefficients.",
      },
      {
        name: "First-order integrated rate law",
        tex: String.raw`\ln[A]_t = \ln[A]_0 - kt,\qquad t_{1/2} = \frac{\ln 2}{k}`,
      },
      {
        name: "Arrhenius equation",
        tex: String.raw`k = Ae^{-E_a/(RT)},\qquad \ln\frac{k_2}{k_1} = \frac{E_a}{R}\left(\frac{1}{T_1} - \frac{1}{T_2}\right)`,
      },
    ],
  },
  {
    slug: "laboratory",
    title: "Laboratory calculations",
    summary:
      "The bench answer is only as good as the glassware and the blank. Carry the uncertainty through every step.",
    formulas: [
      {
        name: "Mean",
        tex: String.raw`\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i`,
      },
      {
        name: "Sample standard deviation",
        tex: String.raw`s = \sqrt{\frac{\sum (x_i - \bar{x})^2}{n-1}}`,
      },
      {
        name: "Standard error of the mean",
        tex: String.raw`\mathrm{SEM} = \frac{s}{\sqrt{n}}`,
      },
      {
        name: "Confidence interval",
        tex: String.raw`\mu = \bar{x} \pm \frac{ts}{\sqrt{n}}`,
        note: "t is the two-tailed Student value for the chosen confidence and n − 1 degrees of freedom.",
      },
      {
        name: "Propagation for a sum",
        tex: String.raw`\delta q = \sqrt{\sum_i (\delta x_i)^2}`,
      },
      {
        name: "Propagation for a product",
        tex: String.raw`\frac{\delta q}{q} = \sqrt{\sum_i \left(\frac{\delta x_i}{x_i}\right)^2}`,
      },
      {
        name: "Percent relative error",
        tex: String.raw`\%\ \text{relative error} = \frac{|\text{measured} - \text{true}|}{\text{true}} \times 100\%`,
      },
      {
        name: "Distribution coefficient",
        tex: String.raw`K_D = \frac{[\text{solute}]_{\text{organic}}}{[\text{solute}]_{\text{aqueous}}}`,
      },
    ],
  },
];

export const SOLUBILITY_RULES: RuleGroup[] = [
  {
    heading: "Always soluble",
    rules: [
      "Group 1 (Li⁺, Na⁺, K⁺, Rb⁺, Cs⁺) and ammonium (NH₄⁺) salts.",
      "Nitrates (NO₃⁻), acetates (CH₃COO⁻), and perchlorates (ClO₄⁻).",
      "Most chlorides, bromides, and iodides — except Ag⁺, Pb²⁺, and Hg₂²⁺.",
      "Most sulfates — except BaSO₄, PbSO₄, Hg₂SO₄, and CaSO₄ (slightly soluble).",
    ],
  },
  {
    heading: "Usually insoluble",
    rules: [
      "Carbonates and phosphates — except with group 1 cations or NH₄⁺.",
      "Hydroxides — except group 1 cations, NH₄⁺, and the larger alkaline-earth hydroxides (Ca(OH)₂ is slightly soluble; Ba(OH)₂ is soluble).",
      "Sulfides — except group 1, NH₄⁺, and the alkaline earths.",
      "Oxides — most metal oxides are insoluble and react with water to give hydroxides.",
    ],
  },
  {
    heading: "Exam reminders",
    rules: [
      "A “soluble” salt can still have a small K_sp; solubility rules are a starting point, not a thermodynamic guarantee.",
      "Always write the net ionic equation after removing spectator ions.",
      "Check charge balance and atom balance after splitting strong electrolytes.",
    ],
  },
];

/** Standard reduction potentials are listed as oxidised form / reduced form. */
export const ACTIVITY_SERIES: string[] = [
  "Li⁺ / Li",
  "K⁺ / K",
  "Ba²⁺ / Ba",
  "Ca²⁺ / Ca",
  "Na⁺ / Na",
  "Mg²⁺ / Mg",
  "Al³⁺ / Al",
  "Zn²⁺ / Zn",
  "Cr³⁺ / Cr",
  "Fe²⁺ / Fe",
  "Cd²⁺ / Cd",
  "Ni²⁺ / Ni",
  "Sn²⁺ / Sn",
  "Pb²⁺ / Pb",
  "H⁺ / H₂",
  "Cu²⁺ / Cu",
  "Ag⁺ / Ag",
  "Hg₂²⁺ / Hg",
  "Au³⁺ / Au",
];

export const ACTIVITY_NOTE =
  "A metal higher in the series displaces the ion of a metal below it. The series is qualitative: use standard reduction potentials for quantitative work.";
