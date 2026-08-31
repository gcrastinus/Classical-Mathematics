/* ============================================================
   figkeys.js — for each figure, the parts that carry the point
   of the theorem.  Recitation can throw these into relief.
   Anything not listed here simply has no emphasis: not every
   figure has one part that matters more than the rest.
   ============================================================ */
(function (root) {
'use strict';
root.FIGKEY = {
  /* constructions: what was made */
  'thm:1':  { ids: ['poly:ABC'], say: 'the equilateral triangle' },
  'thm:1a': { ids: ['seg:AL', 'seg:BC'], say: 'the given line BC and the equal line AL placed at A' },
  'thm:1b': { ids: ['seg:AE', 'seg:C'], say: 'the given line C and the piece AE cut off equal to it' },
  'thm:2':  { ids: ['poly:ABC', 'poly:DEF'], say: 'the two triangles brought into coincidence' },
  'thm:3':  { ids: ['ang:ABC', 'ang:BCA'], say: 'the two base angles' },
  'thm:4':  { ids: ['ang:ABC', 'ang:BCA', 'seg:AB', 'seg:AC'], say: 'the two equal angles and the sides opposite them' },
  'thm:5':  { ids: ['seg:AM', 'seg:AN', 'seg:BM', 'seg:BN'], say: 'the two pairs of sides that were supposed equal' },
  'thm:6':  { ids: ['poly:ACD'], say: 'the triangle the two must coincide in' },
  'thm:7':  { ids: ['seg:BF', 'ang:DBF', 'ang:FBE'], say: 'the bisector and the two equal halves of the angle' },
  'thm:8':  { ids: ['seg:CC2', 'pt:D'], say: 'the line joining the two crossings, and the midpoint it cuts off' },
  'thm:9':  { ids: ['seg:PR', 'sq1', 'sq2'], say: 'the perpendicular and the two right angles' },
  'thm:10': { ids: ['seg:PH', 'sq1', 'sq2'], say: 'the perpendicular and the two right angles' },
  'thm:11': { ids: ['ang:1', 'ang:2', 'ang:3'], say: 'the adjacent angles that make two right angles' },
  'thm:12': { ids: ['ang:1', 'ang:2', 'ang:3'], say: 'the angles at P' },
  'thm:13': { ids: ['ang:1', 'ang:3'], say: 'a pair of vertical angles' },
  'thm:14': { ids: ['ang:ACD', 'ang:BAC'], say: 'the exterior angle and the remote interior angle' },
  'thm:15': { ids: ['seg:AC', 'ang:ABC'], say: 'the greater side and the greater angle opposite it' },
  'thm:16': { ids: ['ang:ABC', 'seg:AC'], say: 'the greater angle and the greater side opposite it' },
  'thm:17': { ids: ['seg:AB', 'seg:AC', 'seg:BC'], say: 'the three sides being compared' },
  'thm:18': { ids: ['seg:PL', 'ang:PLR'], say: 'the perpendicular — the shortest line to AB' },
  'thm:19': { ids: ['poly:ABC'], say: 'the triangle built from the three given lines' },
  'thm:20': { ids: ['ang:AXB', 'ang:ZPT'], say: 'the given angle and its copy' },
  'thm:21': { ids: ['poly:ABC', 'poly:DEF'], say: 'the two triangles' },
  'thm:22': { ids: ['poly:ABC', 'poly:DEF'], say: 'the two triangles' },
  'thm:23': { ids: ['ang:AEF', 'ang:EFD'], say: 'the equal alternate angles' },
  'thm:24': { ids: ['ang:FEB', 'ang:EFD'], say: 'the two interior angles on the same side' },
  'thm:25': { ids: ['ang:AGH', 'ang:GHD'], say: 'the alternate angles the parallels make equal' },
  'thm:26': { ids: ['ang:1', 'ang:4'], say: 'the angles that show the outer two lines are parallel' },
  'thm:27': { ids: ['seg:PL', 'ang:LPX', 'ang:PXB'], say: 'the parallel drawn through P, and the equal alternate angles' },
  'thm:28': { ids: ['ang:BCA', 'ang:BAC', 'ang:ABC'], say: 'the three angles of the triangle' },
  'thm:29': { ids: ['ang:3', 'ang:6'], say: 'the two remaining angles' },
  'thm:30': { ids: ['poly:ABCD'], say: 'the parallelogram' },
  'thm:31': { ids: ['poly:ABC', 'poly:CDA'], say: 'the two halves the diagonal makes' },
  'thm:32': { ids: ['poly:ABED', 'poly:CBEF'], say: 'the two parallelograms of equal area' },
  'thm:33': { ids: ['poly:ABC', 'poly:ABG'], say: 'the two triangles of equal area' },
  'thm:34': { ids: ['poly:RBQK', 'poly:PKSD'], say: 'the two complements' },
  'thm:35': { ids: ['poly:ABCD', 'sq:A', 'sq:B', 'sq:C', 'sq:D'], say: 'the square, and its four right angles' },
  'thm:36': { ids: ['poly:BCED', 'poly:ABFG', 'poly:ACKH', 'sq:A'], say: 'the three squares and the right angle' },
  'thm:37': { ids: ['sq:A', 'sq:D'], say: 'the right angle proved, and the right angle built' },
  'b1:prop:17': { ids: ['ang:ABC', 'ang:ACB', 'ang:ACD'], say: 'two interior angles, and the exterior that is greater' },
  'b1:prop:21': { ids: ['seg:BD', 'seg:DC', 'ang:BDC', 'ang:BAC'], say: 'the inner lines and the greater angle they enclose' },
  'b1:prop:24': { ids: ['poly:ABC', 'poly:DEF', 'seg:BC', 'seg:EF'], say: 'the two triangles, and the bases being compared' },
  'b1:prop:25': { ids: ['poly:ABC', 'poly:DEF', 'ang:BAC', 'ang:EDF'], say: 'the two triangles, and the included angles' },
  'b1:prop:36': { ids: ['poly:ABCD', 'poly:EFGH'], say: 'the two parallelograms of equal area' },
  'b1:prop:38': { ids: ['poly:ABC', 'poly:DEF'], say: 'the two triangles of equal area' },
  'b1:prop:39': { ids: ['poly:ABC', 'poly:DBC', 'seg:AD'], say: 'the equal triangles and the parallel joining their vertices' },
  'b1:prop:40': { ids: ['poly:ABC', 'poly:CDE', 'seg:AD'], say: 'the equal triangles on equal bases, and the parallel AD' },
  'b1:prop:41': { ids: ['poly:ABCD', 'poly:EBC'], say: 'the parallelogram and the triangle of half the area' },
  'b1:prop:42': { ids: ['poly:ABC', 'poly:FECG', 'ang:D'], say: 'the given triangle, the parallelogram equal to it, and the given angle' },
  'b1:prop:44': { ids: ['seg:AB', 'poly:ABGH', 'poly:C', 'ang:D'], say: 'the given line, the applied parallelogram, the given triangle and angle' },
  'b1:prop:45': { ids: ['poly:ABCD', 'ang:E'], say: 'the given figure and the given angle' },
  /* a few definitions worth throwing into relief */
  'def:9':  { ids: ['ang:CBA', 'ang:ABD'], say: 'the two equal adjacent angles' },
  'def:17': { ids: ['seg:CD', 'seg:AC', 'seg:CB'], say: 'the radius and the diameter' },
  'def:20': { ids: ['poly:ABC'], say: 'the equilateral triangle' }
};
})(typeof window !== 'undefined' ? window : globalThis);
