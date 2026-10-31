# Geometria items without a link to the web Euclid

Links point to https://elements.ratherthanpaper.com. That site has one page per proposition (`/1.18`) and one page for each group of definitions (`/1.d`), postulates (`/1.p`) and common notions (`/1.c`), so a definition link opens its book's definitions page. The items below have no counterpart there, or a doubtful one, so they have no link. Mappings for definitions live in `src/content/correspondence/bookNN.json` under "definitions"; theorems are linked only when their pair is marked "exact".

After the Augros re-sort (October 2026): of the 57 items below, 5 now carry an exact link to the web Euclid, 14 carry a link labelled "Related: Euclid" that points to the nearest place in Euclid without claiming the same statement, and 38 have no counterpart in Euclid. Exact links are listed under "links" and related links under "related" in `src/content/correspondence/bookNN.json`. Each item that now has a link is marked below.

## Chapter 1

- Definition 1 (def:1), Solid. Solid: Euclid defines a solid only in Book XI (Def. XI.1), outside the books this course covers. **Now linked: Elements Def. XI.1.**
- Definition 12 (def:12), Supplementary and complementary. Supplementary and complementary angles: not defined by Euclid.
- Definition 24 (def:24), Inclined toward each other. Inclined toward each other: not a Euclid definition (the idea is used in Postulate 5). **Related link: Euclid Post. I.5.**
- Principle (prin:two-lines), Two straight lines cannot enclose a space. Further principle: not one of Euclid's postulates or common notions.
- Principle (prin:halves), Halves of equals are equal. Further principle: not one of Euclid's postulates or common notions.
- Theorem 18 (thm:18), Shortest path to a line is the perpendicular. no Euclid proposition: Shortest path to a line is the perpendicular; taught in the course; not a numbered Book I proposition.
- Theorem 21 (thm:21), Angle-Side-Angle (ASA). variant match with Elements 1.26: Euclid I.26 proves ASA and AAS together; Augros splits them as Theorems 21 and 22. **Related link: Euclid I.26.**
- Theorem 22 (thm:22), Angle-Angle-Side (AAS). variant match with Elements 1.26: AAS half of Euclid I.26. **Related link: Euclid I.26.**
- Theorem 24 (thm:24), Co-interior angles supplementary ⇒ parallel. variant match with Elements 1.28: Augros proves the co-interior case; Euclid I.28 also states corresponding angles. **Related link: Euclid I.28.**
- Theorem 29 (thm:29), Third angle equal. variant match with Elements 1.32: Third-angle equality is a corollary of I.32; Augros gives it its own theorem.
- Theorem 33 (thm:33), Triangles on the same base and in the same parallels. composite match with Elements 1.37: Augros also uses the half-parallelogram comparison (Euclid I.41). **Related link: Euclid I.37.**

## Chapter 2

- Definition 2 (ch2:def:2), Naming a rectangle by its sides. Naming a rectangle by its sides: a convention, not a Euclid definition.
- Definition 3 (ch2:def:3), Identical rectangles. Identical rectangles: not a Euclid definition.
- Principle (ch2:hook:marion), Marion’s theorem. Further principle: not one of Euclid's postulates or common notions.
- Theorem 2 (ch2:thm:2), Squares and complements on a diagonal. no Euclid proposition: Gnomon in a square; Augros teaching figure. Euclid’s gnomon is II.Def.2, used in II.4 to 8.
- Theorem 4 (ch2:thm:4), The difference of two squares. variant match with Elements 2.5: Augros states a² − b² = (a+b)(a−b). Euclid II.5 is that identity on a line cut equally and unequally. **Related link: Euclid II.5.**
- Theorem 5 (ch2:thm:5), How to add two rectangles. no Euclid proposition: How to add two rectangles; uses the complements of I.43.
- Theorem 6 (ch2:thm:6), A perpendicular to a diameter. no Euclid proposition: Geometric mean: the square on a perpendicular to a diameter equals the rectangle of the segments. Used to square a rectangle in II.14.
- Theorem 8 (ch2:thm:8), The isosceles triangle has the least fence. no Euclid proposition: Isoperimetric: isosceles triangle has least perimeter on a given base and height.
- Theorem 9 (ch2:thm:9), How to make an equilateral quadrilateral of the same area. no Euclid proposition: Make an equilateral quadrilateral equal to a given one.
- Theorem 10 (ch2:thm:10), A square fences less than a rhombus of the same area. no Euclid proposition: A square of equal area has less perimeter than a rhombus.
- Theorem 11 (ch2:thm:11), The square has the least fence of all quadrilaterals. no Euclid proposition: A square has the least perimeter of all equal-area quadrilaterals.

## Chapter 3

