#!/usr/bin/env python3
"""Generate the Chapter 1 interactive geometry app (single HTML file)."""
from pathlib import Path
import json

# ─────────────────────────────────────────────────────────────
# CONTENT — faithful to Michael Augros, Introductory Arithmetic
# and Geometry, Chapter 1 (definitions, postulates, CNs, Thms 1–37)
# ─────────────────────────────────────────────────────────────

DEFINITIONS = [
  {
    "id": "def:1", "num": 1, "term": "Solid",
    "text": "A solid is whatever has length, width, and depth.",
    "kid": "A gold brick is a solid: it goes this way, that way, and up-down.",
    "mini": "solid"
  },
  {
    "id": "def:2", "num": 2, "term": "Surface",
    "text": "A solid stops at its surface (or surfaces); so a surface has length and width, but no depth.",
    "kid": "The flat top of a brick is a surface — flat like a tabletop, with no thickness of its own.",
    "mini": "surface"
  },
  {
    "id": "def:3", "num": 3, "term": "Line",
    "text": "When a surface comes to an end, it stops at a line (or lines); so a line has length, but no width or depth. (In this book, “line” usually means a finite line, often called a line segment today.)",
    "kid": "An edge of a table is a line: it has length, but no width or thickness.",
    "mini": "line"
  },
  {
    "id": "def:4", "num": 4, "term": "Point",
    "text": "When a line comes to an end, it stops at a point; so a point has no length, no width, no depth. Although it has no shape or size, a point does have one positive feature: its location.",
    "kid": "A point is just a place — like a perfect tiny dot with no size at all.",
    "mini": "point"
  },
  {
    "id": "def:5", "num": 5, "term": "Straight line",
    "text": "A straight line is a perfectly uniform line. Every part of it is the same “shape” as every other part, regardless of length, and different straight lines differ only in length, location, and orientation. Every other kind of line is called a curved line.",
    "kid": "A straight line never bends. Look at it end-on and it looks like a point.",
    "mini": "straight"
  },
  {
    "id": "def:6", "num": 6, "term": "Plane (flat surface)",
    "text": "A flat surface is a perfectly uniform surface. Every part of it, regardless of size, is the same “shape” all over and on both sides. A flat surface can also be called a plane.",
    "kid": "A plane is a perfectly flat surface — like a perfect sheet of paper that never wrinkles.",
    "mini": "plane"
  },
  {
    "id": "def:7", "num": 7, "term": "Plane angle",
    "text": "When two distinct lines in the same plane meet at a point, the inclination of one to the other is a plane angle. The point at which the lines meet is called the vertex of the angle.",
    "kid": "An angle is how much two lines “open” when they meet at a point (the vertex).",
    "mini": "angle"
  },
  {
    "id": "def:8", "num": 8, "term": "Rectilineal angle",
    "text": "A rectilineal angle is an angle formed by two different straight lines.",
    "kid": "A corner made by two straight lines is a rectilineal angle.",
    "mini": "rect-angle"
  },
  {
    "id": "def:9", "num": 9, "term": "Right angle",
    "text": "When one straight line stands on another in such a way that the two adjacent angles formed are equal to each other, each angle is called a right angle.",
    "kid": "A right angle is a perfect square corner — like the corner of a book.",
    "mini": "right"
  },
  {
    "id": "def:10", "num": 10, "term": "Perpendicular",
    "text": "A straight line standing on another at right angles is said to be perpendicular to the line on which it stands.",
    "kid": "Perpendicular means “standing straight up” on another line — making right angles.",
    "mini": "perp"
  },
  {
    "id": "def:11", "num": 11, "term": "Obtuse and acute angles",
    "text": "An obtuse angle is a rectilineal angle greater than a right angle. An acute angle is a rectilineal angle less than a right angle.",
    "kid": "Acute = sharp and skinny (less than a square corner). Obtuse = wide and open (more than a square corner).",
    "mini": "obtuse-acute"
  },
  {
    "id": "def:12", "num": 12, "term": "Supplementary and complementary",
    "text": "An obtuse angle and an acute angle are called supplementary when they add up to two right angles. Two acute angles are called complementary when they add up to one right angle.",
    "kid": "Complementary pair = one right angle together. Supplementary pair = two right angles (a straight line) together.",
    "mini": "comp-supp"
  },
  {
    "id": "def:13", "num": 13, "term": "Boundary",
    "text": "A boundary of a thing is its limit, or where it stops. For example, a sphere is bounded by one surface, a square by four lines, a straight line by two points.",
    "kid": "A boundary is the edge where something stops.",
    "mini": "boundary"
  },
  {
    "id": "def:14", "num": 14, "term": "Figure",
    "text": "A figure is something contained by its boundary or boundaries — something which cannot be entered or departed from without cutting across its boundary or boundaries.",
    "kid": "A figure has an inside. A triangle is a figure; a lone straight line is not, because you can pass through it without going through its endpoints.",
    "mini": "figure"
  },
  {
    "id": "def:15", "num": 15, "term": "Circle",
    "text": "A circle is a plane figure contained by one curved line whose every point is the same distance from a single point inside it.",
    "kid": "A circle is a round figure. Every point on the rim is the same distance from the center.",
    "mini": "circle"
  },
  {
    "id": "def:16", "num": 16, "term": "Center and circumference",
    "text": "The single point inside a circle which is the same distance from every point along the curved line bounding the circle is called the circle’s center. The curved line bounding the circle is called the circle’s circumference.",
    "kid": "Center = the middle point. Circumference = the round edge.",
    "mini": "center"
  },
  {
    "id": "def:17", "num": 17, "term": "Radius and diameter",
    "text": "Any straight line drawn from the center of a circle and stopping at the circumference is called a radius of the circle. By definitions 15 & 16, all the radii of a circle are equal. Any straight line drawn through the center of a circle and terminated at each end by the circumference is called a diameter. Any diameter bisects the circle.",
    "kid": "Radius: center to edge. Diameter: all the way across through the center (two radii in a line). All radii of one circle are equal!",
    "mini": "radius"
  },
  {
    "id": "def:18", "num": 18, "term": "Semicircle",
    "text": "A semicircle is the figure contained by a circle’s diameter and the circumference cut off by it.",
    "kid": "A semicircle is half a circle, cut along a diameter.",
    "mini": "semi"
  },
  {
    "id": "def:19", "num": 19, "term": "Rectilineal figures",
    "text": "A rectilineal figure is a plane figure contained by straight lines only. A triangle is a plane figure contained by three straight lines. A quadrilateral is a plane figure contained by four straight lines. A polygon is any plane figure contained by more than four straight lines.",
    "kid": "Triangle = 3 sides. Quadrilateral = 4 sides. Polygon = many sides (more than four here).",
    "mini": "triangle"
  },
  {
    "id": "def:20", "num": 20, "term": "Equilateral, isosceles, scalene",
    "text": "Among triangles, an equilateral triangle is one with all three sides equal. An isosceles triangle is one with only two sides equal. A scalene triangle is one without any equal sides.",
    "kid": "Equilateral: all sides same. Isosceles: exactly two sides same. Scalene: all sides different.",
    "mini": "tri-types"
  },
  {
    "id": "def:21", "num": 21, "term": "Right, obtuse, acute triangles; hypotenuse",
    "text": "Among triangles, a right triangle is one containing a right angle. An obtuse triangle is one containing an obtuse angle. An acute triangle is one with all three of its angles acute. In a right triangle, the side opposite the right angle is called the hypotenuse, and the two sides containing the right angle are called legs.",
    "kid": "Right triangle has a square corner. The long side opposite that corner is the hypotenuse; the other two sides are legs.",
    "mini": "right-tri"
  },
  {
    "id": "def:22", "num": 22, "term": "Parallel",
    "text": "If two straight lines lie in one plane together, but never meet each other in either direction however far they are extended, they are said to be parallel to each other.",
    "kid": "Parallel lines never meet — like railroad tracks that stay the same distance apart forever.",
    "mini": "parallel"
  },
  {
    "id": "def:23", "num": 23, "term": "Square, rectangle, rhombus, parallelogram, trapezium",
    "text": "Among quadrilaterals, a square has all four sides equal and all four angles right; a rectangle has all four angles right but not all four sides equal; a rhombus has all four sides equal but no right angles. A parallelogram is any quadrilateral contained by two pairs of parallel straight lines. Quadrilaterals that are none of the above will be called trapezia.",
    "kid": "Square: equal sides + right angles. Rectangle: right angles. Rhombus: equal sides, tilted. Parallelogram: two pairs of parallel sides.",
    "mini": "quads"
  },
  {
    "id": "def:24", "num": 24, "term": "Inclined toward each other",
    "text": "Two straight lines are inclined toward each other if, when cut by a third straight line, the sum of the two interior angles on one side is less than the sum of the two exterior angles on that same side.",
    "kid": "Lines that lean toward each other on one side of a cutting line will eventually meet on that side (see Postulate 5).",
    "mini": "inclined"
  },
]

