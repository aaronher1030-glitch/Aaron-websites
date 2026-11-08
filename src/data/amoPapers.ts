import type { Difficulty, Domain, PaperRef, Problem } from "./types";

/**
 * Official Australian Mathematical Olympiad papers, 2016–2020.
 *
 * The question statements are transcribed from the publicly available AMT
 * papers. Copyright in the questions remains with the Australian Mathematics
 * Trust. The explanations below are Lemma's own key-idea outlines and marking
 * rubrics, not copies of the official solutions. Always check the linked
 * official PDF for the authoritative wording and full solution.
 */

const COMPETITION = "Australian Mathematical Olympiad";

export interface AmoPaper {
  id: string;
  year: number;
  competition: string;
  title: string;
  day1Date: string;
  day2Date: string;
  url: string;
  problemIds: string[];
}

interface PaperSeed {
  year: number;
  day1Date: string;
  day2Date: string;
  url: string;
}

const PAPER_SEEDS: PaperSeed[] = [
  {
    year: 2016,
    day1Date: "Tuesday, 9 February 2016",
    day2Date: "Wednesday, 10 February 2016",
    url: "https://amt.edu.au/wp-content/uploads/2019/02/2016-AMO-Paper-and-Solutions.pdf",
  },
  {
    year: 2017,
    day1Date: "Tuesday, 14 February 2017",
    day2Date: "Wednesday, 15 February 2017",
    url: "https://amt.edu.au/wp-content/uploads/2019/02/2017-AMO-Paper-and-Solutions.pdf",
  },
  {
    year: 2018,
    day1Date: "Tuesday, 6 February 2018",
    day2Date: "Wednesday, 7 February 2018",
    url: "https://amt.edu.au/wp-content/uploads/2019/02/AMO-2018-Problems-and-Solutions.pdf",
  },
  {
    year: 2019,
    day1Date: "Tuesday, 5 February 2019",
    day2Date: "Wednesday, 6 February 2019",
    url: "https://amt.edu.au/wp-content/uploads/2020/05/AMO-2019-paper-and-solutions.pdf",
  },
  {
    year: 2020,
    day1Date: "Tuesday, 4 February 2020",
    day2Date: "Wednesday, 5 February 2020",
    url: "https://amt.edu.au/wp-content/uploads/2020/05/AMO-2020-paper-and-solutions.pdf",
  },
];

export const AMO_PAPERS: AmoPaper[] = PAPER_SEEDS.map((seed) => ({
  id: `amo-${seed.year}`,
  year: seed.year,
  competition: COMPETITION,
  title: `${seed.year} Australian Mathematical Olympiad`,
  day1Date: seed.day1Date,
  day2Date: seed.day2Date,
  url: seed.url,
  problemIds: [],
}));

export const PAPER_BY_ID = new Map(AMO_PAPERS.map((paper) => [paper.id, paper]));

interface OfficialSeed {
  year: number;
  day: 1 | 2;
  number: number;
  domain: Domain;
  skill: string;
  difficulty: Difficulty;
  stem: string;
  explanation: string;
  rubric: string[];
}

