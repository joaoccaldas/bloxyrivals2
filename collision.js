// collision.js

/**
 * Check whether two AABBs intersect.
 * @param {{left:number, top:number, right:number, bottom:number}} a
 * @param {{left:number, top:number, right:number, bottom:number}} b
 * @returns {boolean} true if the rectangles overlap
 */
export function checkCollision(a, b) {
  return (
    a.left   < b.right &&
    a.right  > b.left  &&
    a.top    < b.bottom &&
    a.bottom > b.top
  );
}