POSTULATES = [
  {
    "id": "post:1", "num": 1, "term": "Draw a straight line",
    "text": "A straight line can be drawn from any point to any point.",
    "kid": "You may always connect two points with a straight line (use a straightedge).",
    "mini": "post1"
  },
  {
    "id": "post:2", "num": 2, "term": "Extend a straight line",
    "text": "Any straight line can be extended continuously in a straight line in either direction and as far as you please.",
    "kid": "You may always make a straight line longer in either direction.",
    "mini": "post2"
  },
  {
    "id": "post:3", "num": 3, "term": "Draw a circle",
    "text": "A circle can be drawn around any point as its center and with a radius of any given length.",
    "kid": "You may always draw a circle with any center and any radius (use a compass).",
    "mini": "post3"
  },
  {
    "id": "post:4", "num": 4, "term": "Right angles are equal",
    "text": "All right angles are equal. Not only are adjacent right angles equal to each other, but even those that are not adjacent.",
    "kid": "Every perfect square corner is the same size as every other perfect square corner.",
    "mini": "post4"
  },
  {
    "id": "post:5", "num": 5, "term": "Inclined lines meet",
    "text": "Straight lines inclined towards each other eventually meet, when extended far enough. (Restated with Thm. 11: if two straight lines make less than two right angles on one side of a third straight line, then they will eventually meet on that side.)",
    "kid": "If two lines lean toward each other, they will meet if you extend them far enough. This is Euclid’s famous parallel postulate!",
    "mini": "post5"
  },
]

COMMON_NOTIONS = [
  {
    "id": "cn:1", "num": 1, "term": "Transitivity of equality",
    "text": "Things equal to the same thing are also equal to each other.",
    "kid": "If A = C and B = C, then A = B. (36 inches = 1 yard and 3 feet = 1 yard, so 36 inches = 3 feet.)",
    "mini": "cn1"
  },
  {
    "id": "cn:2", "num": 2, "term": "Adding equals",
    "text": "When equals are added to equals, the wholes are equal.",
    "kid": "If two kids are the same height and each grows the same amount, they stay the same height.",
    "mini": "cn2"
  },
  {
    "id": "cn:3", "num": 3, "term": "Subtracting equals",
    "text": "When equals are subtracted from equals, the remainders are equal.",
    "kid": "Two equal pencils sharpened by the same amount stay equal.",
    "mini": "cn3"
  },
  {
    "id": "cn:4", "num": 4, "term": "Coincidence",
    "text": "Things that can be made to coincide with each other are equal.",
    "kid": "If two shapes can sit exactly on top of each other with nothing sticking out, they are equal.",
    "mini": "cn4"
  },
  {
    "id": "cn:5", "num": 5, "term": "Whole and part",
    "text": "Every whole is greater than any one of its parts.",
    "kid": "A whole pizza is bigger than any single slice. Always!",
    "mini": "cn5"
  },
]

# Additional principles used in proofs (named for reference)
EXTRA = [
  {
    "id": "prin:two-lines", "num": None, "term": "Two straight lines cannot enclose a space",
    "text": "Two straight lines cannot cut each other more than once; they cannot enclose a space. This follows from the perfect uniformity of straight lines.",
    "kid": "Straight lines can’t bend back to cross twice. They meet at most once.",
    "mini": "two-lines"
  },
  {
    "id": "prin:halves", "num": None, "term": "Halves of equals are equal",
    "text": "The halves of equal things are equal.",
    "kid": "If two cakes are the same size, half of each is also the same size.",
    "mini": "halves"
  },
]

def thm(num, title, kind, statement, steps, diagram, remarks=None, questions=None, aka=None, end="Q.E.D."):
    return {
        "id": f"thm:{num}",
        "num": num,
        "title": title,
        "aka": aka,
        "kind": kind,  # construction | theorem
        "statement": statement,
        "steps": steps,
        "diagram": diagram,
        "remarks": remarks or [],
        "questions": questions or [],
        "end": end,
    }

# Helper step makers
def S(text, cites=None, highlights=None, note=None):
    d = {"text": text}
    if cites: d["cites"] = cites
    if highlights: d["highlights"] = highlights
    if note: d["note"] = note
    return d

