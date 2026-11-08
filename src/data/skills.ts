import type { Skill } from "./types";

export const SKILLS: Skill[] = [
  {
    slug: "polynomials-vieta",
    name: "Polynomials and Vieta's Formulas",
    domain: "Algebra",
    code: "VT",
    formula: "e_1^2 - 2e_2",
    blurb: "Read a polynomial's roots from its coefficients.",
    bigIdea:
      "Symmetric questions about roots rarely need the roots themselves. The coefficients already encode every elementary symmetric sum, so translate the target into $e_1, e_2, \\dots$ and work there.",
    whenToUse: [
      "You see sums of powers, reciprocal sums, or products of roots.",
      "A polynomial is given and the question is symmetric in its roots.",
      "A cubic or quartic has roots satisfying a relation you cannot solve directly.",
    ],
    traps: [
      "Forgetting the alternating signs: $e_k$ carries $(-1)^k$.",
      "Applying Vieta before making the polynomial monic.",
      "Assuming the roots are real when the coefficients alone do not guarantee it.",
    ],
    checklist: [
      "Write the polynomial in monic form and list $e_1, e_2, \\dots$ with signs.",
      "Express the target using elementary symmetric sums.",
      "Use Newton's identities for power sums.",
      "Check the degree and the sign of the final answer.",
    ],
  },
  {
    slug: "functional-equations",
    name: "Functional Equations",
    domain: "Algebra",
    code: "FE",
    formula: "f(x+f(y))=f(x)+y",
    blurb: "Substitute strategically until the function reveals itself.",
    bigIdea:
      "The same equation evaluated at different inputs creates a system. Look for a transformation of finite order, an involution, or a substitution that makes two arguments equal.",
    whenToUse: [
      "The unknown is a function and the equation relates $f$ at transformed inputs.",
      "The equation contains $f(f(x))$, $f(x+y)$, or a cyclic expression.",
      "You need to prove a function is injective, surjective, or constant.",
    ],
    traps: [
      "Assuming continuity, monotonicity, or injectivity without proof.",
      "Missing constant or pathological solutions.",
      "Forgetting the domain restrictions (for example $x \\ne 0, 1$).",
    ],
    checklist: [
      "Try $x = 0, 1, -1$ and $y = 0$.",
      "Find a transformation of finite order and iterate it.",
      "Prove injectivity or surjectivity before using them.",
      "Substitute the candidate back into the original equation.",
    ],
  },
  {
    slug: "inequalities",
    name: "Inequalities and AM-GM",
    domain: "Algebra",
    code: "IN",
    formula: "\\frac{a+b+c}{3} \\ge \\sqrt[3]{abc}",
    blurb: "Bound the expression, then prove the bound is sharp.",
    bigIdea:
      "Normalize, symmetrize, then apply a known inequality. The equality case tells you which inequality and which weights are right before you write a line of proof.",
    whenToUse: [
      "A maximum, minimum, or bound on a sum or product of positive variables.",
      "The expression is homogeneous or symmetric.",
      "A problem asks you to prove something is at least or at most a constant.",
    ],
    traps: [
      "Applying AM-GM with the wrong weights.",
      "Ignoring equality conditions, so the bound is never attained.",
      "Reversing an inequality after squaring without checking signs.",
    ],
    checklist: [
      "Check homogeneity and normalize if possible.",
      "Guess the equality case from symmetry.",
      "Choose AM-GM, Cauchy-Schwarz, Schur, or Jensen deliberately.",
      "Verify the equality case is actually attainable.",
    ],
  },
  {
    slug: "sequences",
    name: "Sequences and Series",
    domain: "Algebra",
    code: "SQ",
    formula: "a_{n+1} = r a_n + d",
    blurb: "Find the recurrence's skeleton, then telescope or solve it.",
    bigIdea:
      "Every recurrence has a skeleton: a difference, a ratio, a characteristic root, or a hidden telescoping term. Compute the first few terms, then look for the structure instead of the numbers.",
    whenToUse: [
      "A recursive definition or a sum with a hidden telescope.",
      "A question about a far-off term, especially modulo something.",
      "A sequence defined by a rational or quadratic update.",
    ],
    traps: [
      "Losing the particular solution when solving a non-homogeneous recurrence.",
      "Using the wrong period modulo $m$.",
      "Treating a recurrence as arithmetic when the differences are not constant.",
    ],
    checklist: [
      "Compute the first five terms.",
      "Look at differences, ratios, or reciprocals.",
      "Solve the characteristic equation for linear recurrences.",
      "For far terms, find the period modulo $m$.",
    ],
  },
  {
    slug: "divisibility",
    name: "Divisibility and Primes",
    domain: "Number Theory",
    code: "DV",
    formula: "a \\mid b \\iff b = ka",
    blurb: "Turn divisibility into a congruence or a factorization.",
    bigIdea:
      "Reduce a divisibility claim to its prime-power parts. If a polynomial expression is involved, rewrite it as a multiple of the divisor plus a controlled remainder.",
    whenToUse: [
      "A polynomial expression is divisible by $n$ for every integer $n$.",
      "You need the number or sum of divisors of an integer.",
      "A problem involves primes, prime powers, or factorials.",
    ],
    traps: [
      "Forgetting the divisors $1$ and $n$.",
      "Assuming $a \\mid bc$ implies $a \\mid b$ or $a \\mid c$.",
      "Ignoring negative divisors when the question allows them.",
    ],
    checklist: [
      "Factor, or write the expression as $dq + r$.",
      "Check each prime power separately.",
      "Count divisors using the exponent formula.",
      "Test small cases before committing to a general claim.",
    ],
  },
  {
    slug: "modular-arithmetic",
    name: "Modular Arithmetic",
    domain: "Number Theory",
    code: "MOD",
    formula: "a^{\\varphi(m)} \\equiv 1 \\pmod m",
    blurb: "Work in a smaller world, then recombine.",
    bigIdea:
      "Reduce the base, find the order of the residue, and use Euler or Fermat to shrink huge exponents. Split composite moduli into coprime prime powers, then recombine with the Chinese Remainder Theorem.",
    whenToUse: [
      "Huge powers, last digits, or remainders.",
      "Simultaneous congruences with different moduli.",
      "A claim that depends only on $n \\bmod m$.",
    ],
    traps: [
      "Reducing the exponent modulo $m$ instead of $\\varphi(m)$.",
      "Using Euler's theorem without checking coprimality.",
      "Applying CRT to non-coprime moduli without checking compatibility.",
    ],
    checklist: [
      "Reduce the base modulo $m$.",
      "Find the order or use Euler/Fermat.",
      "Handle shared prime factors separately.",
      "Recombine with CRT and verify the answer.",
    ],
  },
  {
    slug: "diophantine",
    name: "Diophantine Equations",
    domain: "Number Theory",
    code: "DIO",
    formula: "ax + by = c",
    blurb: "Use size, factorization, and modular obstructions.",
    bigIdea:
      "Before hunting for solutions, prove where they cannot be. Parity, size bounds, factorization, and a well-chosen modulus eliminate most candidates; the survivors are usually small enough to enumerate.",
    whenToUse: [
      "Integer or rational solutions to an equation.",
      "Squares, cubes, or a linear combination with a gcd condition.",
      "A problem asks for all solutions, not just one.",
    ],
    traps: [
      "Dividing by a variable that could be zero.",
      "Missing negative solutions.",
      "Assuming a bound exists without proving one.",
    ],
    checklist: [
      "Try small cases and check parity.",
      "Factor or complete the square.",
      "Find a modulus with no solutions.",
      "Bound one variable, then enumerate.",
    ],
  },
  {
    slug: "gcd-lcm",
    name: "GCD and LCM",
    domain: "Number Theory",
    code: "GCD",
    formula: "\\gcd(a,b)\\operatorname{lcm}(a,b)=ab",
    blurb: "Translate to prime exponents: min for gcd, max for lcm.",
    bigIdea:
      "The gcd takes the minimum exponent of each prime and the lcm takes the maximum. Once you write both in prime-factor form, a problem about shared divisors becomes a problem about independent exponents.",
    whenToUse: [
      "Shared divisors, common multiples, or lcm conditions.",
      "Fibonacci, factorial, or binomial gcd questions.",
      "A system of gcd/lcm equations.",
    ],
    traps: [
      "Using $\\gcd(a,b)\\operatorname{lcm}(a,b)=ab$ for three or more numbers.",
      "Forgetting that gcd and lcm are defined prime by prime.",
      "Losing the case where an exponent is zero.",
    ],
    checklist: [
      "Write the prime factorizations.",
      "Use min/max exponents.",
      "Reduce to one prime at a time.",
      "Check the formula on a small example.",
    ],
  },
  {
    slug: "counting",
    name: "Counting Principles",
    domain: "Combinatorics",
    code: "CNT",
    formula: "\\binom{n}{k} = \\frac{n!}{k!(n-k)!}",
    blurb: "Choose the right representation: slots, gaps, blocks, or complement.",
    bigIdea:
      "Most counting mistakes are representation mistakes. Decide what the objects are, whether order matters, and which restrictions are easiest to enforce before you multiply anything.",
    whenToUse: [
      "Arrangements, selections, or distributions with restrictions.",
      "Identical objects, repeated letters, or 'at least one' conditions.",
      "A count that is easier to compute by complement.",
    ],
    traps: [
      "Double counting a configuration.",
      "Treating identical objects as distinct.",
      "Forgetting the complement when 'at least one' appears.",
    ],
    checklist: [
      "Label the slots and decide whether order matters.",
      "Handle restrictions with blocks or gaps.",
      "Divide by symmetry only when it is justified.",
      "Check the formula on a tiny case.",
    ],
  },
  {
    slug: "probability",
    name: "Probability",
    domain: "Combinatorics",
    code: "PRB",
    formula: "P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}",
    blurb: "Count outcomes in one sample space, or condition on the first step.",
    bigIdea:
      "Probability is counting with a denominator. Make the sample space explicit, check that outcomes are equally likely, and condition on the first step when the process has memory.",
    whenToUse: [
      "Coins, dice, cards, random walks, or stopping times.",
      "A process with several stages or a reset condition.",
      "An expected value that is easier by linearity than by distribution.",
    ],
    traps: [
      "Assuming outcomes are equally likely when they are not.",
      "Confusing independence with conditional probability.",
      "Ignoring the stopping rule or the first success.",
    ],
    checklist: [
      "Define the sample space and its size.",
      "Check equally likely outcomes.",
      "Use complements, recursion, or linearity of expectation.",
      "Verify the probabilities sum to $1$.",
    ],
  },
  {
    slug: "pigeonhole",
    name: "Pigeonhole and Invariants",
    domain: "Combinatorics",
    code: "PIG",
    formula: "n+1 \\text{ objects, } n \\text{ boxes}",
    blurb: "Find what cannot change, or the box that must hold two.",
    bigIdea:
      "Existence results often come from a counting contradiction. Impossibility results often come from an invariant: a quantity that never changes, or changes only in a controlled way.",
    whenToUse: [
      "A problem asks you to prove some two objects share a property.",
      "Coloring, repeated states, or a process that seems reversible.",
      "An impossibility or parity claim.",
    ],
    traps: [
      "A pigeonhole map that is not well-defined.",
      "An invariant that only changes by a multiple of something.",
      "Forgetting the extremal case.",
    ],
    checklist: [
      "Identify the objects and the boxes.",
      "Find the invariant or monovariant.",
      "Check the extremal configuration.",
      "Turn the guarantee into a contradiction.",
    ],
  },
  {
    slug: "recursion-games",
    name: "Recursion and Games",
    domain: "Combinatorics",
    code: "REC",
    formula: "W \\leftrightarrow \\exists \\text{ move to } L",
    blurb: "Describe the state, then classify positions as winning or losing.",
    bigIdea:
      "For a game, classify each position by whether the player to move can force a win. For a recursive count, describe the state compactly and write the recurrence from the last move.",
    whenToUse: [
      "Tilings, strings with forbidden patterns, or step-by-step processes.",
      "Impartial games where both players have the same moves.",
      "A recurrence whose state is a small board or a remainder.",
    ],
    traps: [
      "Double counting recursive branches.",
      "Using the wrong base case.",
      "Forgetting whose turn it is.",
    ],
    checklist: [
      "Define the state compactly.",
      "Write the recurrence from the last move.",
      "Compute enough base cases to see a pattern.",
      "Look for periodicity in the losing positions.",
    ],
  },
  {
    slug: "angles-triangles",
    name: "Angles and Triangles",
    domain: "Geometry",
    code: "ANG",
    formula: "\\angle A + \\angle B + \\angle C = 180^\\circ",
    blurb: "Chase angles with the few facts that always hold.",
    bigIdea:
      "Angle chasing is bookkeeping. Mark every equal angle and equal side, use the exterior angle theorem, and look for isosceles triangles hiding in the figure.",
    whenToUse: [
      "A configuration with many angles and few lengths.",
      "Angle bisectors, altitudes, or midpoints.",
      "A target angle that can be expressed in terms of one unknown.",
    ],
    traps: [
      "Assuming a point is inside a triangle when it is not.",
      "Using the wrong exterior angle.",
      "Trusting a diagram that is not to scale.",
    ],
    checklist: [
      "Mark all equal angles and sides.",
      "Use the exterior angle theorem.",
      "Look for isosceles triangles.",
      "Introduce $x$ for the target and close the loop.",
    ],
  },
  {
    slug: "circles",
    name: "Circles and Cyclic Quadrilaterals",
    domain: "Geometry",
    code: "CIR",
    formula: "\\angle ABC = \\tfrac12 \\angle AOC",
    blurb: "Convert circle data into angles, equal tangents, and power.",
    bigIdea:
      "A circle is an angle machine. Inscribed angles, tangent-chord angles, equal tangents, and power of a point convert curved data into linear equations you can solve.",
    whenToUse: [
      "Tangents, chords, secants, or four concyclic points.",
      "A problem mentions a circumcircle or an incircle.",
      "Two circles intersect or touch.",
    ],
    traps: [
      "Using the wrong arc for an inscribed angle.",
      "Assuming a chord is a diameter.",
      "Applying power of a point with the wrong segment products.",
    ],
    checklist: [
      "Identify the cyclic quadrilateral.",
      "Use the inscribed-angle and tangent-chord theorems.",
      "Apply power of a point.",
      "Check which arc is intercepted.",
    ],
  },
  {
    slug: "area-similarity",
    name: "Area and Similarity",
    domain: "Geometry",
    code: "AREA",
    formula: "\\frac{[ADE]}{[ABC]} = \\left(\\frac{AD}{AB}\\right)^2",
    blurb: "Area ratios follow length ratios squared.",
    bigIdea:
      "Shared heights turn area ratios into base ratios. Similar figures turn length ratios into squared area ratios. Affine transformations preserve both, so you can move a messy figure to convenient coordinates.",
    whenToUse: [
      "Midpoints, parallel cuts, cevians, or shaded regions.",
      "A figure with several triangles sharing a height.",
      "A ratio question where the absolute area is irrelevant.",
    ],
    traps: [
      "Using the length ratio directly for areas.",
      "Forgetting that the height is shared.",
      "Assuming similarity without a second equal angle.",
    ],
    checklist: [
      "Look for shared heights.",
      "Find similar triangles and the ratio.",
      "Use area ratios, then subtract.",
      "Try coordinates if the figure is messy.",
    ],
  },
  {
    slug: "coordinates-trig",
    name: "Coordinates and Trigonometry",
    domain: "Geometry",
    code: "TRIG",
    formula: "d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}",
    blurb: "When pure geometry stalls, put the figure on axes.",
    bigIdea:
      "Coordinates replace insight with algebra. Choose axes that make the most points simple, write the key equations, and let distance, slope, and area formulas do the work. Trigonometry is the same idea with angles as coordinates.",
    whenToUse: [
      "Perpendicular distances, lattice points, or circles.",
      "A configuration with a natural right angle or midpoint.",
      "A length or angle that is hard to chase synthetically.",
    ],
    traps: [
      "Losing a sign when squaring or taking a square root.",
      "Forgetting the domain of an inverse trig function.",
      "Not checking both intersections of a line and a circle.",
    ],
    checklist: [
      "Choose coordinates that simplify the most points.",
      "Write the key equations.",
      "Use distance, slope, and area formulas.",
      "Check both solutions and the domain.",
    ],
  },
];

export const SKILL_BY_SLUG = new Map(SKILLS.map((s) => [s.slug, s]));
export const SKILL_BY_NAME = new Map(SKILLS.map((s) => [s.name, s]));