- Definition 2 (ch3:def:2), Chord. Chord: not defined by Euclid.
- Definition 3 (ch3:def:3), Arc. Arc: not defined by Euclid.
- Definition 4 (ch3:def:4), Concave and convex sides of an arc. Concave and convex sides of an arc: not defined by Euclid.
- Definition 12 (ch3:def:12), Regular polygon. Regular polygon: not a numbered Euclid definition.
- Principle (ch3:hook:miquel), The Miquel point. Further principle: not one of Euclid's postulates or common notions.
- Principle (ch3:hook:centroid), Center of weight of a triangle. Further principle: not one of Euclid's postulates or common notions.
- Principle (ch3:hook:cotangents), Cotangents to three circles. Further principle: not one of Euclid's postulates or common notions.
- Theorem 3 (ch3:thm:3), A bisecting radius is perpendicular to the chord. variant match with Elements 3.3: Augros splits Euclid III.3: Theorem 3 is bisector ⇒ perpendicular; Theorem 4 is the converse. **Related link: Euclid III.3.**
- Theorem 4 (ch3:thm:4), A perpendicular radius bisects the chord. variant match with Elements 3.3 **Related link: Euclid III.3.**
- Theorem 8 (ch3:thm:8), Three equal lines from an interior point. variant match with Elements 3.9 **Now linked: Elements III.9.**
- Theorem 10 (ch3:thm:10), Two common points means the circles cut. variant match with Elements 3.13: Augros: two common points means the circles cut, not touch. Euclid III.13: circles touch at no more than one point. **Related link: Euclid III.13.**
- Theorem 16 (ch3:thm:16), A line at less than a right angle cuts the circle. variant match with Elements 3.16: Augros’s converse-porism: a line at less than a right angle to the radius cuts the circle. **Related link: Euclid III.16.**

## Chapter 4

- Principle (ch4:hook:345), The 3-4-5 triangle and the circle. Further principle: not one of Euclid's postulates or common notions.
- Principle (ch4:hook:brianchon), Brianchon’s theorem. Further principle: not one of Euclid's postulates or common notions.
- Principle (ch4:hook:chords), Chord products of regular polygons. Further principle: not one of Euclid's postulates or common notions.
- Theorem 9 (ch4:thm:9), How to inscribe a regular decagon. no Euclid proposition: Regular decagon in a circle; used in Euclid’s pentagon (IV.10 to 11) but not a numbered Book IV proposition.

## Chapter 5

- Definition 1 (ch5:def:1), To measure. To measure: Euclid V.Def.1 defines "part" by measuring; the definitions differ, so the numbering is doubtful. **Related link: Euclid Def. V.1, 2.**
- Definition 3 (ch5:def:3), Equimultiples. Equimultiples: used but not defined as such by Euclid.
- Definition 5 (ch5:def:5), Antecedent and consequent. Antecedent and consequent: not Euclid definitions (closest is V.Def.11, corresponding magnitudes); doubtful.
- Definition 6 (ch5:def:6), Corresponding multiples. Corresponding multiples: no single Euclid definition; doubtful.
- Definition 7 (ch5:def:7), Compare the same way. Compare the same way: part of V.Def.5 in Euclid, not a definition of its own; doubtful.
- Definition 11 (ch5:def:11), Not greater, not less. Not greater, not less: not a Euclid definition. **Related link: Euclid Def. V.7.**
- Principle (ch5:hook:means), Three means. Further principle: not one of Euclid's postulates or common notions.
- Theorem 2 (ch5:thm:2), Invertendo. no Euclid proposition: Invertendo: if A:B = C:D then B:A = D:C. Euclid lists inverse ratio as V.Def.13; it is not a numbered proposition. **Now linked: Elements V.7.**
- Theorem 4 (ch5:thm:4), A ratio is not both greater and less. no Euclid proposition: A ratio cannot be both greater and less than another; trichotomy, used throughout Book V.
- Theorem 5 (ch5:thm:5), Equal corresponding multiples give a proportion. variant match with Elements 5.4: If some equimultiples of the terms are equal in pairs, the four quantities are proportional. Close to the converse of V.4.
- Theorem 7 (ch5:thm:7), How to find witnessing equimultiples. no Euclid proposition: Construction of equimultiples that witness A > B against a third magnitude C; the engine of V.8.
- Theorem 9 (ch5:thm:9), A greater to a lesser makes a greater ratio. variant match with Elements 5.8: A:B > C:D when C < A and D > B. **Related link: Euclid V.8.**

## Chapter 6

- Definition 2 (ch6:def:2), The similarity sign. The similarity sign: a notation, not a Euclid definition.
- Definition 3 (ch6:def:3), Continuously proportional. Continuously proportional: no matching numbered definition in Book VI; doubtful (compare V.Def.8 to 10).
- Definition 4 (ch6:def:4), Duplicate a ratio. Duplicate a ratio: Euclid V.Def.9 defines duplicate ratio, but this course defines the construction; doubtful. **Now linked: Elements Def. V.9, 10.**
- Definition 5 (ch6:def:5), Reciprocally proportional sides. Reciprocally proportional sides: an interpolated definition that the Heiberg text (used by the web Euclid) does not number.
- Principle (ch6:hook:ceva), Ceva’s theorem. Further principle: not one of Euclid's postulates or common notions.
- Theorem 13 (ch6:thm:13), Intersecting chords. no Euclid proposition: Intersecting chords: the rectangles of the segments are equal. Euclid III.35, proved here by similar triangles. **Now linked: Elements III.35.**
- Theorem 15 (ch6:thm:15), Squares in the duplicate ratio of their sides. variant match with Elements 6.19: Squares are in the duplicate ratio of their sides; the square case of VI.19. **Related link: Euclid VI.20.**