THEOREMS = [
  thm(1, "How to make an equilateral triangle", "construction",
    "Given a straight line AB, construct an equilateral triangle on it so that AB is the base.",
    [
      S("Draw circle X around point A with radius AB.", ["post:3"], ["circleA", "A", "B", "AB"]),
      S("Draw circle Z around point B with radius BA.", ["post:3"], ["circleB", "A", "B", "AB"]),
      S("These two circles intersect each other at points C and D.", None, ["circleA", "circleB", "C", "D"]),
      S("Join points A and C with a straight line.", ["post:1"], ["AC", "A", "C"]),
      S("Join points B and C with a straight line.", ["post:1"], ["BC", "B", "C"]),
      S("AC = AB, since these two lines are radii of circle A.", ["def:17"], ["AC", "AB", "circleA"]),
      S("BC = AB, since these are both radii of circle B.", ["def:17"], ["BC", "AB", "circleB"]),
      S("AC = BC, since each is equal to AB.", ["cn:1"], ["AC", "BC", "AB"], note="Steps 6 & 7; Common Notion 1"),
      S("So all three sides of triangle ABC are equal — it is equilateral.", ["def:20"], ["triABC", "AC", "BC", "AB"]),
    ],
    {"type": "equilateral", "params": {}},
    remarks=[
      "We made a perfectly equilateral triangle without measuring anything — using circles!",
      "The equilateral triangle is the simplest rectilineal figure: fewest sides, all the same.",
      "It will be very useful for later constructions (see Theorem 7).",
    ],
    questions=[
      {"q": "Does an equilateral triangle appear to be right, obtuse, or acute?", "hint": "Look at each corner compared with a square corner."},
      {"q": "Looking at the diagram, find a way to make a rhombus. Prove all four of its sides are equal.", "hint": "Use both intersection points C and D of the two circles."},
      {"q": "What happens if you make 3 more equilateral triangles, one on each side of △ABC?", "hint": "You are building toward a larger figure made of equilateral triangles."},
    ],
    end="Q.E.F."),

  thm(2, "Side-Angle-Side (SAS)", "theorem",
    "If in one triangle a side, the next angle, and the next side are respectively equal to a side, the next angle, and the next side in another triangle, then all the corresponding sides and angles of the two triangles are equal, and they have equal areas.",
    [
      S("Imagine △ABC and △DEF with AB = DE, ∠ABC = ∠DEF, and BC = EF.", None, ["triABC", "triDEF", "AB", "DE", "angB", "angE", "BC", "EF"]),
      S("Imagine moving △ABC so that AB lies on DE. Since they are equal, they coincide: A on D, B on E.", ["cn:4"], ["AB", "DE", "A", "D", "B", "E"]),
      S("Since ∠ABC = ∠DEF, BC will fall along EF, and C will fall on F (since BC = EF).", None, ["BC", "EF", "C", "F", "angB", "angE"]),
      S("So A, B, C sit on D, E, F. Then AC must coincide with DF — if it fell outside, two straight lines would cut each other at two points and enclose a space (impossible).", ["prin:two-lines"], ["AC", "DF"]),
      S("So AB, BC, AC coincide with DE, EF, DF. The triangles coincide exactly and are identical.", ["cn:4"], ["triABC", "triDEF"]),
      S("Therefore AC = DF, ∠BAC = ∠EDF, ∠BCA = ∠EFD, and the triangles have equal areas.", None, ["AC", "DF", "angA", "angD", "angC", "angF"]),
    ],
    {"type": "sas", "params": {}},
    remarks=[
      "SAS is used throughout geometry to prove equality of lines, angles, and areas.",
      "Congruent figures (≅) are the same size and same shape. △ABC ≅ △DEF means all corresponding sides and angles are equal.",
      "Two straight lines cannot enclose a space — they cannot cut more than once.",
    ],
    questions=[
      {"q": "When some parts are given equal, how do you decide which remaining parts “correspond”?", "hint": "Match the order: side–angle–side in the same sequence around each triangle."},
      {"q": "What if the triangles are mirror images? Can you still prove SAS?", "hint": "Flip one triangle over (reflect), then superpose."},
    ],
    aka="SAS Congruence"),

  thm(3, "Base angles of an isosceles triangle", "theorem",
    "In an isosceles triangle, the base angles are equal to each other, and the angles under the base are equal to each other.",
    [
      S("Let △ABC be isosceles with AB = AC. We claim ∠ABC = ∠ACB, and (extending AB to D and AC to E) ∠DBC = ∠ECB.", ["def:20"], ["triABC", "AB", "AC", "angB", "angC"]),
      S("Cut off CE = BD by drawing a circle around C with radius BD.", ["post:3"], ["circleC", "CE", "BD", "D", "E"]),
      S("Join BE and join CD.", ["post:1"], ["BE", "CD"]),
      S("AB = AC (given) and BD = CE (Step 2), so AD = AE (sums of equals).", ["cn:2"], ["AD", "AE", "AB", "AC", "BD", "CE"]),
      S("AC = AB (given isosceles) and ∠BAC is common to △ADC and △AEB.", None, ["AC", "AB", "angA"]),
      S("△ADC ≅ △AEB by Side-Angle-Side.", ["thm:2"], ["triADC", "triAEB"]),
      S("Corresponding parts: ∠ADC = ∠AEB and DC = EB. Also BD = CE, so △BDC ≅ △CEB by SAS.", ["thm:2"], ["triBDC", "triCEB", "DC", "EB"]),
      S("∠EBA = ∠DCA (from △ADC ≅ △AEB) and ∠EBC = ∠DCB (from △CEB ≅ △BDC), so the remainders ∠CBA = ∠BCA.", ["cn:3"], ["angB", "angC"]),
      S("The angles under the base, ∠DBC and ∠ECB, are also equal (corresponding angles of △BDC & △CEB).", None, ["angDBC", "angECB"]),
    ],
    {"type": "isosceles", "params": {}},
    remarks=[
      "Strategy: first prove the large overlapping triangles congruent, then the small ones under the base; then subtract equals from equals.",
      "This is a universal truth: it holds for every isosceles triangle, always and everywhere.",
    ],
    questions=[
      {"q": "Prove the same result by flipping △ABC onto itself.", "hint": "AB = AC so the sides swap places; the base angles must swap places too."},
      {"q": "Use Theorem 3 to prove that all three angles of an equilateral triangle are equal.", "hint": "Any two sides are equal, so any two base angles are equal."},
    ]),

  thm(4, "Converse of the isosceles base-angle theorem", "theorem",
    "If two angles in a triangle are equal to each other, then the sides opposite them are also equal — the triangle is isosceles (at least two sides equal).",
    [
      S("In △ABC suppose ∠ABC = ∠ACB. Claim: AB = AC.", None, ["triABC", "angB", "angC"]),
      S("Assume for contradiction that AB > AC. From AB cut off BD = AC and join CD.", ["post:1", "post:3"], ["BD", "CD", "D"]),
      S("In △DBC and △ACB: BD = AC, ∠DBC = ∠ACB (given), and BC is common — so △DBC ≅ △ACB by SAS.", ["thm:2"], ["triDBC", "triACB"]),
      S("But then their areas are equal — yet △DBC is a part of △ACB, and a part is less than the whole. Absurd!", ["cn:5"], ["triDBC", "triACB"]),
      S("So the assumption AB > AC is impossible. By the same reasoning AC is not greater than AB.", None, ["AB", "AC"]),
      S("Therefore neither side is greater: AB = AC.", None, ["AB", "AC", "triABC"]),
    ],
    {"type": "isosceles-converse", "params": {}},
    remarks=[
      "This is a reductio ad absurdum (reduction to the absurd / indirect proof).",
      "Theorem 4 is the converse of Theorem 3: equal base angles ⇔ isosceles (at least two equal sides).",
      "Not every converse of a true statement is true — this one needed a real proof.",
    ],
    questions=[
      {"q": "Use Theorem 4 to prove that any triangle with three equal angles is equilateral.", "hint": "Equal angles ⇒ opposite sides equal, thrice."},
    ]),

  thm(5, "Triangles are rigid", "theorem",
    "Triangles are rigid: given three straight lines making a triangle, you cannot change the angles while keeping all three sides the same lengths.",
    [
      S("Squares of hinged rods can collapse into a slanted shape. Can a triangle do the same?", None, ["square", "triRigid"], note="Motivation"),
      S("Suppose △ABM and another △ABN sit on base AB with AM = AN and BM = BN, but different angles.", None, ["triABM", "triABN", "M", "N"]),
      S("Join MN.", ["post:1"], ["MN"]),
      S("Since AM = AN, ∠AMN = ∠ANM (Thm. 3), so ∠1 + ∠2 = ∠3.", ["thm:3"], ["ang1", "ang2", "ang3"]),
      S("Since BM = BN, ∠BMN = ∠BNM (Thm. 3), so ∠2 = ∠3 + ∠4.", ["thm:3"], ["ang2", "ang3", "ang4"]),
      S("Substitute: replace ∠2 in the first equation by (∠3 + ∠4): ∠1 + ∠3 + ∠4 = ∠3.", None, ["ang1", "ang3", "ang4"]),
      S("Rearranged: ∠3 = ∠3 + ∠1 + ∠4 — an angle equal to itself plus more angles. Impossible!", ["cn:5"], ["ang3", "ang1", "ang4"]),
      S("Therefore a triangle cannot keep its sides and change its angles. Triangles are rigid.", None, ["triABM"]),
    ],
    {"type": "rigid", "params": {}},
    remarks=[
      "Another reductio. Bridges and roofs use triangular braces for this reason!",
      "Mirror-image triangles on the same base are still congruent — not a “tilt,” but a flip.",
    ],
    questions=[
      {"q": "Five sticks make a pentagon (one nail per corner). How many cross braces are needed to make it rigid?", "hint": "Think about triangulating the polygon."},
    ]),

  thm(6, "Side-Side-Side (SSS)", "theorem",
    "If the three sides of one triangle are equal to the three corresponding sides of another triangle, then the two triangles also have their corresponding angles equal (those between equal sides), and equal areas.",
    [
      S("Let △A and △B have three pairs of equal corresponding sides. Place them on the same base CD with equal sides sharing endpoints C and D, so CA = CB and DA = DB.", None, ["triA", "triB", "C", "D", "A", "B"]),
      S("If A and B did not coincide, then △BCD would have sides equal to those of △ACD yet slant differently — triangles would not be rigid.", None, ["A", "B"]),
      S("But triangles are rigid (Thm. 5), so A and B must coincide.", ["thm:5"], ["A", "B"]),
      S("Thus CA coincides with CB and DA with DB; all corresponding angles coincide.", None, ["CA", "CB", "DA", "DB"]),
      S("Things that coincide are equal: the triangles have equal corresponding angles and equal areas.", ["cn:4"], ["triA", "triB"]),
    ],
    {"type": "sss", "params": {}},
    remarks=[
      "SSS is our second triangle-congruence theorem (after SAS).",
      "Mirror images are fine: flip one triangle first.",
    ],
    questions=[
      {"q": "Using SSS, prove that the two equilateral triangles on the same straight line (one above, one below) are equal to each other.", "hint": "All three pairs of sides match by construction of Thm. 1."},
    ],
    aka="SSS Congruence"),

  thm(7, "How to bisect any rectilineal angle", "construction",
    "Given any rectilineal angle ABC, construct the ray that bisects it.",
    [
      S("Pick any point D on AB, and draw a circle around B with radius BD, cutting off BE = BD.", ["post:3"], ["circleB", "D", "E", "BD", "BE"]),
      S("Join DE.", ["post:1"], ["DE"]),
      S("Make equilateral triangle DEF on DE.", ["thm:1"], ["triDEF", "F"]),
      S("Join BF. Claim: BF bisects ∠DBE, i.e. ∠FBD = ∠FBE.", ["post:1"], ["BF", "angFBD", "angFBE"]),
      S("BE = BD (by construction).", None, ["BE", "BD"]),
      S("FE = FD (sides of equilateral triangle).", ["def:20"], ["FE", "FD"]),
      S("BF is common to △FBD and △FBE.", None, ["BF"]),
      S("So the three sides of △FBD equal the three sides of △FBE; corresponding angles are equal (SSS).", ["thm:6"], ["triFBD", "triFBE"]),
      S("Therefore ∠FBD = ∠FBE.", None, ["angFBD", "angFBE"]),
    ],
    {"type": "angle-bisector", "params": {}},
    remarks=[
      "There is no smallest rectilineal angle: any angle can be bisected again.",
      "Trisection with only straightedge and compass is impossible for a general angle.",
      "A right angle is 90°; half a turn (straight line) is 180°.",
    ],
    questions=[
      {"q": "Does the construction still work if the equilateral triangle is built on the other side of DE?", "hint": "Check whether SSS still applies to the two small triangles."},
      {"q": "Draw any triangle and bisect all three angles. What do you notice?", "hint": "The three bisectors meet at one point (the incenter)."},
    ],
    end="Q.E.F."),

  thm(8, "How to bisect any straight line", "construction",
    "Given a straight line AB, construct its midpoint.",
    [
      S("Make equilateral triangle ABC on AB.", ["thm:1"], ["triABC", "C"]),
      S("Bisect ∠ACB with line CD meeting AB at D.", ["thm:7"], ["CD", "D", "angACB"]),
      S("AC = CB (equilateral).", ["def:20"], ["AC", "CB"]),
      S("∠ACD = ∠BCD (CD bisects the angle).", None, ["angACD", "angBCD"]),
      S("CD is common to △ACD and △BCD.", None, ["CD"]),
      S("By SAS, corresponding sides and angles of △ACD and △BCD are equal.", ["thm:2"], ["triACD", "triBCD"]),
      S("Therefore AD = DB. D is the midpoint of AB.", None, ["AD", "DB", "D"]),
    ],
    {"type": "segment-bisector", "params": {}},
    remarks=[
      "There is no smallest straight line: any segment can be bisected again.",
      "Cutting a segment into three equal parts is possible later with more tools from this book.",
    ],
    questions=[
      {"q": "Looking back at Theorem 1’s diagram, what is the fewest steps to bisect a segment?", "hint": "The line joining the two circle intersections already bisects AB."},
      {"q": "Bisect the three sides of a triangle and join each vertex to the midpoint of the opposite side. What happens?", "hint": "The three medians meet at one point (the centroid)."},
    ],
    end="Q.E.F."),

  thm(9, "Erect a perpendicular from a point on a line", "construction",
    "Given a straight line AB and a point P on it, draw a line from P at right angles to AB.",
    [
      S("Pick any point C on AP; draw a circle around P with radius PC, cutting off PD = PC.", ["post:3"], ["circleP", "C", "D", "PC", "PD"]),
      S("Make equilateral triangle CDR on CD.", ["thm:1"], ["triCDR", "R"]),
      S("Join PR. Claim: PR ⊥ AB.", ["post:1"], ["PR"]),
      S("PD = PC (construction).", None, ["PD", "PC"]),
      S("CR = DR (equilateral).", ["def:20"], ["CR", "DR"]),
      S("PR is common to △RPC and △RPD.", None, ["PR"]),
      S("By SSS, corresponding angles of △RPC and △RPD are equal.", ["thm:6"], ["triRPC", "triRPD"]),
      S("So ∠RPC = ∠RPD.", None, ["angRPC", "angRPD"]),
      S("These are adjacent angles formed by PR standing on AB and are equal — therefore they are right angles.", ["def:9"], ["angRPC", "angRPD"]),
      S("Thus PR is perpendicular to AB at P.", ["def:10"], ["PR", "AB", "P"]),
    ],
    {"type": "perp-on", "params": {}},
    remarks=[
      "We have now drawn right triangles (△RPC and △RPD).",
      "In practice, carpenters use a square — but the square itself is made by geometry.",
    ],
    questions=[
      {"q": "Prove: any point on the perpendicular bisector of a segment is equidistant from both endpoints.", "hint": "Use SSS or SAS with the two right triangles formed."},
    ],
    end="Q.E.F."),

  thm(10, "Drop a perpendicular from a point to a line", "construction",
    "Given a straight line AB and a point P not on it, drop a perpendicular from P to AB.",
    [
      S("Choose any point D on the opposite side of AB from P.", None, ["D"]),
      S("Draw a circle around P with radius PD, cutting AB at G and E.", ["post:3"], ["circleP", "G", "E"]),
      S("Join GP and EP.", ["post:1"], ["GP", "EP"]),
      S("Bisect GE at H.", ["thm:8"], ["H", "GE"]),
      S("Join PH. Claim: PH ⊥ AB.", ["post:1"], ["PH"]),
      S("PG = PE (radii of circle P).", ["def:17"], ["PG", "PE"]),
      S("HG = HE (bisected).", None, ["HG", "HE"]),
      S("PH is common to △PHG and △PHE.", None, ["PH"]),
      S("By SSS, corresponding angles are equal.", ["thm:6"], ["triPHG", "triPHE"]),
      S("So ∠PHG = ∠PHE; they are adjacent and equal on a straight line, hence right angles.", ["def:9"], ["angPHG", "angPHE"]),
      S("Therefore PH is perpendicular to AB.", ["def:10"], ["PH", "AB"]),
    ],
    {"type": "perp-drop", "params": {}},
    remarks=[
      "Theorem 10 is the opposite of Theorem 9: the point is off the line rather than on it.",
      "If P is not “above” the segment, extend AB first (Postulate 2).",
    ],
    questions=[
      {"q": "Do you need to draw PG and EP to construct PH, or only to prove it?", "hint": "They serve the proof; a shorter construction exists for practice."},
    ],
    end="Q.E.F."),

  thm(11, "Adjacent angles on a straight line", "theorem",
    "When one straight line stands on another, the adjacent angles add up to two right angles.",
    [
      S("If PB is perpendicular to CD, clearly ∠PBC + ∠PBD = two right angles. Now let AB stand on CD not necessarily perpendicularly.", None, ["AB", "CD", "B"]),
      S("Draw BP perpendicular to CD.", ["thm:9"], ["BP"]),
      S("Then ∠PBC + ∠PBD = two right angles.", ["def:9"], ["angPBC", "angPBD"]),
      S("But ∠PBC + ∠PBD = ∠1 + ∠2 + ∠3 (the pieces of the same region).", None, ["ang1", "ang2", "ang3"]),
      S("So ∠1 + ∠2 + ∠3 = two right angles.", ["cn:1"], ["ang1", "ang2", "ang3"]),
      S("But ∠1 + ∠2 + ∠3 = ∠ABC + ∠ABD.", None, ["angABC", "angABD"]),
      S("Therefore ∠ABC + ∠ABD = two right angles.", ["cn:1"], ["angABC", "angABD"]),
    ],
    {"type": "adjacent-straight", "params": {}},
    remarks=[
      "Angles supplementary to the same angle are equal to each other.",
      "With Thm. 11 we can restate Postulate 5: if two lines make less than two right angles on one side of a transversal, they meet on that side.",
    ],
    questions=[
      {"q": "If ∠ABC and ∠ABD are adjacent on a straight line, what is each called relative to the other?", "hint": "Supplementary."},
    ]),

  thm(12, "Converse: angles sum to two rights ⇒ straight line", "theorem",
    "If two adjacent angles add up to two right angles, then the outer legs form one straight line.",
    [
      S("Let ∠APB + ∠BPC = two right angles. Claim: A, P, C are collinear (AP and PC form a straight line).", None, ["angAPB", "angBPC", "A", "P", "C"]),
      S("Suppose PC is not the extension of AP. Extend AP to some point X.", ["post:2"], ["AX", "X"]),
      S("Then ∠1 + ∠2 = two right angles (Thm. 11, since APX is straight).", ["thm:11"], ["ang1", "ang2"]),
      S("But ∠APB + ∠BPC = two right angles (given), i.e. ∠1 + ∠2 + ∠3 = two right angles.", None, ["ang1", "ang2", "ang3"]),
      S("So ∠1 + ∠2 = ∠1 + ∠2 + ∠3 (both equal two rights; using that all right angles are equal).", ["post:4", "cn:1"], ["ang1", "ang2", "ang3"]),
      S("But then a whole equals a proper part — impossible.", ["cn:5"], ["ang3"]),
      S("Therefore PC is the straight extension of AP.", None, ["A", "P", "C"]),
    ],
    {"type": "straight-converse", "params": {}},
    remarks=[
      "Theorem 12 is the converse of Theorem 11.",
      "First essential use of Postulate 4 (all right angles equal) in comparing “two right angles” quantities.",
    ]),

  thm(13, "Vertical angles are equal", "theorem",
    "When two straight lines cut each other, they make the vertical (opposite) angles equal.",
    [
      S("Let AB and CD cut at P. Claim: vertical angles are equal — ∠1 = ∠3 and ∠2 = ∠4.", None, ["AB", "CD", "P", "ang1", "ang2", "ang3", "ang4"]),
      S("∠1 + ∠2 = two right angles (Thm. 11).", ["thm:11"], ["ang1", "ang2"]),
      S("∠3 + ∠2 = two right angles (Thm. 11).", ["thm:11"], ["ang3", "ang2"]),
      S("So ∠1 + ∠2 = ∠3 + ∠2.", ["cn:1"], ["ang1", "ang2", "ang3"]),
      S("Subtract ∠2 from both sides: ∠1 = ∠3.", ["cn:3"], ["ang1", "ang3"]),
      S("Likewise ∠2 = ∠4.", ["cn:3"], ["ang2", "ang4"]),
    ],
    {"type": "vertical", "params": {}},
    remarks=[
      "Vertical angles are mirror images across the vertex — a symmetry of straight lines.",
      "A partial converse: equal angles sharing a vertex with alternate legs collinear force the remaining legs collinear.",
    ],
    questions=[
      {"q": "How many degrees do ∠1 + ∠2 + ∠3 + ∠4 make together?", "hint": "Two pairs of two right angles."},
    ]),

  thm(14, "Exterior angle greater than remote interior", "theorem",
    "If any side of a triangle is extended, the exterior angle is greater than either of the interior and opposite (remote) angles.",
    [
      S("In △ABC extend BC to D. Claim: exterior ∠ACD > ∠BAC and ∠ACD > ∠ABC.", None, ["triABC", "extAng", "angA", "angB"]),
      S("Bisect AC at E; join BE and produce it to F with EF = BE; join CF.", ["thm:8", "post:1", "post:2"], ["E", "BE", "F", "CF"]),
      S("EF = BE and EA = EC.", None, ["EF", "BE", "EA", "EC"]),
      S("∠AEB = ∠CEF (vertical angles).", ["thm:13"], ["angAEB", "angCEF"]),
      S("By SAS, corresponding angles of △AEB and △CEF are equal.", ["thm:2"], ["triAEB", "triCEF"]),
      S("So ∠BAC = ∠ECF (corresponding). But ∠ACD > ∠ECF (whole > part).", ["cn:5"], ["angA", "angECF", "extAng"]),
      S("Therefore ∠ACD > ∠BAC.", None, ["extAng", "angA"]),
      S("Similarly, by bisecting BC and extending AC, ∠ACD > ∠ABC (using vertical angles again).", ["thm:13"], ["extAng", "angB"]),
    ],
    {"type": "exterior", "params": {}},
    remarks=[
      "Later (Thm. 28) we learn the exterior angle equals the sum of the two remote interiors — which explains why it is greater than each.",
    ]),

  thm(15, "Greater side opposite greater angle", "theorem",
    "In any triangle, a greater side has opposite to it a greater angle.",
    [
      S("In △ABC suppose AC > AB. Claim: ∠ABC > ∠BCA.", None, ["triABC", "AC", "AB", "angB", "angC"]),
      S("Cut off AD = AB on AC; join BD.", ["post:1"], ["AD", "BD", "D"]),
      S("∠ABD = ∠ADB (base angles of isosceles △ABD).", ["thm:3"], ["angABD", "angADB"]),
      S("∠ADB > ∠ACB because ∠ADB is exterior to △BDC.", ["thm:14"], ["angADB", "angC"]),
      S("So ∠ABD > ∠ACB.", None, ["angABD", "angC"]),
      S("But ∠ABC > ∠ABD (whole > part).", ["cn:5"], ["angB", "angABD"]),
      S("Therefore ∠ABC > ∠ACB.", None, ["angB", "angC"]),
    ],
    {"type": "side-angle", "params": {}},
    remarks=[
      "Greatest side opposite greatest angle; least opposite least. Equal sides opposite equal angles (Thm. 3).",
      "Angles are NOT proportional to opposite sides — double a side does not double the angle!",
    ]),

  thm(16, "Greater angle opposite greater side", "theorem",
    "In any triangle, a greater angle has opposite to it a greater side.",
    [
      S("In △ABC suppose ∠ABC > ∠ACB. Claim: AC > AB.", None, ["triABC", "angB", "angC", "AC", "AB"]),
      S("Only three possibilities: AC = AB, or AC < AB, or AC > AB.", None, []),
      S("If AC = AB, then ∠ABC = ∠ACB by Thm. 3 — contradicting the given inequality.", ["thm:3"], ["AC", "AB"]),
      S("If AC < AB, then by Thm. 15 we would have ∠ABC < ∠ACB — again a contradiction.", ["thm:15"], ["AC", "AB"]),
      S("Therefore AC is neither equal nor less than AB: AC > AB.", None, ["AC", "AB"]),
    ],
    {"type": "angle-side", "params": {}},
    remarks=[
      "Converse of Theorem 15. Strategy: process of elimination among three trichotomy cases.",
      "No construction at all — pure logic from prior theorems.",
    ]),

  thm(17, "Triangle inequality", "theorem",
    "In any triangle, any side is less than the sum of the other two sides, but greater than their difference.",
    [
      S("In △ABC claim BA + AC > BC (and cyclic).", None, ["triABC", "BA", "AC", "BC"]),
      S("Extend BA to D with AD = AC; join CD.", ["post:2", "post:1"], ["D", "AD", "CD"]),
      S("∠BCD > ∠ACD (whole > part), and ∠ACD = ∠ADC (isosceles △ACD), so ∠BCD > ∠ADC.", ["thm:3", "cn:5"], ["angBCD", "angADC"]),
      S("In △DBC, the side opposite the greater angle is greater: BD > BC.", ["thm:16"], ["BD", "BC"]),
      S("But BD = BA + AD = BA + AC, so BA + AC > BC.", None, ["BA", "AC", "BC"]),
      S("Likewise the other two inequalities. Also BA > BC − AC by subtracting AC from both sides of BA + AC > BC.", ["cn:3"], []),
    ],
    {"type": "triangle-inequality", "params": {}},
    remarks=[
      "A straight line is the shortest distance between two points (“as the crow flies”).",
      "Three lengths form a triangle only if any two sum to more than the third.",
    ],
    questions=[
      {"q": "Which of these can form a triangle? (a) 3,4,5 (b) 1,2,3 (c) 1,1,1 (d) 1,10,11", "hint": "Check each pair-sum against the third side."},
    ]),

  thm(18, "Shortest path to a line is the perpendicular", "theorem",
    "The shortest distance from a point to a straight line is the perpendicular from the point to the line.",
    [
      S("From P drop perpendicular PL to line AB. Let R be any other point on AB. Claim: PR > PL.", ["thm:10"], ["P", "PL", "L", "R", "PR", "AB"]),
      S("In △PLR, ∠PLR is a right angle. The exterior angle at L looking from another formation, or simply: ∠PRL’s companion — use: ∠ at L in the right triangle is right, and ∠PR L’s remote comparison via Thm. 14 on an exterior setup.", None, ["triPLR"], note="Clean version below"),
      S("∠PLR is right. Exterior to a suitable triangle or directly: the angle at R, ∠PRL, is acute (part of the figure), but the rigorous Augros path: ∠ at L opposite… Actually: ∠1 (at L exterior-style) — we use: right angle ∠PLR > ∠PRL (acute), wait — standard: ∠PLR is right > ∠PRL, so side opposite right angle (PR) > side opposite ∠PRL (PL).", ["thm:14", "thm:16", "def:9"], ["angPLR", "PR", "PL"]),
      S("More cleanly with Augros: ∠ at L exterior comparison gives ∠PLR = right > the angle at R; then greater angle opposite greater side: PR > PL.", ["thm:16"], ["PR", "PL"]),
    ],
    {"type": "shortest-perp", "params": {}},
    remarks=[
      "Among all straight segments from P to the line, the perpendicular is shortest.",
    ]),

  thm(19, "Construct a triangle from three sides", "construction",
    "Given three straight lines X, Y, Z such that any two together are greater than the third, construct a triangle with those side lengths.",
    [
      S("Place X as DA and extend to E as needed; cut off AB = Y and BF = Z.", ["post:2", "post:3"], ["DA", "AB", "BF"]),
      S("Draw circle around A with radius AD (= X).", ["post:3"], ["circleA"]),
      S("Draw circle around B with radius BF (= Z).", ["post:3"], ["circleB"]),
      S("Because the triangle inequalities hold, the circles overlap and each passes outside the other — they must intersect.", ["thm:17"], ["circleA", "circleB"]),
      S("Call an intersection C; join AC and CB.", ["post:1"], ["C", "AC", "CB"]),
      S("Then AC = X, AB = Y, BC = Z: △ABC is constructed.", None, ["triABC"]),
    ],
    {"type": "sss-construct", "params": {}},
    remarks=[
      "Converse of Theorem 17: the inequality condition is also sufficient.",
    ],
    questions=[
      {"q": "Make a triangle with sides 3, 4, 5. What do you notice?", "hint": "Check the angles — especially the one opposite 5."},
    ],
    end="Q.E.F."),

  thm(20, "Copy an angle", "construction",
    "Given an angle X and a ray PR, construct an angle at P, with one side along PR, equal to angle X.",
    [
      S("Pick points A and B on the legs of ∠X and join AB.", ["post:1"], ["A", "B", "AB", "angX"]),
      S("On ray PR, cut off PS = XA, PT = XB, and TV = AB (using circles/postulates as needed).", ["post:3"], ["PS", "PT", "TV"]),
      S("Construct △PZT with sides equal to those of △XAB (Thm. 19).", ["thm:19"], ["triPZT", "triXAB"]),
      S("By SSS, corresponding angles are equal: ∠ZPT = ∠AXB.", ["thm:6"], ["angZPT", "angX"]),
      S("∠ZPT begins at P with one leg along PR, as required.", None, ["angZPT", "PR"]),
    ],
    {"type": "copy-angle", "params": {}},
    remarks=[
      "This construction also lets us duplicate an entire triangle.",
    ],
    end="Q.E.F."),

  thm(21, "Angle-Side-Angle (ASA)", "theorem",
    "If in a triangle two angles and the side joining them are respectively equal to two angles and the side joining them in another triangle, then all corresponding sides and angles are equal, and the triangles have equal area.",
    [
      S("Given △ABC, △DEF with ∠BAC = ∠EDF, AB = DE, ∠ABC = ∠DEF.", None, ["triABC", "triDEF"]),
      S("Place AB on DE (equal lengths): A on D, B on E.", ["cn:4"], ["AB", "DE"]),
      S("Because ∠BAC = ∠EDF, ray AC lies along ray DF.", None, ["AC", "DF"]),
      S("Because ∠ABC = ∠DEF, ray BC lies along ray EF.", None, ["BC", "EF"]),
      S("Therefore C, the intersection of AC and BC, sits on F.", None, ["C", "F"]),
      S("The three sides coincide; by SSS (or coincidence) the triangles are congruent with equal areas.", ["thm:6", "cn:4"], ["triABC", "triDEF"]),
    ],
    {"type": "asa", "params": {}},
    remarks=[
      "Third congruence criterion: SAS, SSS, ASA.",
    ],
    aka="ASA Congruence"),

  thm(22, "Angle-Angle-Side (AAS)", "theorem",
    "If two triangles have two angles equal to two angles, and a side equal to a corresponding side opposite an equal angle, then they have all corresponding sides and angles equal, and equal areas.",
    [
      S("Given ∠BCA = ∠EFD, ∠BAC = ∠EDF, and AB = DE (sides opposite a pair of equal angles, in Augros’s setup).", None, ["triABC", "triDEF"]),
      S("Place AB on DE. A on D, B on E; AC along DF because ∠A = ∠D.", None, ["AB", "DE", "AC", "DF"]),
      S("Suppose AC < DF so C lands at {C} on DF. Then ∠ at E in △D{C}E equals original ∠B, hence equals ∠F — making an exterior angle equal a remote interior. Impossible (Thm. 14).", ["thm:14"], ["extBad"]),
      S("Similarly AC cannot exceed DF. So AC = DF.", None, ["AC", "DF"]),
      S("Now AB = DE, ∠A = ∠D, AC = DF ⇒ congruent by SAS.", ["thm:2"], ["triABC", "triDEF"]),
    ],
    {"type": "aas", "params": {}},
    remarks=[
      "Fourth congruence criterion: SAS, SSS, ASA, AAS.",
      "SSA is NOT a general congruence theorem (the ambiguous case).",
    ],
    aka="AAS Congruence"),

  thm(23, "Equal alternate angles ⇒ parallel", "theorem",
    "If two straight lines are cut by a third making the alternate angles equal, then the two straight lines are parallel.",
    [
      S("Let EF cut AB and CD with alternate angles ∠1 = ∠2. Claim: AB ∥ CD.", None, ["AB", "CD", "EF", "ang1", "ang2"]),
      S("Suppose not: extend so that EB and FD meet at X on one side, forming △EFX.", None, ["X", "triEFX"]),
      S("Then ∠1 is exterior to △EFX and ∠2 is a remote interior angle.", None, ["ang1", "ang2"]),
      S("But ∠1 = ∠2 by given — contradicting Thm. 14 (exterior > remote interior).", ["thm:14"], ["ang1", "ang2"]),
      S("Therefore AB and CD never meet: they are parallel.", ["def:22"], ["AB", "CD"]),
    ],
    {"type": "alt-parallel", "params": {}},
    remarks=[
      "We can prove lines never meet without checking infinitely far!",
      "The cutting line EF is called a transversal.",
    ]),

  thm(24, "Co-interior angles supplementary ⇒ parallel", "theorem",
    "If two straight lines are cut by a third making interior angles on the same side add up to two right angles, then the two lines are parallel.",
    [
      S("Let EF cut AB and CD with ∠2 + ∠3 = two right angles. Claim: AB ∥ CD.", None, ["AB", "CD", "EF", "ang2", "ang3"]),
      S("∠2 + ∠3 = two rights (given).", None, ["ang2", "ang3"]),
      S("∠2 + ∠1 = two rights (adjacent on a straight line).", ["thm:11"], ["ang2", "ang1"]),
      S("So ∠2 + ∠3 = ∠2 + ∠1, hence ∠3 = ∠1.", ["cn:1", "cn:3"], ["ang3", "ang1"]),
      S("But equal alternate angles ⇒ parallel.", ["thm:23"], ["AB", "CD"]),
    ],
    {"type": "cointerior-parallel", "params": {}},
    remarks=[
      "Postulate 5: if co-interior angles sum to less than 180°, lines meet. Thm. 24: if they sum to exactly 180°, lines do not meet.",
      "Corollary: only one perpendicular from a point to a line.",
    ]),

  thm(25, "Parallel ⇒ alternate equal and co-interior supplementary", "theorem",
    "If a straight line cuts two parallels, it makes alternate angles equal and interior angles on the same side supplementary (sum to two right angles).",
    [
      S("Let AB ∥ CD cut by transversal EGHF. Claim: alternate ∠1 = ∠3 and co-interior ∠2 + ∠3 = two rights.", ["def:22"], ["AB", "CD", "trans", "ang1", "ang2", "ang3"]),
      S("Suppose ∠1 > ∠3. Then ∠1 + ∠2 > ∠3 + ∠2.", None, ["ang1", "ang2", "ang3"]),
      S("But ∠1 + ∠2 = two rights, so two rights > ∠3 + ∠2.", ["thm:11"], ["ang1", "ang2"]),
      S("By Postulate 5 (restated), AB and CD would meet on that side — contradicting parallelism.", ["post:5"], ["AB", "CD"]),
      S("Similarly ∠1 < ∠3 is impossible. Therefore ∠1 = ∠3.", None, ["ang1", "ang3"]),
      S("Then ∠2 + ∠3 = ∠2 + ∠1 = two right angles.", ["thm:11"], ["ang2", "ang3"]),
    ],
    {"type": "parallel-angles", "params": {}},
    remarks=[
      "Converse of Theorems 23 and 24. First essential use of Postulate 5 in a theorem.",
      "Order matters: we first learn when lines must be parallel (constructible criteria), then what follows from being parallel.",
    ],
    questions=[
      {"q": "Prove that through a point P only one line can be parallel to a given line AB.", "hint": "Assume two parallels through P and use a transversal."},
    ]),

  thm(26, "Transitivity of parallelism", "theorem",
    "Straight lines parallel to the same straight line are parallel to each other.",
    [
      S("Let A ∥ B and B ∥ C. Claim: A ∥ C.", None, ["lineA", "lineB", "lineC"]),
      S("Cut all three with transversal D, forming angles 1, 2, 3, 4.", ["post:1"], ["transD", "ang1", "ang2", "ang3", "ang4"]),
      S("∠1 = ∠2 (A ∥ B).", ["thm:25"], ["ang1", "ang2"]),
      S("∠2 = ∠3 (vertical angles).", ["thm:13"], ["ang2", "ang3"]),
      S("∠1 = ∠3.", ["cn:1"], ["ang1", "ang3"]),
      S("∠3 = ∠4 (B ∥ C).", ["thm:25"], ["ang3", "ang4"]),
      S("∠1 = ∠4, so A ∥ C (equal alternate angles).", ["thm:23"], ["lineA", "lineC"]),
    ],
    {"type": "parallel-trans", "params": {}},
    remarks=[
      "Parallelism behaves like equality (transitive). Perpendicularity does not: two perpendiculars to the same line are parallel to each other, not perpendicular.",
    ]),

  thm(27, "Draw a parallel through a point", "construction",
    "Given a line AB and a point P not on it, draw the line through P parallel to AB.",
    [
      S("Pick any point X on AB; join PX.", ["post:1"], ["X", "PX"]),
      S("At P, construct ∠LPX = ∠PXB (copy the alternate angle).", ["thm:20"], ["angLPX", "angPXB", "PL"]),
      S("Then PL ∥ AB by equal alternate angles.", ["thm:23"], ["PL", "AB"]),
    ],
    {"type": "make-parallel", "params": {}},
    remarks=[
      "In carpentry a more stable practical method uses two equal perpendiculars.",
    ],
    end="Q.E.F."),

  thm(28, "Angle sum of a triangle", "theorem",
    "In any triangle the three angles add up to two right angles, and an exterior angle equals the sum of the two remote interior angles.",
    [
      S("In △ABC with angles 1, 2, 3, extend BC to X. Claim: exterior ∠ACX = 2 + 3, and 1 + 2 + 3 = two rights.", None, ["triABC", "ext", "ang1", "ang2", "ang3"]),
      S("Draw CP ∥ BA through C.", ["thm:27"], ["CP"]),
      S("This splits exterior ∠ACX into ∠4 + ∠5.", None, ["ang4", "ang5", "ext"]),
      S("∠2 = ∠4 (alternate angles, BA ∥ CP).", ["thm:25"], ["ang2", "ang4"]),
      S("∠3 = ∠5 (alternate / corresponding with parallels).", ["thm:25"], ["ang3", "ang5"]),
      S("So exterior = 2 + 3 = 4 + 5.", ["cn:2"], ["ext", "ang2", "ang3"]),
      S("Thus 1 + 2 + 3 = 1 + 4 + 5 = two right angles (adjacent on straight line BCX).", ["thm:11", "cn:1"], ["ang1", "ang2", "ang3"]),
    ],
    {"type": "angle-sum", "params": {}},
    remarks=[
      "Surprising: wildly different triangles still have the same angle sum!",
      "Corollary: any two angles of a triangle sum to less than 180° (converse flavor of Postulate 5).",
      "In a right triangle the two acute angles are complementary; the hypotenuse is the longest side.",
    ],
    questions=[
      {"q": "What is the angle sum of any quadrilateral? Pentagon? Find a pattern for an n-gon.", "hint": "Divide into triangles from one vertex."},
      {"q": "Prove every angle of an equilateral triangle is 60°.", "hint": "Three equal angles sum to 180°."},
    ],
    aka="Triangular Angle-Sum Theorem"),

  thm(29, "Third angle equal", "theorem",
    "If two triangles have two angles equal to two angles, then the remaining angles are equal.",
    [
      S("In △ABC and △DEF let ∠1 = ∠4 and ∠2 = ∠5. Claim: ∠3 = ∠6.", None, ["triABC", "triDEF"]),
      S("1 + 2 + 3 = two rights and 4 + 5 + 6 = two rights.", ["thm:28"], ["ang1", "ang2", "ang3", "ang4", "ang5", "ang6"]),
      S("So 4 + 5 + 3 = two rights (substituting equals).", ["cn:1"], []),
      S("Therefore 4 + 5 + 3 = 4 + 5 + 6, so 3 = 6.", ["cn:3"], ["ang3", "ang6"]),
    ],
    {"type": "third-angle", "params": {}},
    remarks=[
      "Knowing two angles of a triangle determines the third. Sides do not work that way: many third sides can complete two given sides (within the triangle inequality).",
    ]),

  thm(30, "One pair parallel and equal ⇒ parallelogram", "theorem",
    "If one pair of opposite sides in a quadrilateral are both parallel and equal, then the quadrilateral is a parallelogram (the other pair is also parallel and equal).",
    [
      S("In ABCD let AB ∥ CD and AB = CD. Join diagonal AD (Augros uses AD forming two triangles).", ["post:1"], ["AB", "CD", "AD"]),
      S("Alternate angles from AB ∥ CD are equal.", ["thm:25"], ["ang1", "ang2"]),
      S("AB = CD (given) and AD common ⇒ △ABD ≅ △CDA by SAS (with care on included angles).", ["thm:2"], ["triABD", "triCDA"]),
      S("Corresponding angles imply AC ∥ BD? Wait — Augros concludes AC ∥ BD and AC = BD for the other pair of sides. Correct labeling: opposite sides AC? Standard: sides AD and BC become parallel and equal.", ["thm:23"], ["AD", "BC"]),
      S("Thus both pairs of opposite sides are parallel (and equal): ABCD is a parallelogram.", ["def:23"], ["paraABCD"]),
    ],
    {"type": "para-one-pair", "params": {}},
    remarks=[
      "Restated: if two segments are parallel and equal, the lines joining corresponding endpoints are parallel and equal.",
    ]),

  thm(31, "Properties of a parallelogram", "theorem",
    "In any parallelogram, opposite sides and opposite angles are equal, and a diagonal bisects the area of the parallelogram.",
    [
      S("In parallelogram ABCD, AB ∥ CD and AD ∥ BC. Draw diagonal AC.", ["def:23", "post:1"], ["paraABCD", "AC"]),
      S("Alternate angles: ∠BAC = ∠DCA and ∠BCA = ∠DAC.", ["thm:25"], ["angBAC", "angDCA", "angBCA", "angDAC"]),
      S("AC common; by ASA, △ABC ≅ △CDA.", ["thm:21"], ["triABC", "triCDA"]),
      S("Corresponding sides: AB = CD, AD = BC. Corresponding angles give opposite angles equal.", None, ["AB", "CD", "AD", "BC"]),
      S("The two triangles have equal area, so diagonal AC bisects the parallelogram.", None, ["triABC", "triCDA"]),
    ],
    {"type": "para-props", "params": {}},
    remarks=[
      "Partial converse of Thm. 30: both pairs parallel ⇒ both pairs equal.",
    ],
    questions=[
      {"q": "Prove that the diagonals of a parallelogram bisect each other.", "hint": "Congruent triangles from ASA or SAS with alternate angles."},
    ]),

  thm(32, "Parallelograms on the same base and in the same parallels", "theorem",
    "Parallelograms on the same base and in the same parallels have equal areas.",
    [
      S("Let parallelograms ABED and CBEF stand on base BE between parallels AF and BE.", None, ["para1", "para2", "baseBE"]),
      S("Opposite sides: AD = BE = CF, so AD = CF; adding CD gives AC = DF.", ["thm:31", "cn:2"], ["AD", "CF", "AC", "DF"]),
      S("Also AB = DE and BC = EF (opposite sides). By SSS, △ABC ≅ △DEF.", ["thm:6", "thm:31"], ["triABC", "triDEF"]),
      S("Equal triangles plus/minus common regions show area(ABED) = area(CBEF).", ["cn:2", "cn:3"], ["para1", "para2"]),
    ],
    {"type": "para-same-base", "params": {}},
    remarks=[
      "Equal area does not require the same shape — congruence is a stronger relation.",
      "A parallelogram may be slanted without limit and keep the same area on a fixed base between fixed parallels.",
    ]),

  thm(33, "Triangles on the same base and in the same parallels", "theorem",
    "Triangles on the same base and in the same parallels have equal areas; a triangle on the same base and in the same parallels as a parallelogram has half the parallelogram’s area.",
    [
      S("Triangles ABC and ABG stand on base AB in the same parallels.", None, ["triABC", "triABG"]),
      S("Complete parallelograms ABGK and ABLC on the same base in those parallels.", ["thm:27"], ["paraK", "paraL"]),
      S("Those parallelograms have equal area (Thm. 32).", ["thm:32"], ["paraK", "paraL"]),
      S("Each triangle is half its parallelogram (diagonal bisects — Thm. 31).", ["thm:31", "prin:halves"], ["triABC", "triABG"]),
      S("Halves of equals are equal: the triangles have equal area. Also a triangle is half the parallelogram on the same base in the same parallels.", ["prin:halves"], ["triABC", "paraK"]),
    ],
    {"type": "tri-same-base", "params": {}},
    remarks=[
      "This is why the area formulas A = bh (rectangle) and A = ½bh (triangle) work.",
      "“Base” can be any side; the matching height is the perpendicular to that base.",
    ],
    questions=[
      {"q": "Why is the area of a rectangle base × height?", "hint": "Count unit squares in a grid; height counts rows."},
    ]),

  thm(34, "Complements of parallelograms about a diagonal", "theorem",
    "In any parallelogram, the “complements” of the parallelograms about a diagonal are equal in area.",
    [
      S("In parallelogram ABCD draw diagonal AC. Through a point K on AC draw lines parallel to the sides, forming small parallelograms about the diagonal and two complementary parallelograms (1) and (2).", ["thm:27"], ["paraABCD", "AC", "comp1", "comp2"]),
      S("The diagonal bisects each small parallelogram it passes through.", ["thm:31"], ["AC"]),
      S("Adding equal half-parallelograms and comparing with the whole shows complement (1) = complement (2).", ["cn:2", "cn:3"], ["comp1", "comp2"]),
    ],
    {"type": "complements", "params": {}},
    remarks=[
      "A famous “surprise equality” of regions that need not look alike.",
    ]),

  thm(35, "How to make a square", "construction",
    "Given a straight line AB, construct a square having AB as one side.",
    [
      S("Erect AE perpendicular to AB and cut off AD = AB.", ["thm:9", "post:3"], ["AE", "AD", "AB"]),
      S("Through D draw a parallel to AB; through B draw a parallel to AD; let them meet at C.", ["thm:27"], ["DC", "BC", "C"]),
      S("ABCD is a parallelogram (both pairs parallel).", ["def:23"], ["paraABCD"]),
      S("Adjacent angles on the parallel with the perpendicular force all angles right (using Thm. 25 and opposite angles of a parallelogram).", ["thm:25", "thm:31", "def:9"], ["angA", "angB", "angC", "angD"]),
      S("Opposite sides equal and AD = AB ⇒ all four sides equal.", ["thm:31"], ["AB", "BC", "CD", "DA"]),
      S("Equilateral + right-angled ⇒ square.", ["def:23"], ["squareABCD"]),
    ],
    {"type": "square", "params": {}},
    remarks=[
      "We now have two regular polygons: equilateral triangle and square.",
      "A square is a special rectangle and a special rhombus and a special parallelogram.",
    ],
    end="Q.E.F."),

  thm(36, "The Pythagorean Theorem", "theorem",
    "In any right triangle, the square on the hypotenuse is equal to the sum of the two squares on the remaining sides.",
    [
      S("Right triangle ABC with right angle at A; squares ABFG on AB, ACKH on AC, BCED on hypotenuse BC.", ["def:21", "thm:35"], ["triABC", "sqAB", "sqAC", "sqBC"]),
      S("Drop AL perpendicular to DE (side of the hypotenuse square), forming rectangles BL and CL. Join AD and CF.", ["thm:10", "post:1"], ["AL", "AD", "CF"]),
      S("GAC is one straight line (two right angles adjacent).", ["thm:12"], ["GAC"]),
      S("Show △FBC ≅ △ABD by SAS (FB = AB, BC = BD, included angles equal as each is ∠ABC plus a right angle).", ["thm:2"], ["triFBC", "triABD"]),
      S("Double the equal triangles: 2△FBC = 2△ABD.", ["cn:2"], []),
      S("2△FBC equals square ABFG (triangle and square/parallelogram on same base in same parallels — Thm. 33).", ["thm:33"], ["sqAB", "triFBC"]),
      S("2△ABD equals rectangle BL (same reason).", ["thm:33"], ["rectBL", "triABD"]),
      S("Therefore square ABFG = rectangle BL. Similarly square ACKH = rectangle CL.", None, ["sqAB", "rectBL", "sqAC", "rectCL"]),
      S("Adding: both small squares = both rectangles = square BCED on the hypotenuse.", ["cn:2"], ["sqAB", "sqAC", "sqBC"]),
    ],
    {"type": "pythagoras", "params": {}},
    remarks=[
      "The most famous theorem in geometry — pure geometry, not algebra. Numerically: a² = b² + c².",
      "Legend: Pythagoras sacrificed an ox in thanksgiving.",
    ],
    questions=[
      {"q": "Legs 6 and 8; how long is the hypotenuse?", "hint": "6² + 8² = c²."},
      {"q": "Hypotenuse 15, one leg 12; find the other leg.", "hint": "15² − 12² = b²."},
    ],
    aka="Pythagorean Theorem"),

  thm(37, "Converse of Pythagoras", "theorem",
    "If the square on one side of a triangle equals the sum of the squares on the other two sides, then the angle opposite that side is a right angle.",
    [
      S("In △ABC suppose square on AB equals square on AC plus square on BC. Claim: ∠ACB is right.", None, ["triABC", "AB", "AC", "BC"]),
      S("From C draw CN ⊥ AC with NC = BC; join NA.", ["thm:9", "post:1"], ["CN", "N", "NA"]),
      S("By Pythagoras in right △ACN: square on AN = square on AC + square on NC.", ["thm:36"], ["sqAN", "sqAC", "sqNC"]),
      S("But NC = BC so square NC = square BC; thus square AN = square AC + square BC = square AB (given).", ["cn:1"], ["AB", "AN"]),
      S("So AB = AN. Also NC = BC and CA common ⇒ △ANC ≅ △ABC by SSS.", ["thm:6"], ["triANC", "triABC"]),
      S("Corresponding angles: ∠ACN = ∠ACB. But ∠ACN is right, so ∠ACB is right.", ["def:9"], ["angC"]),
    ],
    {"type": "pythagoras-converse", "params": {}},
    remarks=[
      "Only right triangles have the Pythagorean property.",
      "3-4-5 (and multiples) are right triangles — used in carpentry to lay out large right angles.",
    ],
    questions=[
      {"q": "Prove that a 3-4-5 triangle is right-angled with hypotenuse 5.", "hint": "3²+4²=9+16=25=5²; apply Thm. 37."},
    ]),
]

