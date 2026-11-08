/**
 * Seven chapter guides. Each note is original prose written for ChemBank:
 * the big idea, the working formulas, the traps that cost marks, and a short
 * checklist. Chapter numbers map to the supplied Ch 1–7 papers and the
 * `chapter` field on every question.
 */
export interface ChapterNote {
  slug: string;
  chapter: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  summary: string;
  bigIdea: string;
  formulas: string[];
  traps: string[];
  checklist: string[];
}

export const CHAPTER_NOTES: ChapterNote[] = [
  {
    slug: "matter-measurement",
    chapter: 1,
    title: "Matter, measurement, and density",
    summary:
      "Units, significant figures, precision, and the density bridge between mass and volume.",
    bigIdea:
      "Every number in chemistry carries two pieces of information: its size and its trustworthiness. Measurement is the discipline of keeping those two together. Convert to SI early, count significant figures only for measured quantities, and let the weakest measurement set the precision of the answer. Density, specific gravity, and percent composition are all ratio problems in disguise; write the units into the calculation and the algebra usually tells you which way to multiply.",
    formulas: [
      String.raw`\rho = \frac{m}{V}`,
      String.raw`\%\ \text{composition by mass} = \frac{\text{mass of component}}{\text{total mass}} \times 100\%`,
      String.raw`T(\text{K}) = T(^{\circ}\text{C}) + 273.15`,
      String.raw`1\ \text{cm}^{3} = 1\ \text{mL} = 10^{-3}\ \text{L}`,
      String.raw`\text{relative uncertainty} = \frac{\text{absolute uncertainty}}{\text{measured value}}`,
    ],
    traps: [
      "Counting leading zeros as significant (0.00420 has three significant figures, not six).",
      "Rounding intermediate values and carrying the error into the final answer; keep one guard digit and round once.",
      "Treating exact counts and defined conversions (12 inches per foot, 1000 mL per L) as measured values with limited figures.",
      "Mixing mass and weight, or using g/mL as if it were kg/m³ without converting.",
    ],
    checklist: [
      "Convert every quantity to a consistent unit system before calculating.",
      "Write the unit equation, then cancel units to check the operation.",
      "Round the final answer to the least precise input and state the unit.",
    ],
  },
  {
    slug: "atoms-ions-nomenclature",
    chapter: 2,
    title: "Atoms, ions, isotopes, and nomenclature",
    summary:
      "Atomic structure, isotope arithmetic, ion charges, and systematic naming.",
    bigIdea:
      "The periodic table is a charge map. Main-group metals lose electrons to reach the previous noble-gas core; nonmetals gain electrons to reach the next one. Isotopes differ only in neutron count, so chemistry stays the same while mass changes. Naming is a compression of that charge logic: the cation first, the anion second, with Roman numerals only where a metal can take more than one stable charge. Learn the polyatomic ions as units, not as collections of letters.",
    formulas: [
      String.raw`A = Z + N`,
      String.raw`\bar{m} = \sum_i f_i\, m_i`,
      String.raw`\text{charge} = \text{protons} - \text{electrons}`,
      String.raw`\text{ion charge from group: metals} = +\text{group number (1, 2, 3)}`,
      String.raw`\text{ion charge from group: nonmetals} = \text{group number} - 8`,
    ],
    traps: [
      "Confusing atomic number Z (protons) with mass number A (protons plus neutrons).",
      "Using the average atomic mass as if it were an integer mass for a single isotope.",
      "Writing iron(II) chloride as FeCl₃; the Roman numeral is part of the formula logic, not decoration.",
      "Forgetting that a polyatomic ion keeps its internal bonds when it takes a subscript in a compound.",
    ],
    checklist: [
      "Identify the element, then its group, then its most common ion charge.",
      "Balance the total positive and negative charge to write a neutral formula.",
      "Name the cation, then the anion; use prefixes only for molecular compounds.",
    ],
  },
  {
    slug: "stoichiometry",
    chapter: 3,
    title: "Moles, stoichiometry, and yield",
    summary:
      "Mole conversions, limiting reagents, theoretical yield, and solution stoichiometry.",
    bigIdea:
      "A balanced equation is a ratio machine. Convert every measured quantity to moles, divide by the coefficient to see which reactant runs out first, then convert the limiting reagent's moles into whatever the question asks for. The limiting reagent is not the one with the smaller mass or the smaller mole count; it is the one with the smaller mole-to-coefficient ratio. Percent yield compares what you actually obtained with what that ratio promised.",
    formulas: [
      String.raw`n = \frac{m}{M}`,
      String.raw`n = cV`,
      String.raw`\text{mole ratio} = \frac{n_{\text{substance}}}{\nu_{\text{substance}}}`,
      String.raw`\%\ \text{yield} = \frac{\text{actual yield}}{\text{theoretical yield}} \times 100\%`,
      String.raw`\text{percent purity} = \frac{\text{mass of pure substance}}{\text{mass of sample}} \times 100\%`,
      String.raw`\text{empirical formula from } \%: \text{divide by } A_r \text{, then by the smallest quotient}`,
    ],
    traps: [
      "Choosing the limiting reagent by smallest mass or smallest mole count instead of smallest mole/coefficient ratio.",
      "Using the excess reagent to compute product after the limiting reagent is exhausted.",
      "Forgetting to convert a solution volume from mL to L before using cV.",
      "Reporting a yield above 100% as if it were valid; it usually signals a wet or impure product.",
    ],
    checklist: [
      "Balance the equation and record the coefficient of every species.",
      "Convert all inputs to moles; divide each by its coefficient.",
      "Carry the limiting reagent through to the requested unit and check the magnitude.",
    ],
  },
  {
    slug: "aqueous-reactions",
    chapter: 4,
    title: "Aqueous reactions, redox, and titration",
    summary:
      "Solubility, precipitation, acid–base, redox balancing, and volumetric analysis.",
    bigIdea:
      "Aqueous chemistry is accounting with ions. Write the complete ionic equation, cancel spectators, and the net ionic equation exposes the actual reaction. For redox, balance electrons first, then atoms, then charge; in basic solution add hydroxide to both sides to neutralize hydrogen ions. Titration is stoichiometry at the equivalence point: moles of titrant equal moles of analyte times the reaction ratio, not necessarily a 1:1 ratio.",
    formulas: [
      String.raw`c_1V_1 = c_2V_2 \quad \text{(1:1 titration only)}`,
      String.raw`n_{\text{analyte}} = \frac{n_{\text{titrant}}}{\nu_{\text{titrant}}} \times \nu_{\text{analyte}}`,
      String.raw`\text{oxidation: loss of electrons; reduction: gain of electrons}`,
      String.raw`E^{\circ}_{\text{cell}} = E^{\circ}_{\text{cathode}} - E^{\circ}_{\text{anode}}`,
      String.raw`\text{mass of precipitate} = n_{\text{limiting ion}} \times M_{\text{precipitate}}`,
    ],
    traps: [
      "Using c₁V₁ = c₂V₂ when the acid and base react in a ratio other than 1:1 (for example H₂SO₄ + 2 NaOH).",
      "Forgetting that strong acids and soluble salts are written as separated ions in net ionic equations.",
      "Balancing redox by atoms alone and leaving the charge unbalanced.",
      "Reading a burette from the top of the meniscus or misreading the scale direction.",
    ],
    checklist: [
      "Classify the reaction before calculating: precipitation, acid–base, redox, or complexation.",
      "Write the net ionic equation and confirm charge balance.",
      "At the equivalence point, convert titrant moles through the balanced ratio.",
    ],
  },
  {
    slug: "gases",
    chapter: 5,
    title: "Gases and kinetic theory",
    summary:
      "Gas laws, partial pressures, effusion, real-gas corrections, and gas stoichiometry.",
    bigIdea:
      "The ideal-gas law is a single relationship with several disguises. Temperature must be absolute, volume must match the units of R, and amount must be in moles. Mixtures add partial pressures; reactions consume moles according to coefficients. Real gases deviate most at high pressure and low temperature, where molecular volume and attractions matter. Graham's law compares rates through the square root of molar mass, not through mass directly.",
    formulas: [
      String.raw`PV = nRT`,
      String.raw`P_{\text{total}} = \sum_i P_i`,
      String.raw`P_i = x_i P_{\text{total}}`,
      String.raw`\frac{r_1}{r_2} = \sqrt{\frac{M_2}{M_1}}`,
      String.raw`\left(P + \frac{an^2}{V^2}\right)(V - nb) = nRT`,
      String.raw`\frac{P_1V_1}{T_1} = \frac{P_2V_2}{T_2}`,
    ],
    traps: [
      "Using Celsius in any gas-law calculation; convert to kelvin first.",
      "Mixing R = 0.08206 L·atm/(mol·K) with pressure in kPa or volume in mL.",
      "Assuming the partial pressure of water vapour is zero for gas collected over water.",
      "Treating a gas produced in a reaction as if its moles equal the moles of solid consumed, ignoring coefficients.",
    ],
    checklist: [
      "List P, V, n, and T; convert to atm, L, mol, and K.",
      "For mixtures, find total moles or use mole fractions for partial pressures.",
      "Check whether the question asks for the gas at STP, at the lab conditions, or dry.",
    ],
  },
  {
    slug: "thermochemistry",
    chapter: 6,
    title: "Thermochemistry and calorimetry",
    summary:
      "Enthalpy, calorimetry, Hess's law, bond energies, and formation data.",
    bigIdea:
      "Energy is conserved, but the sign convention is where marks disappear. Define the system, decide whether heat leaves it (exothermic, ΔH < 0) or enters it (endothermic, ΔH > 0), and keep the surroundings' heat equal and opposite. Calorimetry measures q = mcΔT for the solution or calorimeter; Hess's law lets you add reactions and their enthalpies like algebra. Standard enthalpies of formation are per mole of compound formed from elements in their standard states.",
    formulas: [
      String.raw`q = mc\Delta T`,
      String.raw`q_{\text{reaction}} = -q_{\text{surroundings}}`,
      String.raw`\Delta H^{\circ}_{\text{rxn}} = \sum \nu \Delta H^{\circ}_{f}(\text{products}) - \sum \nu \Delta H^{\circ}_{f}(\text{reactants})`,
      String.raw`\Delta H = \sum \text{bonds broken} - \sum \text{bonds formed}`,
      String.raw`q_{\text{cal}} = C_{\text{cal}}\Delta T`,
    ],
    traps: [
      "Dropping the negative sign when heat is released to the surroundings.",
      "Using the mass of the solute instead of the total solution mass in q = mcΔT.",
      "Forgetting that ΔH°f for an element in its standard state is zero.",
      "Adding enthalpies without reversing the sign of reactions that were reversed.",
    ],
    checklist: [
      "Sketch the system and surroundings and mark the direction of heat flow.",
      "Convert all masses to grams and temperatures to a consistent change in °C or K.",
      "Check Hess's-law arithmetic by adding the reactions, not just the numbers.",
    ],
  },
  {
    slug: "quantum-periodicity",
    chapter: 7,
    title: "Quantum theory, periodicity, and spectroscopy",
    summary:
      "Quantum numbers, electron configuration, periodic trends, and light–matter interaction.",
    bigIdea:
      "Electrons occupy orbitals, not orbits. Four quantum numbers label a state; the Pauli principle forbids two electrons from sharing all four, and Hund's rule keeps degenerate orbitals singly occupied before pairing. Periodic trends follow from effective nuclear charge and shielding: atomic radius generally decreases across a period and increases down a group, while ionization energy and electronegativity move in the opposite direction. Spectroscopy connects photon energy to the gap between states.",
    formulas: [
      String.raw`E = h\nu = \frac{hc}{\lambda}`,
      String.raw`c = \lambda\nu`,
      String.raw`E_n = -\frac{R_H}{n^2}`,
      String.raw`\Delta E = R_H\left(\frac{1}{n_i^2} - \frac{1}{n_f^2}\right)`,
      String.raw`\lambda = \frac{h}{mv}`,
      String.raw`n = 1,2,\ldots;\quad l = 0,\ldots,n-1;\quad m_l = -l,\ldots,+l;\quad m_s = \pm\tfrac{1}{2}`,
    ],
    traps: [
      "Allowing l = n or m_l outside −l to +l.",
      "Filling the 4s orbital before 3d without checking the actual configuration and exceptions such as Cr and Cu.",
      "Using visible-light wavelength ranges as if they were energy ranges without converting through hc/λ.",
      "Assuming a larger atom always has a lower ionization energy; nuclear charge and shielding both matter.",
    ],
    checklist: [
      "Write the electron configuration and count valence electrons before predicting trends.",
      "Convert wavelength to frequency or energy with the correct unit for h and c.",
      "Check the quantum numbers of the final state against the allowed ranges.",
    ],
  },
];

/** Look up a note by URL slug. */
export function noteBySlug(slug: string): ChapterNote | undefined {
  return CHAPTER_NOTES.find((note) => note.slug === slug);
}
