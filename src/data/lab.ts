/**
 * Bench techniques for the laboratory domain. Each entry is an original
 * ChemBank briefing: what the technique is for, how to carry it out, the
 * precision you can honestly claim, the errors that ruin the result, and the
 * exam traps that are easy to miss.
 */
export interface LabTechnique {
  slug: string;
  title: string;
  purpose: string;
  steps: string[];
  precision: string;
  errors: string[];
  examTraps: string[];
}

export const LAB_TECHNIQUES: LabTechnique[] = [
  {
    slug: "weighing",
    title: "Weighing and balance use",
    purpose:
      "Measure mass accurately enough that the uncertainty does not dominate the rest of the calculation.",
    steps: [
      "Level the balance, close the doors, and zero the display with an empty vessel.",
      "Use a weigh boat or beaker; never place chemicals directly on the pan.",
      "Tare the empty vessel, add the solid with a spatula, and read the mass after the display settles.",
      "Record the mass to the balance's displayed precision, not to an invented number of decimals.",
      "Clean the pan and leave the balance in the same state you found it.",
    ],
    precision:
      "Analytical balances typically read to 0.1 mg; top-pan balances to 0.01 g or 0.001 g. The last displayed digit is uncertain.",
    errors: [
      "Weighing a warm vessel: convection makes the reading drift.",
      "Touching the weighing boat with bare fingers and adding grease.",
      "Forgetting to tare after changing the vessel.",
      "Using a wet vessel or a hygroscopic solid that absorbs water while being weighed.",
    ],
    examTraps: [
      "Reporting a mass as 5.0 g from a 0.001 g balance, which understates the precision available.",
      "Adding the mass of the weigh boat to the substance mass after taring.",
      "Assuming the balance error is negligible when the sample is only a few milligrams.",
    ],
  },
  {
    slug: "volumetric-pipette",
    title: "Volumetric pipette",
    purpose:
      "Deliver one fixed, accurate volume of solution for dilution or titration.",
    steps: [
      "Rinse the pipette with the solution it will deliver, then discard the rinse.",
      "Fill above the mark with a bulb, then release slowly to the mark with the tip touching the vessel wall.",
      "Touch the tip to the receiving wall and let the liquid drain; do not blow out the last drop.",
      "Keep the pipette vertical and the meniscus at eye level when setting the mark.",
      "Never pipette by mouth.",
    ],
    precision:
      "A class-A 25 mL pipette is commonly calibrated to about ±0.03 mL. Use the manufacturer's tolerance for error propagation.",
    errors: [
      "Pipetting a cold or warm solution whose volume differs from the calibration temperature.",
      "Leaving an air bubble in the bulb.",
      "Blowing out the residual drop, which adds volume beyond the calibration.",
      "Using a pipette that has not been rinsed with the same solution.",
    ],
    examTraps: [
      "Treating the pipette volume as exact; it has a tolerance.",
      "Rinsing with water instead of the solution, which dilutes the delivered sample.",
      "Reading the meniscus from above or below eye level.",
    ],
  },
  {
    slug: "burette",
    title: "Burette and titration",
    purpose:
      "Deliver a variable, measured volume of titrant until the equivalence point.",
    steps: [
      "Rinse the burette with a little titrant, then fill it above the zero mark.",
      "Open the stopcock briefly to fill the tip and remove air bubbles.",
      "Record the initial reading with the meniscus at eye level; burettes read downward.",
      "Add titrant in a controlled stream with swirling, then dropwise near the endpoint.",
      "Record the final reading and subtract; use the volume delivered, not the final reading.",
    ],
    precision:
      "A 50 mL burette typically reads to 0.05 mL or 0.10 mL, and the delivered volume has an uncertainty of about twice the reading uncertainty.",
    errors: [
      "An air bubble in the tip that escapes during the titration.",
      "Not rinsing the burette with titrant, so the first portion is diluted.",
      "Parallax error when reading the meniscus.",
      "Overshooting the endpoint and back-titrating without accounting for the added excess.",
    ],
    examTraps: [
      "Using the final burette reading as the volume delivered.",
      "Averaging a rough trial with the concordant titres.",
      "Forgetting that the burette scale increases downward, so the volume is final minus initial.",
    ],
  },
  {
    slug: "back-titration",
    title: "Back-titration",
    purpose:
      "Measure an analyte that reacts slowly or incompletely by adding a known excess of reagent and titrating what remains.",
    steps: [
      "Add a precisely known excess of the first reagent to the sample.",
      "Allow the reaction to go to completion, with heating or waiting if the method requires it.",
      "Titrate the unreacted excess with a standardized second reagent.",
      "Subtract the excess from the amount added to obtain the amount that reacted.",
      "Carry the stoichiometric ratio through both reactions.",
    ],
    precision:
      "The uncertainty combines the volume uncertainty of the excess addition and the titration; it is usually larger than a direct titration.",
    errors: [
      "Assuming the first reaction went to completion when it did not.",
      "Using the wrong stoichiometric ratio for the excess reagent.",
      "Losing solution during heating or transfer.",
      "Titrating before the sample has cooled to the calibration temperature.",
    ],
    examTraps: [
      "Subtracting volumes directly when the two reagents have different concentrations.",
      "Forgetting that the excess reagent, not the original sample, is what the burette measures.",
      "Ignoring the volume of the excess reagent in the final dilution.",
    ],
  },
  {
    slug: "gravimetric-filtration",
    title: "Gravimetric filtration",
    purpose:
      "Isolate a precipitate, dry it, and weigh it to determine the amount of analyte.",
    steps: [
      "Digest the precipitate so particles grow and pass less through the filter.",
      "Decant the supernatant through a weighed, prepared filter or crucible.",
      "Wash the precipitate with an appropriate wash liquid to remove soluble impurities.",
      "Dry or ignite to constant mass under the specified conditions.",
      "Cool in a desiccator before weighing; record the constant mass.",
    ],
    precision:
      "The final uncertainty is dominated by the balance and by whether constant mass was truly reached.",
    errors: [
      "Filtering before digestion, so fine particles pass through.",
      "Washing with a liquid that dissolves part of the precipitate.",
      "Weighing a hot crucible, which reads low because of convection.",
      "Not drying to constant mass, leaving hidden water.",
    ],
    examTraps: [
      "Using the mass of the filter paper alone instead of the dried precipitate.",
      "Forgetting to convert the precipitate mass to moles of analyte using the formula weight.",
      "Assuming the precipitate is anhydrous when the method specifies a hydrated form.",
    ],
  },
  {
    slug: "drying-ignition",
    title: "Drying and ignition",
    purpose:
      "Remove water or convert a solid to a stable weighing form before mass measurement.",
    steps: [
      "Heat the crucible or sample in a controlled oven or burner at the specified temperature.",
      "Cool in a desiccator to room temperature before weighing.",
      "Repeat heating, cooling, and weighing until the mass changes by less than the required tolerance.",
      "Record the constant mass and the conditions used.",
    ],
    precision:
      "Constant mass is the key criterion; the balance precision sets the numerical uncertainty.",
    errors: [
      "Overheating and decomposing the compound instead of drying it.",
      "Cooling in open air, where the sample reabsorbs moisture.",
      "Weighing while still warm.",
      "Stopping after one heating when the mass is still changing.",
    ],
    examTraps: [
      "Confusing drying (removing water) with ignition (decomposing or oxidizing).",
      "Using a desiccator as a place to cool a hot crucible without allowing time.",
      "Reporting a mass that was not constant.",
    ],
  },
  {
    slug: "calorimetry",
    title: "Calorimetry",
    purpose:
      "Measure the heat exchanged in a reaction or dissolution using a temperature change.",
    steps: [
      "Measure the mass of the solution or calorimeter contents.",
      "Record the initial temperature after thermal equilibration.",
      "Add the reactant, stir gently, and record the maximum or minimum temperature.",
      "Calculate q from the mass, specific heat, and temperature change.",
      "Correct for the calorimeter heat capacity if it is known.",
    ],
    precision:
      "Temperature uncertainty and heat loss dominate; a simple coffee-cup calorimeter is not a precision instrument.",
    errors: [
      "Heat loss to the surroundings during a slow reaction.",
      "Using the mass of the reactant instead of the total solution mass.",
      "Reading a thermometer before the temperature has stabilized.",
      "Assuming the specific heat of the solution equals pure water when it is concentrated.",
    ],
    examTraps: [
      "Forgetting the sign convention: the reaction's q is opposite the solution's q.",
      "Using ΔT in kelvin and then converting it again.",
      "Ignoring the heat capacity of the calorimeter when the method provides it.",
    ],
  },
  {
    slug: "gas-collection",
    title: "Gas collection over water",
    purpose:
      "Collect a gas produced in a reaction and measure its volume at known temperature and pressure.",
    steps: [
      "Fill the collection vessel with water and invert it in a water trough without introducing air.",
      "Run the reaction and let the gas displace the water.",
      "Equalize the water levels inside and outside so the gas pressure equals atmospheric pressure.",
      "Record the gas volume, the water temperature, and the barometric pressure.",
      "Subtract the vapour pressure of water at that temperature to obtain the dry gas pressure.",
    ],
    precision:
      "Volume and temperature readings dominate; the vapour-pressure correction is essential.",
    errors: [
      "Leaving air in the collection vessel.",
      "Not equalizing levels, so the gas pressure differs from atmospheric.",
      "Forgetting the water-vapour correction.",
      "Reading the volume before the apparatus has cooled to room temperature.",
    ],
    examTraps: [
      "Using the total pressure as the gas pressure without subtracting water vapour.",
      "Assuming the gas is dry when it was collected over water.",
      "Forgetting that the gas volume is at the temperature of the water, not the reaction flask.",
    ],
  },
  {
    slug: "manometer",
    title: "Manometer and pressure measurement",
    purpose:
      "Measure the pressure of a trapped gas relative to the atmosphere.",
    steps: [
      "Read the liquid level in both arms of the manometer.",
      "Determine which side is higher and whether the gas pressure is above or below atmospheric.",
      "Convert the height difference to pressure using the liquid density.",
      "Add or subtract the difference from atmospheric pressure as appropriate.",
    ],
    precision:
      "The height reading and the liquid density set the uncertainty; mercury and water differ by a factor of about 13.6.",
    errors: [
      "Adding the height difference when the gas side is lower.",
      "Using the density of water for a mercury manometer.",
      "Reading the meniscus incorrectly.",
      "Ignoring atmospheric pressure when the question gives gauge pressure.",
    ],
    examTraps: [
      "Confusing gauge pressure with absolute pressure.",
      "Forgetting to convert mm Hg to atm when using R = 0.08206.",
      "Using the height difference as the total pressure.",
    ],
  },
  {
    slug: "ph-meter",
    title: "pH meter and electrode calibration",
    purpose:
      "Measure hydrogen-ion activity with a calibrated glass electrode.",
    steps: [
      "Calibrate with at least two buffers that bracket the expected pH.",
      "Rinse the electrode with distilled water and blot it gently; do not wipe.",
      "Immerse the electrode in the sample and stir at a consistent rate.",
      "Wait for a stable reading and record it with the temperature.",
      "Rinse and store the electrode in the recommended solution.",
    ],
    precision:
      "A calibrated meter commonly reads to 0.01 pH units; the calibration and junction potential limit the real accuracy.",
    errors: [
      "Calibrating with expired or contaminated buffers.",
      "Measuring a strongly alkaline solution without accounting for sodium error.",
      "Letting the electrode dry out.",
      "Reading before the value stabilizes.",
    ],
    examTraps: [
      "Treating pH as a concentration of H⁺ without activity corrections in concentrated solutions.",
      "Forgetting that pH is temperature-dependent.",
      "Using a pH meter to find an equivalence point without a titration curve.",
    ],
  },
  {
    slug: "spectrophotometry",
    title: "Spectrophotometry",
    purpose:
      "Determine concentration from absorbance using Beer–Lambert behaviour.",
    steps: [
      "Select a wavelength where the analyte absorbs strongly.",
      "Zero the instrument with a blank containing the same solvent and reagents.",
      "Prepare a calibration series and measure absorbance versus concentration.",
      "Measure the unknown under the same conditions.",
      "Use the calibration line, not a single-point ratio unless the method justifies it.",
    ],
    precision:
      "Absorbance is most reliable in the 0.1–1.0 range; stray light and cuvette handling limit accuracy.",
    errors: [
      "Fingerprints or scratches on the cuvette.",
      "Using a blank without the sample matrix.",
      "Measuring outside the linear range.",
      "Forgetting to warm or equilibrate samples to the same temperature.",
    ],
    examTraps: [
      "Assuming absorbance is proportional to concentration at any concentration.",
      "Using the wrong path length when the cuvette differs from the calibration.",
      "Reporting concentration without the dilution factor.",
    ],
  },
  {
    slug: "flame-test",
    title: "Flame test",
    purpose:
      "Identify metal cations from the colour emitted when their atoms are excited in a flame.",
    steps: [
      "Clean the wire with concentrated acid and heat until no colour is visible.",
      "Moisten the wire with the sample and place it in the hottest part of the flame.",
      "Observe the colour against a dark background.",
      "Confirm with a second test or a known standard when possible.",
    ],
    precision:
      "Qualitative, not quantitative; sodium contamination can mask other colours.",
    errors: [
      "A dirty wire carrying contamination from the previous sample.",
      "Using a cool flame that does not excite the atoms.",
      "Misreading a pale colour under poor lighting.",
    ],
    examTraps: [
      "Claiming a flame test identifies a specific compound rather than a metal ion.",
      "Forgetting that sodium's yellow emission is very strong and can hide potassium's lilac.",
      "Treating flame colour as quantitative evidence of concentration.",
    ],
  },
  {
    slug: "error-propagation",
    title: "Error propagation and significant figures",
    purpose:
      "Carry measurement uncertainty through a calculation and report an honest result.",
    steps: [
      "Identify which inputs are measured and which are exact definitions.",
      "For sums and differences, add absolute uncertainties.",
      "For products and quotients, add relative uncertainties.",
      "For powers, multiply the relative uncertainty by the exponent.",
      "Round the uncertainty to one or two significant figures and match the value's last digit.",
    ],
    precision:
      "Report the final value with its uncertainty and unit; do not imply more certainty than the inputs allow.",
    errors: [
      "Adding relative uncertainties for a sum.",
      "Rounding intermediate values too early.",
      "Ignoring a dominant uncertainty because it is inconvenient.",
      "Reporting a result with more digits than the least precise input.",
    ],
    examTraps: [
      "Using significant-figure rules when the question explicitly asks for propagation.",
      "Forgetting that a percentage uncertainty must be converted back to an absolute one for a sum.",
      "Treating a constant such as π as a measured value with limited figures.",
    ],
  },
];

/** Look up a technique by URL slug. */
export function labBySlug(slug: string): LabTechnique | undefined {
  return LAB_TECHNIQUES.find((item) => item.slug === slug);
}