HOOKS = [
  {
    "id": "hook:desargues",
    "title": "Desargues’ Theorem (Hook)",
    "text": "If two triangles ABC and abc in the same plane are such that the three lines joining corresponding vertices (Aa, Bb, Cc) meet in a single point V, then the three intersection points of corresponding sides (X, Y, Z) lie on one straight line.",
    "kid": "A deep “perspective” surprise about two triangles aiming at one point.",
  },
  {
    "id": "hook:perp-sum",
    "title": "Sum of perpendiculars in an equilateral triangle (Hook)",
    "text": "In equilateral triangle ABC, for any interior point P, if PQ, PR, PS are the perpendiculars to the three sides, then PQ + PR + PS equals the altitude of the triangle.",
    "kid": "No matter where P is inside an equilateral triangle, the three little heights add up to the big height!",
  },
]

LIBRARY = {
  "definitions": DEFINITIONS,
  "postulates": POSTULATES,
  "commonNotions": COMMON_NOTIONS,
  "extra": EXTRA,
  "theorems": THEOREMS,
  "hooks": HOOKS,
}

OUT = Path(__file__).resolve().parent / "index.html"
# Continue in next part of build — write the HTML template with embedded JSON
print(f"Content objects: {len(DEFINITIONS)} defs, {len(POSTULATES)} posts, {len(COMMON_NOTIONS)} CNs, {len(THEOREMS)} thms")
print("build.py content prepared; writing HTML next via main...")