const OFFICIAL_SEEDS: OfficialSeed[] = [
  // -------------------------------------------------------------------------
  // 2016
  // -------------------------------------------------------------------------
  {
    year: 2016,
    day: 1,
    number: 1,
    domain: "Number Theory",
    skill: "Modular Arithmetic",
    difficulty: "Hard",
    stem: String.raw`Find all positive integers $n$ such that $2^n+7^n$ is a perfect square.`,
    explanation: String.raw`$n=1$ gives $2+7=9=3^2$. For odd $n>1$, work modulo $4$: $2^n\equiv0$ and $7^n\equiv(-1)^n\equiv-1$, so $2^n+7^n\equiv3\pmod4$, which is impossible for a square. For $n=2m$, work modulo $5$: since $7\equiv2\pmod5$, the sum is $4^m+4^m=2\cdot4^m\equiv2$ or $3\pmod5$, while squares are $0,1,4\pmod5$. Hence $n=1$ is the only solution.`,
    rubric: [
      "Checks that $n=1$ works.",
      "Rules out odd $n>1$ using residues modulo $4$.",
      "Rules out even $n$ using residues modulo $5$.",
      "Concludes that $n=1$ is the unique answer.",
    ],
  },
  {
    year: 2016,
    day: 1,
    number: 2,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $ABC$ be a triangle. A circle intersects side $BC$ at points $U$ and $V$, side $CA$ at points $W$ and $X$, and side $AB$ at points $Y$ and $Z$. The points $U,V,W,X,Y,Z$ lie on the circle in that order. Suppose that $AY=BZ$ and $BU=CV$.

Prove that $CW=AX$.`,
    explanation: String.raw`Write $AY=BZ=x$, $YZ=r$, $BU=CV=y$, $UV=t$, $CW=u$ and $WX=s$. Power of a point at the three vertices gives
$$AY\cdot AZ=AW\cdot AX,\qquad BZ\cdot BY=BU\cdot BV,\qquad CV\cdot CU=CW\cdot CX.$$
Substituting the side lengths, these become
$$x(x+r)=(u+s)\,AX,\qquad x(x+r)=y(y+t),\qquad y(y+t)=u(u+s).$$
The last two equations give $x(x+r)=u(u+s)$. Comparing with the first equation yields $(u+s)AX=u(u+s)$, and since $u+s>0$ we obtain $AX=u=CW$.`,
    rubric: [
      "Applies the power-of-a-point theorem at $A$, $B$ and $C$.",
      "Expresses the relevant side lengths consistently, for example $AZ=AY+YZ$.",
      "Uses the two equal-length conditions to equate the three power products.",
      "Cancels the common positive factor to conclude $AX=CW$.",
    ],
  },
  {
    year: 2016,
    day: 1,
    number: 3,
    domain: "Algebra",
    skill: "Inequalities and AM-GM",
    difficulty: "Challenge",
    stem: String.raw`For a real number $x$, define $\lfloor x\rfloor$ to be the largest integer less than or equal to $x$, and define $\{x\}=x-\lfloor x\rfloor$.

(a) Prove that there are infinitely many positive real numbers $x$ that satisfy the inequality
$$\{x^2\}-\{x\}>\frac{2015}{2016}.$$

(b) Prove that there is no positive real number $x$ less than $1000$ that satisfies this inequality.`,
    explanation: String.raw`(a) Take $x=n+\frac1{n+1}$. Then
$$\{x^2\}-\{x\}=1-\frac3{n+1}+\frac1{(n+1)^2}>1-\frac3{n+1},$$
which exceeds $\frac{2015}{2016}$ once $n>3\cdot2016-1$. This gives infinitely many examples.

(b) Let $a=\lfloor x\rfloor$ and $b=\{x\}$, so $0\le b<1$ and $a\le999$. Since
$$x^2=a^2+2ab+b^2,$$
we have $\{x^2\}=\{2ab+b^2\}$. If $b<\frac1{2016}$, then $2ab+b^2<1$ and
$$\{x^2\}-\{x\}=2ab+b^2-b<2ab\le\frac{1998}{2016}<\frac{2015}{2016}.$$
If instead $b\ge\frac1{2016}$, then $\{x^2\}<1$ gives
$$\{x^2\}-\{x\}<1-b\le\frac{2015}{2016}.$$
So no $0<x<1000$ works.`,
    rubric: [
      "Constructs an explicit infinite family for part (a).",
      "Correctly expands $x^2$ and identifies $\{x^2\}$ in terms of $a$ and $b$.",
      "Splits part (b) into the cases $b<1/2016$ and $b\ge1/2016$.",
      "Uses $a\le999$ to obtain a bound strictly below $2015/2016$.",
    ],
  },
  {
    year: 2016,
    day: 1,
    number: 4,
    domain: "Combinatorics",
    skill: "Counting Principles",
    difficulty: "Challenge",
    stem: String.raw`A binary sequence is a sequence in which each term is equal to $0$ or $1$. We call a binary sequence superb if each term is adjacent to at least one term that is equal to $1$. For example, the sequence $0,1,1,0,0,1,1,1$ is a superb binary sequence with eight terms. Let $B_n$ denote the number of superb binary sequences with $n$ terms.

Determine the smallest integer $n\ge2$ such that $B_n$ is divisible by $20$.`,
    explanation: String.raw`A sequence $b_1,\dots,b_n$ is superb exactly when $b_2=b_{n-1}=1$ and there is no index $k$ with $b_k=b_{k+2}=0$. Splitting the odd and even positions gives, with $F_0=0,F_1=1$ and $F_m=F_{m-1}+F_{m-2}$,
$$B_{2m}=F_{m+1}^2,\qquad B_{2m+1}=F_mF_{m+3}.$$
Checking these values shows that none of $B_2,\dots,B_{24}$ is divisible by $20$. At $n=25$,
$$B_{25}=F_{12}F_{15}=144\cdot610=87840,$$
which is divisible by $20$. Hence the smallest such $n$ is $25$.`,
    rubric: [
      "Characterises superb sequences by the positions of the forced $1$s and the forbidden gaps of two zeros.",
      "Derives a Fibonacci recurrence or the stated closed forms for $B_{2m}$ and $B_{2m+1}$.",
      "Checks divisibility by $4$ and $5$ for $n<25$.",
      "Computes $B_{25}$ and concludes that $n=25$.",
    ],
  },
  {
    year: 2016,
    day: 2,
    number: 5,
    domain: "Algebra",
    skill: "Polynomials and Vieta's Formulas",
    difficulty: "Hard",
    stem: String.raw`Find all triples $(x,y,z)$ of real numbers that simultaneously satisfy the equations
$$xy+1=2z,\qquad yz+1=2x,\qquad zx+1=2y.$$`,
    explanation: String.raw`Subtracting the first two equations gives $y(x-z)=2(z-x)$, hence $(x-z)(y+2)=0$. Cyclically, at least one variable equals $-2$ unless $x=y=z$. If $x=y=z$, then $x^2+1=2x$, so $(x-1)^2=0$ and the solution is $(1,1,1)$. If, say, $y=-2$, the equations become $-2x+1=2z$, $-2z+1=2x$ and $zx+1=-4$. Solving gives $z=-x+\frac12$ and $2x^2-x-10=0$, so $x=\frac52$ or $x=-2$. Thus, together with permutations, the solutions are
$$(1,1,1),\qquad \left(\frac52,-2,-2\right),\qquad \left(-2,\frac52,-2\right),\qquad \left(-2,-2,\frac52\right).$$
Each is readily checked.`,
    rubric: [
      "Subtracts pairs of equations and factorises the result.",
      "Treats the equal-variable case $x=y=z$ correctly.",
      "Solves the case in which one variable equals $-2$.",
      "Lists all solutions and verifies them.",
    ],
  },
  {
    year: 2016,
    day: 2,
    number: 6,
    domain: "Number Theory",
    skill: "Diophantine Equations",
    difficulty: "Hard",
    stem: String.raw`Let $a,b,c$ be positive integers such that $a^3+b^3=2^c$.

Prove that $a=b$.`,
    explanation: String.raw`First note that $a$ and $b$ have the same parity. If both are even, divide the equation repeatedly by $8$ until at least one of the resulting cubes is odd. Thus it is enough to rule out distinct odd $a,b$ satisfying $a^3+b^3=2^d$.

For odd $a,b$, factor
$$a^3+b^3=(a+b)(a^2-ab+b^2)=2^d.$$
The second factor is odd, so it must equal $1$. For positive odd $a,b$ this forces $a=b=1$. Therefore the reduced equation has only $a=b$, and undoing the common power of $2$ gives $a=b$ in the original equation as well.`,
    rubric: [
      "Observes that $a$ and $b$ have the same parity.",
      "Removes the common power of $2$ to reduce to the odd case.",
      "Factors $a^3+b^3$ and uses the parity of $a^2-ab+b^2$.",
      "Deduces $a=b$ and transfers the conclusion back to the original variables.",
    ],
  },
  {
    year: 2016,
    day: 2,
    number: 7,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Each point in the plane is assigned one of four colours.

Prove that there exist two points at distance $1$ or $\sqrt3$ from each other that are assigned the same colour.`,
    explanation: String.raw`Suppose, for contradiction, that no two points at distance $1$ or $\sqrt3$ share a colour. Take a regular hexagon $P_1P_2P_3P_4P_5P_6$ of side length $1$ with centre $Q$. Among $P_1,P_2,P_6,Q$, every pair is at distance $1$ or $\sqrt3$, so these four points must receive four distinct colours. Relabelling, let $P_1$ be blue and $Q$ red, $P_2$ yellow, $P_6$ green.

The same argument applied to $P_1,P_6,P_5,Q$ forces $P_5$ to be yellow, and then $P_6,P_5,P_4,Q$ forces $P_4$ to be blue. Consequently every point at distance $2$ from $P_1$ is blue. But on the circle of radius $2$ about $P_1$ there are two points at distance $\sqrt3$, and they would both be blue, a contradiction.`,
    rubric: [
      "Sets up a contradiction by assuming a colouring with no monochromatic pair at distances $1$ or $\sqrt3$.",
      "Uses a regular hexagon and its centre to force four distinct colours.",
      "Propagates colours around the hexagon to show a whole circle of radius $2$ is monochromatic.",
      "Finds two points on that circle at distance $\sqrt3$ and derives the contradiction.",
    ],
  },
  {
    year: 2016,
    day: 2,
    number: 8,
    domain: "Geometry",
    skill: "Area and Similarity",
    difficulty: "Challenge",
    stem: String.raw`Three given lines in the plane pass through a point $P$.

(a) Prove that there exists a circle that contains $P$ in its interior and intersects the three lines at six points $A,B,C,D,E,F$ in that order around the circle such that $AB=CD=EF$.

(b) Suppose that a circle contains $P$ in its interior and intersects the three lines at six points $A,B,C,D,E,F$ in that order around the circle such that $AB=CD=EF$. Prove that
$$\frac12\,\operatorname{area}(ABCDEF)\ge\operatorname{area}(\triangle APB)+\operatorname{area}(\triangle CPD)+\operatorname{area}(\triangle EPF).$$`,
    explanation: String.raw`(a) Let $r_1,\dots,r_6$ be the rays from $P$ in order, with $r_1\cup r_4$, $r_2\cup r_5$ and $r_3\cup r_6$ the three given lines. Choose $B\in r_2$ and $C\in r_3$ with $BC\parallel r_1$. Draw the tangent at $B$ to the circle through $B,P,C$; it meets $r_1$ at $A$. Similarly, the tangent at $C$ meets $r_4$ at $D$. An angle chase shows that $ABCD$ is an isosceles trapezium, so $AB=CD$ and $ABCD$ is cyclic. Extending $BP$ and $CP$ to meet this circle again at $E$ and $F$ gives $CD=EF$, and the six points occur in the required order.

(b) The equalities $AB=CD=EF$ force the relevant trapeziums to be isosceles, and an angle chase shows that the six triangles $PAB,PBC,PCD,PDE,PEF,PFA$ are all similar. Writing $x=BC$, $y=CP$, $z=BP$, the six areas are proportional to
$$z^2x^2,\ x^4,\ x^2y^2,\ y^4,\ y^2z^2,\ z^4.$$
The desired inequality is therefore equivalent to
$$x^4+y^4+z^4\ge x^2y^2+y^2z^2+z^2x^2,$$
which follows from
$$(x^2-y^2)^2+(y^2-z^2)^2+(z^2-x^2)^2\ge0.$$`,
    rubric: [
      "Constructs the circle in part (a) using a tangent or a limiting argument.",
      "Proves $AB=CD$ and $EF=CD$ via isosceles trapeziums or equal angles.",
      "Shows the six small triangles in part (b) are similar.",
      "Reduces the area inequality to a sum-of-squares inequality and proves it.",
    ],
  },
  // -------------------------------------------------------------------------
  // 2017
  // -------------------------------------------------------------------------
  {
    year: 2017,
    day: 1,
    number: 1,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Hard",
    stem: String.raw`For which integers $n\ge2$ is it possible to write the numbers $1,2,3,\dots,n$ in a row in some order so that any two numbers written next to each other in the row differ by $2$ or $3$?`,
    explanation: String.raw`The task is impossible for $n=2$ and $n=3$. It is possible for $n=4,5,6,7$, for example
$$2,4,1,3;\quad 2,4,1,3,5;\quad 1,3,5,2,4,6;\quad 1,3,6,4,2,5,7.$$
Each of these ends in $n-1$ or $n$. If a valid row for $n$ ends in $n-1$ or $n$, appending the four numbers
$$n+2,\ n+4,\ n+1,\ n+3$$
produces a valid row for $n+4$: the joins have differences $2$ or $3$, and the appended consecutive differences alternate between $2$ and $3$. Induction from the four base cases therefore gives every $n\ge4$.`,
    rubric: [
      "Shows that $n=2$ and $n=3$ are impossible.",
      "Gives explicit constructions for $n=4,5,6,7$.",
      "Describes an extension from $n$ to $n+4$.",
      "Concludes that exactly the integers $n\ge4$ work.",
    ],
  },
  {
    year: 2017,
    day: 1,
    number: 2,
    domain: "Number Theory",
    skill: "Modular Arithmetic",
    difficulty: "Hard",
    stem: String.raw`Given five distinct integers, consider the ten differences formed by pairs of these numbers. (Note that some of these differences may be equal.)

Determine the largest integer that is certain to divide the product of these ten differences, regardless of which five integers were originally given.`,
    explanation: String.raw`For the five integers $1,2,3,4,5$, the product of the ten differences is
$$1\cdot1\cdot1\cdot1\cdot2\cdot2\cdot2\cdot3\cdot3\cdot4=288.$$
So the answer cannot exceed $288$. It remains to show that $288=2^5\cdot3^2$ always divides the product $P$.

For the factor $2^5$: by pigeonhole, three of the five integers have the same parity; among those three, two are congruent modulo $4$. Their three pairwise differences contribute at least $2^4$, and a parity argument on the remaining two integers supplies at least one more factor of $2$.

For the factor $3^2$: if three of the integers are congruent modulo $3$, then three of their differences are divisible by $3$. Otherwise two residue classes each contain two integers, and the two within-class differences are each divisible by $3$. Thus $3^2\mid P$, and the largest guaranteed divisor is $288$.`,
    rubric: [
      "Uses a concrete example to show that no integer larger than $288$ is guaranteed.",
      "Proves that $2^5$ always divides the product, using pigeonhole modulo $2$ and $4$.",
      "Proves that $3^2$ always divides the product, using residues modulo $3$.",
      "Combines the coprime factors to conclude $288$.",
    ],
  },
  {
    year: 2017,
    day: 1,
    number: 3,
    domain: "Algebra",
    skill: "Functional Equations",
    difficulty: "Challenge",
    stem: String.raw`Determine all functions $f$ defined for real numbers and taking real numbers as values such that
$$f(x^2+f(y))=f(xy)$$
for all real numbers $x$ and $y$.`,
    explanation: String.raw`The only solutions are the constant functions. Let $f(0)=c$. Setting $y=0$ gives
$$f(x^2+c)=c.$$
As $x^2+c$ runs over $[c,\infty)$, we have $f(t)=c$ for every $t\ge c$.

Choose $u\ne0$ with $u\ge c$. Then $f(u)=c$, and substituting $y=u$ gives
$$f(xu)=f(x^2+f(u))=f(x^2+c)=c.$$
Since $u\ne0$, the expression $xu$ runs over all real numbers as $x$ runs over all real numbers. Hence $f$ is constant. Conversely, every constant function plainly satisfies the equation.`,
    rubric: [
      "Sets $y=0$ and deduces that $f$ is constant on a ray $[c,\infty)$.",
      "Chooses a nonzero $u$ in that ray.",
      "Substitutes $y=u$ and lets $x$ vary to cover all real inputs.",
      "Verifies that all constant functions are solutions.",
    ],
  },
  {
    year: 2017,
    day: 1,
    number: 4,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Suppose that $S$ is a set of $2017$ points in the plane that are not all collinear.

Prove that $S$ contains three points that form a triangle whose circumcentre is not a point in $S$.`,
    explanation: String.raw`Assume, for contradiction, that the circumcentre of every triangle formed by three points of $S$ also belongs to $S$. Choose a supporting line of the convex hull and two points $A,B\in S$ on it with all of $S$ on one side. Put $A=(0,1)$ and $B=(0,-1)$.

Let $X_1$ be the midpoint of $AB$, and for $i\ge1$ let $X_{i+1}$ be the intersection of the circle centred at $X_i$ through $A$ and $B$ with the positive $x$-axis. An induction shows that no point of $S$ lies inside the circle $C_i$ centred at $X_i$: otherwise the circumcentre of a suitable triangle $ABP$ would lie on the wrong side of $AB$, contradicting the choice of the supporting line. But $X_{i+1}>2X_i$, so the circles $C_i$ grow without bound. They all pass through $A$ and $B$, so eventually they contain points of $S$ on the far side of $AB$, a contradiction.`,
    rubric: [
      "Assumes every circumcentre of a triangle from $S$ lies in $S$.",
      "Chooses a supporting line $AB$ of the convex hull.",
      "Constructs the expanding sequence of circles through $A$ and $B$.",
      "Shows the circles eventually enclose a point of $S$, giving the contradiction.",
    ],
  },
  {
    year: 2017,
    day: 2,
    number: 5,
    domain: "Number Theory",
    skill: "Divisibility and Primes",
    difficulty: "Challenge",
    stem: String.raw`Determine the number of positive integers $n$ less than $1\,000\,000$ for which the sum
$$\frac1{2\lfloor\sqrt1\rfloor+1}+\frac1{2\lfloor\sqrt2\rfloor+1}+\frac1{2\lfloor\sqrt3\rfloor+1}+\cdots+\frac1{2\lfloor\sqrt n\rfloor+1}$$
is an integer. (Note that $\lfloor x\rfloor$ denotes the largest integer that is less than or equal to $x$.)`,
    explanation: String.raw`The terms equal to $\frac1{2m+1}$ occur exactly for
$$m^2\le k\le(m+1)^2-1,$$
so there are $(m+1)^2-m^2=2m+1$ of them. Hence the sum begins
$$3\cdot\frac13+5\cdot\frac15+7\cdot\frac17+\cdots,$$
and it is an integer precisely when it stops at the end of a block:
$$n=3+5+7+\cdots+(2m+1)=(m+1)^2-1.$$
For $n<1\,000\,000$ we need $(m+1)^2-1<1\,000\,000$, so $m+1\le1000$. Thus $m=1,2,\dots,999$, giving $999$ values of $n$.`,
    rubric: [
      "Groups the terms by the value of $\lfloor\sqrt k\rfloor$.",
      "Counts the number of terms in each group as $2m+1$.",
      "Identifies the partial sums that are integers as $(m+1)^2-1$.",
      "Counts the admissible values below one million and obtains $999$.",
    ],
  },
  {
    year: 2017,
    day: 2,
    number: 6,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`The circles $K_1$ and $K_2$ intersect at two distinct points $A$ and $M$. Let the tangent to $K_1$ at $A$ meet $K_2$ again at $B$, and let the tangent to $K_2$ at $A$ meet $K_1$ again at $D$. Let $C$ be the point such that $M$ is the midpoint of $AC$.

Prove that the quadrilateral $ABCD$ is cyclic.`,
    explanation: String.raw`Let $\angle MAD=x$ and $\angle MAB=y$. By the alternate segment theorem,
$$\angle ABM=\angle MAD=x,\qquad \angle ADM=\angle MAB=y.$$
Hence $\triangle AMD\sim\triangle BMA$, so
$$\frac{MA}{MD}=\frac{MB}{MA}.$$
Since $MC=MA$, this becomes
$$\frac{MC}{MD}=\frac{MB}{MC}.$$
Also, $\angle CMD=\angle MAD+\angle MDA=x+y=\angle MAB+\angle MBA=\angle CMB$. Therefore $\triangle CMD\sim\triangle BMC$, and
$$\angle BCD=\angle BCM+\angle MCD=\angle BCM+\angle MBC=180^\circ-\angle BMC=180^\circ-\angle BAD.$$
Thus $\angle BAD+\angle BCD=180^\circ$, so $ABCD$ is cyclic.`,
    rubric: [
      "Applies the alternate segment theorem at $A$.",
      "Establishes the similarity $\triangle AMD\sim\triangle BMA$.",
      "Uses $MC=MA$ to prove $\triangle CMD\sim\triangle BMC$.",
      "Derives $\angle BAD+\angle BCD=180^\circ$ and concludes cyclicity.",
    ],
  },
  {
    year: 2017,
    day: 2,
    number: 7,
    domain: "Combinatorics",
    skill: "Counting Principles",
    difficulty: "Challenge",
    stem: String.raw`There are $1000$ athletes standing equally spaced around a circular track of length $1$ kilometre.

(a) How many ways are there to divide the athletes into $500$ pairs such that the two members of each pair are $335$ metres apart around the track?

(b) How many ways are there to divide the athletes into $500$ pairs such that the two members of each pair are $336$ metres apart around the track?`,
    explanation: String.raw`More generally, for $2N$ equally spaced points and a fixed circular gap $k$, the number of perfect matchings using gaps of size $k$ is
$$\begin{cases}2^{\gcd(k,N)}, & \text{if }k/\gcd(k,N)\text{ is odd},\\ 0, & \text{if }k/\gcd(k,N)\text{ is even}.\end{cases}$$
Here $2N=1000$, so $N=500$.

(a) $\gcd(335,500)=5$ and $335/5=67$ is odd, so the number of pairings is $2^5=32$.

(b) $\gcd(336,500)=4$ and $336/4=84$ is even, so no such pairing exists; the answer is $0$.`,
    rubric: [
      "Reduces the problem to perfect matchings on $1000$ cyclic points with a fixed gap.",
      "States or derives the count $2^{\gcd(k,500)}$ when $k/\gcd(k,500)$ is odd.",
      "Computes $32$ for gap $335$.",
      "Explains the parity obstruction and obtains $0$ for gap $336$.",
    ],
  },
  {
    year: 2017,
    day: 2,
    number: 8,
    domain: "Number Theory",
    skill: "Modular Arithmetic",
    difficulty: "Challenge",
    stem: String.raw`Let $f(x)=x^2-45x+2$.

Find all integers $n\ge2$ such that exactly one of the numbers
$$f(1),f(2),\dots,f(n)$$
is divisible by $n$.`,
    explanation: String.raw`The only answer is $n=2017$. Since $f(x)\equiv f(y)\pmod n$ whenever $x\equiv y\pmod n$, we need the congruence $f(x)\equiv0\pmod n$ to have exactly one solution modulo $n$.

If $a$ is a solution, then $f(45-a)=f(a)$, so $45-a$ is also a solution. Uniqueness forces $2a\equiv45\pmod n$. Substituting this into $a^2-45a+2\equiv0$ gives
$$2017\equiv0\pmod n.$$
Because $2017$ is prime, $n=2017$. Conversely, for $n=2017$ the quadratic formula shows that the only solution in the required range is $a=1031$, so exactly one of $f(1),\dots,f(2017)$ is divisible by $2017$.`,
    rubric: [
      "Observes that $f(x)\bmod n$ depends only on $x\bmod n$.",
      "Uses the symmetry $f(45-a)=f(a)$.",
      "Deduces $2a\equiv45\pmod n$ and then $2017\equiv0\pmod n$.",
      "Checks that $n=2017$ indeed gives exactly one solution.",
    ],
  },
  // -------------------------------------------------------------------------
  // 2018
  // -------------------------------------------------------------------------
  {
    year: 2018,
    day: 1,
    number: 1,
    domain: "Number Theory",
    skill: "Diophantine Equations",
    difficulty: "Hard",
    stem: String.raw`Find all pairs of positive integers $(n,k)$ such that
$$n!+8=2^k.$$
(If $n$ is a positive integer, then $n!=1\times2\times3\times\cdots\times(n-1)\times n$.)`,
    explanation: String.raw`For $n\ge6$, the number $n!$ is divisible by $6!=720=16\cdot45$. Hence $n!+8$ is $8$ more than a multiple of $16$, so it is divisible by $8$ but not by $16$. Since $n!+8>8$, it cannot be a power of $2$.

It remains to test $1\le n\le5$:
$$9,\ 10,\ 14,\ 32,\ 128.$$
The powers of $2$ here are $32=2^5$ and $128=2^7$, giving $(n,k)=(4,5)$ and $(5,7)$.`,
    rubric: [
      "Shows that $n\ge6$ is impossible by considering $n!+8$ modulo $16$.",
      "Tests the remaining values $n=1,2,3,4,5$.",
      "Identifies the two powers of $2$.",
      "States both pairs $(4,5)$ and $(5,7)$.",
    ],
  },
  {
    year: 2018,
    day: 1,
    number: 2,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Consider a line with $\frac12(3^{100}+1)$ equally spaced points marked on it.

Prove that $2^{100}$ of these marked points can be coloured red so that no red point is at the same distance from two other red points.`,
    explanation: String.raw`Use the following extension step: if $k$ red points can be chosen among $m$ equally spaced points with the required property, then $2k$ red points can be chosen among $3m-1$ equally spaced points. Indeed, colour $k$ of the leftmost $m$ points and $k$ of the rightmost $m$ points. Within each block the condition is inherited, and a point in one block is never the midpoint of two points in the other block because the blocks are separated by $m-1$ gaps.

Starting from $m=1$ with $k=1$ red point and applying the step $100$ times gives
$$m=\frac{3^{100}+1}{2},\qquad k=2^{100}.$$
This is exactly the required configuration.`,
    rubric: [
      "Describes the doubling construction from $m$ points to $3m-1$ points.",
      "Checks that the no-equal-distance condition is preserved within and between the two blocks.",
      "Iterates the construction $100$ times.",
      "Computes the final number of points as $\frac12(3^{100}+1)$.",
    ],
  },
  {
    year: 2018,
    day: 1,
    number: 3,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $ABCDEFGHIJKLMN$ be a regular tetradecagon.

Prove that the three lines $AE$, $BG$ and $CK$ intersect at a point. (A regular tetradecagon is a convex polygon with $14$ sides, such that all sides have the same length and all angles are equal.)`,
    explanation: String.raw`Let $\theta=\frac{180^\circ}{14}$, so $14\theta=180^\circ$. Let $X=AE\cap BG$. We show that $C,X,K$ are collinear.

The angle subtended by one side at a vertex of the tetradecagon is $\theta$. Hence
$$\angle KCB=5\theta,\qquad \angle CBG=4\theta,\qquad \angle BAE=3\theta.$$
Also, by the exterior-angle theorem in $\triangle ABX$,
$$\angle AXB=\angle AEB+\angle EBG=\theta+2\theta=3\theta.$$
Thus $\angle BAX=\angle AXB$, so $AB=BX$. Since $AB=BC$, we get $BX=BC$. Now $\angle CBX=\angle CBG=4\theta$, so the base angles of the isosceles triangle $BCX$ are
$$\frac{180^\circ-4\theta}{2}=90^\circ-2\theta=5\theta.$$
Therefore $\angle BXC=5\theta=\angle KCB$, which forces $C,X,K$ to be collinear. Hence $AE,BG,CK$ are concurrent at $X$.`,
    rubric: [
      "Computes the relevant angles in terms of $\theta=180^\circ/14$.",
      "Shows $\angle AXB=3\theta$ and hence $AB=BX$.",
      "Uses $AB=BC$ to prove $BC=BX$ and calculates the base angles of $\triangle BCX$.",
      "Deduces that $C,X,K$ are collinear and concludes concurrence.",
    ],
  },
  {
    year: 2018,
    day: 1,
    number: 4,
    domain: "Algebra",
    skill: "Functional Equations",
    difficulty: "Challenge",
    stem: String.raw`Find all functions $f$ defined for real numbers and taking real numbers as values such that
$$f(xy+f(y))=yf(x)$$
for all real numbers $x$ and $y$.`,
    explanation: String.raw`The solutions are $f(x)=0$ for all $x$, and $f(x)=1-x$ for all $x$. The zero function is immediate.

Otherwise choose $a$ with $f(a)\ne0$. From $f(ay+f(y))=yf(a)$, the right-hand side runs over all real numbers, so $f$ is surjective. Setting $x=0$ gives
$$f(f(y))=yf(0).$$
Since $f$ is surjective, $f\circ f$ is also surjective, so $f(0)\ne0$. Then $f\circ f$ is injective, which forces $f$ to be injective.

Putting $y=1$ gives $f(f(1))=f(0)$, hence $f(1)=0$ by injectivity. Putting $x=1$ gives
$$f(y+f(y))=f(1)=0=f(1),$$
so $y+f(y)=1$, that is, $f(y)=1-y$. A direct check verifies that this function works.`,
    rubric: [
      "Handles the zero solution and assumes a nonzero value to prove surjectivity.",
      "Uses $f(f(y))=yf(0)$ to show $f(0)\ne0$ and $f$ is injective.",
      "Derives $f(1)=0$ and then $y+f(y)=1$.",
      "Verifies both $f\equiv0$ and $f(x)=1-x$.",
    ],
  },
  {
    year: 2018,
    day: 2,
    number: 5,
    domain: "Number Theory",
    skill: "Divisibility and Primes",
    difficulty: "Hard",
    stem: String.raw`The sequence $a_1,a_2,a_3,\dots$ is defined by $a_1=1$ and, for $n\ge2$,
$$a_n=(a_1+a_2+\cdots+a_{n-1})\cdot n.$$
Prove that $a_{2018}$ is divisible by $2018^2$.`,
    explanation: String.raw`Let $S_n=a_1+\cdots+a_n$. For $n\ge2$, the recurrence says $a_n=nS_{n-1}$, so
$$S_n=S_{n-1}+a_n=a_n\left(\frac1n+1\right)=\frac{n+1}{n}a_n.$$
Therefore, for $n\ge2$,
$$a_{n+1}=(n+1)S_n=\frac{(n+1)^2}{n}a_n.$$
Since $a_2=2$, induction gives
$$a_n=\frac{n\cdot n!}{2}\qquad(n\ge2).$$
Hence
$$a_{2018}=\frac{2018\cdot2018!}{2}=2018^2\cdot\frac{2017!}{2},$$
which is an integer divisible by $2018^2$.`,
    rubric: [
      "Relates $a_n$ to the previous partial sum $S_{n-1}$.",
      "Derives the recurrence $a_{n+1}=a_n(n+1)^2/n$.",
      "Solves the recurrence to obtain $a_n=n\cdot n!/2$.",
      "Rewrites $a_{2018}$ as a multiple of $2018^2$.",
    ],
  },
  {
    year: 2018,
    day: 2,
    number: 6,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $P,Q,R$ be three points on a circle $C$, such that $PQ=PR$ and $PQ>QR$. Let $D$ be the circle with centre $P$ that passes through $Q$ and $R$. Suppose that the circle with centre $Q$ and passing through $R$ intersects $C$ again at $X$ and $D$ again at $Y$.

Prove that $P,X,Y$ lie on a line.`,
    explanation: String.raw`Work with directed angles. Since $X$ lies on the circle $C$ and $QX=QR$, the equal chords $QX$ and $QR$ of $C$ subtend equal angles at $P$:
$$\angle XPQ=\angle QPR.$$
Since $Y$ lies on the circle $D$ and $QY=QR$, the equal chords $QY$ and $QR$ of $D$ subtend equal angles at its centre $P$:
$$\angle QPY=\angle QPR.$$
Thus $\angle XPQ=\angle QPY$ as directed angles. Both angles are measured from the line $PQ$, so the rays $PX$ and $PY$ coincide; equivalently, $P,X,Y$ are collinear.`,
    rubric: [
      "Uses $QX=QR$ and the circle $C$ to relate $\angle XPQ$ and $\angle QPR$.",
      "Uses $QY=QR$ and the circle $D$ to relate $\angle QPY$ and $\angle QPR$.",
      "Combines the two equalities with directed angles.",
      "Concludes that $P,X,Y$ are collinear.",
    ],
  },
  {
    year: 2018,
    day: 2,
    number: 7,
    domain: "Number Theory",
    skill: "Divisibility and Primes",
    difficulty: "Challenge",
    stem: String.raw`Let $b_1,b_2,b_3,\dots$ be a sequence of positive integers such that, for each positive integer $n$, $b_{n+1}$ is the square of the number of positive factors of $b_n$ (including $1$ and $b_n$). For example, if $b_1=27$, then $b_2=4^2=16$, since $27$ has four positive factors: $1,3,9$ and $27$.

Prove that if $b_1>1$, then the sequence contains a term that is equal to $9$.`,
    explanation: String.raw`For $i\ge2$, $b_i$ is a square, and for $i\ge3$ it is an odd square. Write
$$b_i=\prod_j p_j^{2k_j}.$$
Then
$$b_{i+1}=\prod_j(2k_j+1)^2\ge9.$$
For every prime $p\ge3$ and every $k\ge1$,
$$p^{2k}\ge(2k+1)^2,$$
with equality exactly when $p=3$ and $k=1$. Hence $b_i\ge b_{i+1}$, with equality exactly when $b_i=9$.

Therefore, from $b_3$ onward, the sequence is nonincreasing. It must eventually be constant, and the only possible constant value is $9$. Since $b_1>1$, the sequence reaches $b_3$ and then reaches $9$.`,
    rubric: [
      "Shows that $b_i$ is an odd square for $i\ge3$.",
      "Writes the prime factorisation and computes $b_{i+1}$ in terms of the exponents.",
      "Proves $p^{2k}\ge(2k+1)^2$ with equality only for $p=3,k=1$.",
      "Uses monotonicity to conclude that the sequence eventually reaches $9$.",
    ],
  },
  {
    year: 2018,
    day: 2,
    number: 8,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Amy has a number of rocks such that the mass of each rock, in kilograms, is a positive integer. The sum of the masses of the rocks is $2018$ kilograms. Amy realises that it is impossible to divide the rocks into two piles of $1009$ kilograms.

What is the maximum possible number of rocks that Amy could have?`,
    explanation: String.raw`The answer is $1009$. The construction is $1008$ rocks of mass $1$ and one rock of mass $1010$: the total is $2018$, but the heavy rock cannot fit into a pile of mass $1009$.

It remains to show that $1010$ or more rocks always allow a balanced division. More generally, any collection of at least $n+1$ rocks of total mass $2n$ can be divided into two piles of mass $n$. Prove this by strong induction on $n$. If all rocks have mass $1$ the claim is clear. Otherwise take a rock of mass $w>1$ and let $k$ be the number of unit rocks; a counting argument gives $k\ge w$. Remove the rock of mass $w$, apply the induction hypothesis to the remaining rocks, and move $w$ units of mass from one pile to the other (using the available unit rocks) to restore balance. Applying this with $n=1009$ shows that $1010$ rocks always suffice.`,
    rubric: [
      "Gives the construction with $1008$ unit rocks and one rock of mass $1010$.",
      "States the general balancing lemma for at least $n+1$ rocks of total $2n$.",
      "Proves the lemma by strong induction, separating off a rock of mass $w>1$.",
      "Uses $k\ge w$ to rebalance the two piles and concludes the maximum is $1009$.",
    ],
  },
  // -------------------------------------------------------------------------
  // 2019
  // -------------------------------------------------------------------------
  {
    year: 2019,
    day: 1,
    number: 1,
    domain: "Algebra",
    skill: "Polynomials and Vieta's Formulas",
    difficulty: "Hard",
    stem: String.raw`Find all real numbers $r$ for which there exists exactly one real number $a$ such that when
$$(x+a)(x^2+rx+1)$$
is expanded to yield a cubic polynomial, all of its coefficients are greater than or equal to zero.`,
    explanation: String.raw`Expanding gives
$$x^3+(a+r)x^2+(ar+1)x+a.$$
The coefficient conditions are
$$a\ge0,\qquad ar+1\ge0,\qquad a+r\ge0.$$
If $r\ge0$, every $a\ge0$ satisfies all three, so there is not a unique $a$. Now suppose $r<0$. Then $a+r\ge0$ implies $a\ge0$, and the conditions become
$$-r\le a\le-\frac1r.$$
There is exactly one real $a$ in this interval precisely when the endpoints coincide:
$$-r=-\frac1r\iff r^2=1.$$
Since $r<0$, we get $r=-1$, with the unique value $a=1$. Indeed,
$$(x+1)(x^2-x+1)=x^3+1,$$
whose coefficients are all non-negative.`,
    rubric: [
      "Expands the cubic and writes down the three coefficient inequalities.",
      "Rules out $r\ge0$ because there are infinitely many admissible $a$.",
      "Reduces the case $r<0$ to an interval for $a$.",
      "Forces the interval to be a single point and obtains $r=-1$.",
    ],
  },
  {
    year: 2019,
    day: 1,
    number: 2,
    domain: "Number Theory",
    skill: "Diophantine Equations",
    difficulty: "Hard",
    stem: String.raw`For each positive integer $n$, the $n$th triangular number is the sum of the first $n$ positive integers. Let $a,b,c$ be three consecutive triangular numbers with $a<b<c$.

Prove that if $a+b+c$ is a triangular number, then $b$ is three times a triangular number.`,
    explanation: String.raw`Write $a=T_{n-1}$, $b=T_n$, $c=T_{n+1}$ and suppose $a+b+c=T_m$. Using $T_k=\frac{k(k+1)}2$, we get
$$T_{n-1}+T_n+T_{n+1}=T_m\iff 3(n^2+n)+2=m^2+m.$$
Modulo $3$, the left side is $2$, so $m^2+m\equiv2\pmod3$, which forces $m\equiv1\pmod3$. Write $m=3s+1$. Then
$$m(m+1)=(3s+1)(3s+2)=3(3s^2+3s)+2,$$
so the equation becomes
$$3(n^2+n)+2=3(3s^2+3s)+2,$$
hence $n^2+n=3(s^2+s)$. Therefore
$$b=T_n=\frac{n(n+1)}2=3\cdot\frac{s(s+1)}2=3T_s.$$`,
    rubric: [
      "Expresses the three consecutive triangular numbers as $T_{n-1},T_n,T_{n+1}$.",
      "Derives $3(n^2+n)+2=m^2+m$.",
      "Uses residues modulo $3$ to show $m\equiv1\pmod3$.",
      "Writes $m=3s+1$ and concludes $T_n=3T_s$.",
    ],
  },
  {
    year: 2019,
    day: 1,
    number: 3,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $A,B,C,D,E$ be five points in order on a circle $K$. Suppose that $AB=CD$ and $BC=DE$. Let the chords $AD$ and $BE$ intersect at the point $P$.

Prove that the circumcentre of triangle $AEP$ lies on $K$.`,
    explanation: String.raw`Since $AB=CD$ and $ABCD$ is cyclic, $ABCD$ is an isosceles trapezium, so $AD\parallel BC$. Similarly, $BC=DE$ gives $BE\parallel CD$.

Let $O$ be the midpoint of the arc $AE$ of $K$ that does not contain $B,C,D$; then $OA=OE$. Let $Q$ be the second intersection of $AO$ with the circle through $A,E,P$. Set $x=\angle BPA$. Using $AD\parallel BC$ and $BE\parallel CD$, an angle chase gives
$$\angle CDA=\angle DAB=x,\qquad \angle EQA=x.$$
It follows that $\angle OQE=x=\angle OEQ$, so $OQ=OE$. Hence $OQ=OE=OA$, meaning $O$ is the circumcentre of $\triangle AEP$. Since $O\in K$, the circumcentre lies on $K$.`,
    rubric: [
      "Uses the equal chords to obtain the parallelisms $AD\parallel BC$ and $BE\parallel CD$.",
      "Introduces the midpoint $O$ of arc $AE$ and the point $Q$ on circle $AEP$.",
      "Performs the angle chase to show $\angle OQE=\angle OEQ$.",
      "Deduces $OQ=OE=OA$ and concludes that $O$ is the circumcentre.",
    ],
  },
  {
    year: 2019,
    day: 1,
    number: 4,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Let $Q$ be a point inside the convex polygon $P_1P_2\cdots P_{1000}$. For each $i=1,2,\dots,1000$, extend the line $P_iQ$ until it meets the polygon again at a point $X_i$. Suppose that none of the points $X_1,X_2,\dots,X_{1000}$ is a vertex of the polygon.

Prove that there is at least one side of the polygon that does not contain any of the points $X_1,X_2,\dots,X_{1000}$.`,
    explanation: String.raw`Suppose $X_1$ lies on the side $P_iP_{i+1}$. Reversing the orientation if necessary, assume $i\le500$. The line $P_1Q$ separates the vertices $P_2,\dots,P_i$ from the vertices $P_{i+1},\dots,P_{1000}$. Consequently, for $j=2,\dots,i$, the point $X_j$ lies on one of the sides
$$P_iP_{i+1},\ P_{i+1}P_{i+2},\ \dots,\ P_{1000}P_1,$$
a collection of $1001-i$ sides. Moreover, no other $X_j$ can lie on one of these sides, because every other $X_j$ lies on the opposite side of the line $P_1Q$.

Thus the $i$ points $X_1,\dots,X_i$ occupy at most $i$ of these $1001-i$ sides. Since $i\le500$, we have $i<1001-i$, so at least one of these sides contains none of the $X_j$.`,
    rubric: [
      "Chooses a side containing $X_1$ and labels it $P_iP_{i+1}$ with $i\le500$.",
      "Shows that $X_2,\dots,X_i$ lie among the sides from $P_iP_{i+1}$ around to $P_{1000}P_1$.",
      "Explains why no $X_j$ with $j>i$ lies on those sides.",
      "Compares $i$ with $1001-i$ and concludes that some side is empty.",
    ],
  },
  {
    year: 2019,
    day: 2,
    number: 5,
    domain: "Combinatorics",
    skill: "Counting Principles",
    difficulty: "Challenge",
    stem: String.raw`A fancy triangle is an equilateral triangular array of integers such that the sum of the three numbers in any unit equilateral triangle is a multiple of $3$. For example, the array
$$\begin{matrix}&&1&&\\&0&&2&\\5&&7&&3\end{matrix}$$
is a fancy triangle with three rows because the sum of the numbers in each of its four unit equilateral triangles is a multiple of $3$.

Suppose that a fancy triangle has ten rows and that exactly $n$ of the numbers in the triangle are multiples of $3$.

Determine all possible values for $n$.`,
    explanation: String.raw`Work modulo $3$. The condition says that in every unit triangle the three residues sum to $0$. Propagating this relation through the array shows that the entire array is determined by the three corner residues $u,v,w$, and the condition is equivalent to
$$u+v+w\equiv0\pmod3.$$
Reducing modulo $3$, the possibilities are $(0,0,0)$, $(1,1,1)$, $(2,2,2)$, and the six permutations of $(0,1,2)$. Counting the entries congruent to $0$ in each case gives
$$n=55,\quad n=0,\quad n=0,\quad n=19,\quad n=18,$$
respectively. Hence the possible values are
$$n\in\{0,18,19,55\}.$$`,
    rubric: [
      "Reduces the array modulo $3$ and translates the condition into a local sum relation.",
      "Shows that the whole array is determined by three corner residues.",
      "Classifies the corner residues with $u+v+w\equiv0\pmod3$.",
      "Counts the multiples of $3$ in each case and lists $\{0,18,19,55\}$.",
    ],
  },
  {
    year: 2019,
    day: 2,
    number: 6,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $K$ be the circle passing through all four corners of a square $ABCD$. Let $P$ be a point on the minor arc $CD$, different from $C$ and $D$. The line $AP$ meets the line $BD$ at $X$ and the line $CP$ meets the line $BD$ at $Y$. Let $M$ be the midpoint of $XY$.

Prove that $MP$ is tangent to $K$.`,
    explanation: String.raw`Since $AC$ is a diameter of $K$, we have $\angle APC=90^\circ$, so $\angle XPY=90^\circ$. Thus $M$, the midpoint of the hypotenuse $XY$ of the right triangle $XPY$, satisfies
$$MX=MY=MP.$$
Hence $\angle MPX=\angle MXP$. Because $X$ lies on $BD$, this angle equals $\angle AXB$. An angle chase in the square and the circle gives
$$\angle MPA=90^\circ-\angle MPX=90^\circ-\angle AXB=\angle ABP.$$
By the converse of the alternate segment theorem, the line $MP$ is tangent to the circle $K$ at $P$.`,
    rubric: [
      "Uses $AC$ as a diameter to show $\angle XPY=90^\circ$.",
      "Uses the midpoint of the hypotenuse to get $MP=MX=MY$.",
      "Relates $\angle MPA$ to an angle at $B$ by an angle chase.",
      "Applies the converse of the alternate segment theorem to conclude tangency.",
    ],
  },
  {
    year: 2019,
    day: 2,
    number: 7,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Akshay writes a sequence $a_1,a_2,\dots,a_{100}$ of integers in which the first and last terms are equal to $0$. Except for the first and last terms, each term $a_i$ is larger than the average of its neighbours $a_{i-1}$ and $a_{i+1}$.

What is the smallest possible value for the term $a_{19}$?`,
    explanation: String.raw`Let $d_i=a_{i+1}-a_i$ for $i=1,\dots,99$. Then
$$a_j=d_1+d_2+\cdots+d_{j-1},$$
and the condition $a_i>\frac12(a_{i-1}+a_{i+1})$ is equivalent to
$$d_1>d_2>\cdots>d_{99}.$$
Also, summing the differences gives $d_1+\cdots+d_{99}=a_{100}-a_1=0$.

The sequence $d_i=50-i$ is strictly decreasing and sums to $0$, and it gives
$$a_{19}=\sum_{i=1}^{18}(50-i)=\frac{(49+32)\cdot18}{2}=729.$$
An exchange argument shows that no strictly decreasing integer sequence summing to $0$ can make the first $18$ terms smaller, so $729$ is minimal.`,
    rubric: [
      "Introduces the differences $d_i$ and shows they are strictly decreasing.",
      "Uses $a_1=a_{100}=0$ to get $\sum d_i=0$.",
      "Gives the extremal choice $d_i=50-i$ and computes $a_{19}=729$.",
      "Justifies minimality by an exchange or convexity argument.",
    ],
  },
  {
    year: 2019,
    day: 2,
    number: 8,
    domain: "Number Theory",
    skill: "Modular Arithmetic",
    difficulty: "Challenge",
    stem: String.raw`Let $n=16^{3^r}-4^{3^r}+1$ for some positive integer $r$.

Prove that $2^{n-1}-1$ is divisible by $n$.`,
    explanation: String.raw`Put $y=4^{3^r}$. Then $n=y^2-y+1$, and
$$y^3+1=(y+1)(y^2-y+1)=(y+1)n.$$
Thus $4^{3^{r+1}}+1\equiv0\pmod n$, so
$$2^{2\cdot3^{r+1}}\equiv-1\pmod n,$$
and hence
$$2^{4\cdot3^{r+1}}\equiv1\pmod n.$$
It remains to show that $4\cdot3^{r+1}\mid n-1$. Now
$$n-1=y(y-1)=4^{3^r}\left(4^{3^r}-1\right),$$
so it suffices to prove $3^{r+1}\mid4^{3^r}-1$. This follows by induction on $r$: for $r=1$, $3^2\mid4^3-1=63$; and if $3^{r+1}\mid4^{3^r}-1$, then
$$4^{3^{r+1}}-1=(4^{3^r}-1)\left(16^{3^r}+4^{3^r}+1\right),$$
where the second factor is divisible by $3$. Therefore $2^{n-1}\equiv1\pmod n$.`,
    rubric: [
      "Sets $y=4^{3^r}$ and factors $y^3+1$.",
      "Deduces $2^{2\cdot3^{r+1}}\equiv-1\pmod n$ and then $2^{4\cdot3^{r+1}}\equiv1$.",
      "Reduces the problem to proving $3^{r+1}\mid4^{3^r}-1$.",
      "Proves the divisibility by induction and concludes $2^{n-1}\equiv1\pmod n$.",
    ],
  },
  // -------------------------------------------------------------------------
  // 2020
  // -------------------------------------------------------------------------
  {
    year: 2020,
    day: 1,
    number: 1,
    domain: "Number Theory",
    skill: "Diophantine Equations",
    difficulty: "Hard",
    stem: String.raw`Determine all pairs $(a,b)$ of non-negative integers such that
$$\frac{a+b}{2}-\sqrt{ab}=1.$$`,
    explanation: String.raw`Put $x=\sqrt a$ and $y=\sqrt b$, so $x,y\ge0$. The equation becomes
$$\frac{x^2+y^2}{2}-xy=1,$$
that is,
$$(x-y)^2=2.$$
Hence $|x-y|=\sqrt2$. Suppose $x-y=\sqrt2$, so $x=y+\sqrt2$. Squaring,
$$a=b+2+2\sqrt{2b}.$$
Since $a$ and $b$ are integers, $\sqrt{2b}$ must be rational, hence $2b$ is a perfect square. Thus $b=2n^2$ for some integer $n\ge0$, and then
$$a=2n^2+2+4n=2(n+1)^2.$$
The other sign gives the same pairs with $a$ and $b$ interchanged. Therefore the solutions are
$$\{a,b\}=\{2n^2,\,2(n+1)^2\}\qquad(n\ge0).$$`,
    rubric: [
      "Substitutes $x=\sqrt a$ and $y=\sqrt b$ and rewrites the equation as $(x-y)^2=2$.",
      "Uses integrality to show that $2b$ and $2a$ must be perfect squares.",
      "Parametrises the solutions as $b=2n^2$ and $a=2(n+1)^2$.",
      "Includes both orders and checks the family.",
    ],
  },
  {
    year: 2020,
    day: 1,
    number: 2,
    domain: "Combinatorics",
    skill: "Recursion and Games",
    difficulty: "Challenge",
    stem: String.raw`Amy and Bec play the following game. Initially, there are three piles, each containing $2020$ stones. The players take turns to make a move, with Amy going first. Each move consists of choosing one of the piles available, removing the unchosen pile(s) from the game, and then dividing the chosen pile into $2$ or $3$ non-empty piles. A player loses the game if they are unable to make a move.

Prove that Bec can always win the game, no matter how Amy plays.`,
    explanation: String.raw`Call a pile perilous if its size is $1$ modulo $3$, and safe otherwise. Initially all three piles have size $2020\equiv1\pmod3$, so all are perilous.

Bec's strategy is to leave Amy with only perilous piles. Suppose Amy faces only perilous piles and chooses one of them. If she splits it into two piles, their sizes are both $1\pmod3$, so their sum is $2\pmod3$, not $1$; if she splits it into three piles, their sum is $0\pmod3$, not $1$. In either case at least one of the new piles is safe.

Bec now chooses a safe pile. If its size is $2\pmod3$, he splits it into two perilous piles (since $1+1\equiv2\pmod3$). If its size is $0\pmod3$, he splits it into three perilous piles (since $1+1+1\equiv0\pmod3$). Either move is possible because a safe pile has size at least $2$. Bec therefore restores the invariant that all remaining piles are perilous.

The total number of stones strictly decreases, so eventually Amy is left with piles of size $1$ only and has no legal move. Hence Bec wins.`,
    rubric: [
      "Defines perilous piles as those congruent to $1$ modulo $3$.",
      "Shows that Amy cannot split a perilous pile into only perilous piles.",
      "Describes Bec's reply from a safe pile, separating residues $0$ and $2$ modulo $3$.",
      "Uses termination of the strictly decreasing game to conclude Bec wins.",
    ],
  },
  {
    year: 2020,
    day: 1,
    number: 3,
    domain: "Geometry",
    skill: "Angles and Triangles",
    difficulty: "Challenge",
    stem: String.raw`Let $ABC$ be a triangle with $\angle ACB=90^\circ$. Suppose that the tangent line at $C$ to the circle passing through $A,B,C$ intersects the line $AB$ at $D$. Let $E$ be the midpoint of $CD$ and let $F$ be the point on the line $EB$ such that $AF$ is parallel to $CD$.

Prove that the lines $AB$ and $CF$ are perpendicular.`,
    explanation: String.raw`Use coordinates with $C=(0,0)$, $A=(a,0)$ and $B=(0,b)$. The circle through $A,B,C$ has equation
$$x^2+y^2-ax-by=0,$$
so its tangent at $C$ is
$$ax+by=0.$$
Intersecting this tangent with $AB$, whose equation is $\frac xa+\frac yb=1$, gives $D$. The midpoint $E$ of $CD$ is then explicit. The line through $A$ parallel to $CD$ meets $EB$ at $F$, and a direct substitution gives the coordinates of $F$. Finally, the dot product of the direction vectors of $AB$ and $CF$ is
$$(B-A)\cdot F=0,$$
so $AB\perp CF$.`,
    rubric: [
      "Sets up coordinates with the right angle at the origin.",
      "Finds the tangent line at $C$ from the circle equation.",
      "Computes $D$, then $E$, then $F$ using the parallel condition.",
      "Verifies the perpendicularity by a dot product or an equivalent slope calculation.",
    ],
  },
  {
    year: 2020,
    day: 1,
    number: 4,
    domain: "Algebra",
    skill: "Sequences and Series",
    difficulty: "Hard",
    stem: String.raw`Define the sequence $A_1,A_2,A_3,\dots$ by $A_1=1$ and, for $n=1,2,3,\dots$,
$$A_{n+1}=\frac{A_n+2}{A_n+1}.$$
Define the sequence $B_1,B_2,B_3,\dots$ by $B_1=1$ and, for $n=1,2,3,\dots$,
$$B_{n+1}=\frac{B_n^2+2}{2B_n}.$$
Prove that $B_{n+1}=A_{2^n}$ for all non-negative integers $n$.`,
    explanation: String.raw`Define
$$f(x)=\frac{x+2}{x+1},\qquad g(x)=\frac{x^2+2}{2x}.$$
Then $A_{n+1}=f(A_n)$ and $B_{n+1}=g(B_n)$. A direct calculation gives
$$g(f(x))=f(f(g(x))).$$
Also $f(1)=g(1)=\frac32$. We prove by induction that
$$B_{n+1}=g^n(1)=f^{2^n-1}(1)=A_{2^n}.$$
The case $n=0$ is $B_1=1=A_1$. For the induction step, using $g(f(y))=f(f(g(y)))$ repeatedly,
$$g^{n+1}(1)=g\left(f^{2^n-1}(1)\right)=f^{2(2^n-1)+1}(1)=f^{2^{n+1}-1}(1).$$
Thus the identity holds for every $n\ge0$.`,
    rubric: [
      "Defines $f$ and $g$ so that $A_{n+1}=f(A_n)$ and $B_{n+1}=g(B_n)$.",
      "Verifies the composition identity $g(f(x))=f(f(g(x)))$.",
      "Sets up induction on $n$ with the correct exponents.",
      "Concludes $B_{n+1}=A_{2^n}$ for all $n\ge0$.",
    ],
  },
  {
    year: 2020,
    day: 2,
    number: 5,
    domain: "Combinatorics",
    skill: "Pigeonhole and Invariants",
    difficulty: "Challenge",
    stem: String.raw`Each term of an infinite sequence $a_1,a_2,a_3,\dots$ is equal to $0$ or $1$. For each positive integer $n$,
(i) $a_n+a_{n+1}\ne a_{n+2}+a_{n+3}$, and
(ii) $a_n+a_{n+1}+a_{n+2}\ne a_{n+3}+a_{n+4}+a_{n+5}$.

Prove that if $a_1=0$, then $a_{2020}=1$.`,
    explanation: String.raw`Condition (i) says that consecutive sums of two adjacent terms are different, and condition (ii) says the same for consecutive sums of three adjacent terms. In particular, the pattern $010$ cannot occur: if $a_i,a_{i+1},a_{i+2}=0,1,0$, then comparing the adjacent pair sums around it forces a contradiction. The same argument with $0$ and $1$ interchanged rules out $101$.

Now split the sequence into maximal blocks of equal terms. No block after the first can have length $1$ or $2$: a block of length $1$ gives $010$ or $101$, and a block of length $2$ gives $0110$ or $1001$, which violates (i). A block of length $4$ or more contains four equal consecutive terms, which violates (i) as well. Thus the first block has length at most $3$, and every later block has length exactly $3$.

Therefore $a_{i+3}\ne a_i$ for every $i$. Since $2020-1=2019=3\cdot673$ is an odd multiple of $3$, we get $a_{2020}\ne a_1$. With $a_1=0$, this forces $a_{2020}=1$.`,
    rubric: [
      "Translates the two conditions into constraints on adjacent pair sums and triple sums.",
      "Rules out the patterns $010$ and $101$.",
      "Analyses maximal blocks of equal terms and shows all later blocks have length $3$.",
      "Uses $2019$ being an odd multiple of $3$ to conclude $a_{2020}\ne a_1$.",
    ],
  },
  {
    year: 2020,
    day: 2,
    number: 6,
    domain: "Geometry",
    skill: "Circles and Cyclic Quadrilaterals",
    difficulty: "Challenge",
    stem: String.raw`Let $ABCD$ be a square. For a point $P$ inside $ABCD$, a windmill centred at $P$ consists of two perpendicular lines $\ell_1$ and $\ell_2$ passing through $P$, such that

- $\ell_1$ intersects the sides $AB$ and $CD$ at $W$ and $Y$, respectively, and
- $\ell_2$ intersects the sides $BC$ and $DA$ at $X$ and $Z$, respectively.

A windmill is called round if the quadrilateral $WXYZ$ is cyclic.

Determine all points $P$ inside $ABCD$ such that every windmill centred at $P$ is round.`,
    explanation: String.raw`The required points are exactly the points on the two diagonals $AC$ and $BD$.

Suppose a windmill is round. Since $\angle WBX=\angle WPX=90^\circ$, the quadrilateral $WBXP$ is cyclic; similarly $YDZP$ is cyclic. Chasing angles in these two circles gives
$$\angle ABP=\angle WBP=\angle WXP=\angle WXZ=\angle ZYW=\angle ZYP=\angle ZDP=\angle ADP.$$
Thus triangles $ABP$ and $ADP$ share the side $AP$, have $AB=AD$, and have $\angle ABP=\angle ADP$. Hence either they are congruent, which gives $\angle APB=\angle APD$ and puts $P$ on $AC$, or the two angles are supplementary, which puts $P$ on $BD$. So every suitable $P$ lies on a diagonal.

Conversely, if $P$ lies on a diagonal, reflection in that diagonal shows that the relevant angles are equal, and an angle chase gives $\angle WXY+\angle WZY=180^\circ$. Hence $WXYZ$ is cyclic for every windmill centred at $P$.`,
    rubric: [
      "Uses the right angles to find the two cyclic quadrilaterals $WBXP$ and $YDZP$.",
      "Chases angles to obtain $\angle ABP=\angle ADP$.",
      "Splits into the congruent and supplementary cases, giving $P$ on $AC$ or $BD$.",
      "Proves the converse for points on either diagonal.",
    ],
  },
  {
    year: 2020,
    day: 2,
    number: 7,
    domain: "Combinatorics",
    skill: "Counting Principles",
    difficulty: "Challenge",
    stem: String.raw`A tetromino tile is a tile that can be formed by gluing together four unit square tiles, edge to edge. For each positive integer $n$, consider a bathroom whose floor is in the shape of a $2\times2n$ rectangle. Let $T_n$ be the number of ways to tile this bathroom floor with tetromino tiles. For example, $T_2=4$ since there are four ways to tile a $2\times4$ rectangular bathroom floor with tetromino tiles.

Prove that each of the numbers $T_1,T_2,T_3,\dots$ is a perfect square.`,
    explanation: String.raw`Let $F_0=F_1=1$ and $F_{n+1}=F_n+F_{n-1}$ for $n\ge1$. We prove that $T_n=F_n^2$.

Consider the leftmost columns of a tiling of the $2\times2n$ rectangle. Splitting according to whether they are covered by a $2\times2$ square, by two $1\times4$ rectangles, or by an L-tetromino together with some number of $1\times4$ rectangles gives the recursion
$$T_n=T_{n-1}+T_{n-2}+2(T_0+T_1+\cdots+T_{n-2}),$$
where $T_0=1$. Subtracting the same identity with $n$ replaced by $n-1$ yields, for $n\ge3$,
$$T_n=2T_{n-1}+2T_{n-2}-T_{n-3}.$$
The squares $F_n^2$ satisfy exactly the same recurrence, and
$$T_1=1=F_1^2,\qquad T_2=4=F_2^2,\qquad T_3=9=F_3^2.$$
Hence $T_n=F_n^2$ for all $n$, so every $T_n$ is a perfect square.`,
    rubric: [
      "Classifies the possible behaviour of the leftmost columns.",
      "Derives the recursion for $T_n$.",
      "Converts it to the three-term recurrence.",
      "Checks the initial values and identifies $T_n=F_n^2$.",
    ],
  },
  {
    year: 2020,
    day: 2,
    number: 8,
    domain: "Number Theory",
    skill: "Diophantine Equations",
    difficulty: "Challenge",
    stem: String.raw`Prove that for each integer $k$ satisfying $2\le k\le100$, there are positive integers $b_2,b_3,\dots,b_{101}$ such that
$$b_2^2+b_3^3+\cdots+b_k^k=b_{k+1}^{k+1}+b_{k+2}^{k+2}+\cdots+b_{101}^{101}.$$`,
    explanation: String.raw`Use the following lemma. If $k,k_1,\dots,k_m$ are positive integers with $\gcd(k,k_i)=1$ for every $i$, then the equation
$$x^k=x_1^{k_1}x_2^{k_2}\cdots x_m^{k_m}$$
has a solution in positive integers.

To prove the lemma, let $d=k_1k_2\cdots k_m$ and write $x_i=y^{d/k_i}$. The equation becomes $x^k=y^d$. Taking $y=n^z$ and $x=n^w$ reduces it to $kw=dz+1$, which has positive integer solutions because $\gcd(k,d)=1$.

Now apply the lemma to the given identity. For $k\ge52$, set most $b_i=1$, leaving a single equation of the form $b_{101}^{101}=\prod b_i^{i}$; since $101$ is prime and all exponents on the right are less than $101$, the lemma applies. For $11\le k\le50$, isolate a prime power with exponent coprime to the remaining exponents (using $11$ as a convenient prime), and for $3\le k\le10$ isolate a power of $3$. The remaining small cases $k=2$ and $k=52$ are handled by explicit choices, for example $b_1=11$, $b_3=b_4=2$ and all other $b_i=1$ when $k=2$. In each case the lemma supplies the required positive integers.`,
    rubric: [
      "States a lemma producing solutions to $x^k=\prod x_i^{k_i}$ when $\gcd(k,k_i)=1$.",
      "Proves the lemma using a common exponent and the Euclidean algorithm.",
      "Splits the range $2\le k\le100$ into manageable cases.",
      "Applies the lemma in each case (with explicit small-case choices) to construct the $b_i$.",
    ],
  },
];

export const OFFICIAL_AMO_PROBLEMS: Problem[] = OFFICIAL_SEEDS.map((seed) => {
  const paper = PAPER_BY_ID.get(`amo-${seed.year}`);
  if (!paper) throw new Error(`Missing AMO paper for ${seed.year}`);
  const dayLabel = seed.day === 1 ? "Day 1" : "Day 2";
  const ref: PaperRef = {
    id: paper.id,
    competition: COMPETITION,
    year: seed.year,
    day: seed.day,
    number: seed.number,
    title: `${seed.year} AMO ${dayLabel} · Problem ${seed.number}`,
    url: paper.url,
  };
  return {
    id: `amo-${seed.year}-p${seed.number}`,
    domain: seed.domain,
    skill: seed.skill,
    difficulty: seed.difficulty,
    type: "proof",
    stem: seed.stem,
    answer: "proof",
    explanation: seed.explanation,
    rubric: seed.rubric,
    source: `${COMPETITION} ${seed.year}, ${dayLabel}, Problem ${seed.number} — © Australian Mathematics Trust`,
    sourceUrl: paper.url,
    collection: "official",
    paper: ref,
  };
});

for (const paper of AMO_PAPERS) {
  paper.problemIds = OFFICIAL_AMO_PROBLEMS.filter((problem) => problem.paper?.id === paper.id)
    .sort((a, b) => (a.paper?.number ?? 0) - (b.paper?.number ?? 0))
    .map((problem) => problem.id);
}
