// Searches integer bases for the P1 pentagon.
//
// A basis is three vectors v0 = (p,0), v1 = (q,r), v2 = (s,t). The pentagon is
// built from them by mirror reflection, exactly as the program builds every
// wheel from three seeds:
//
//     edges = (q,r), (-s,t), (-p,0), (-s,-t), (q,-r)
//
// The y components cancel for free; the x components force
//
//     p = 2(q - s)
//
// which is the exact closure condition. Anything satisfying it closes on the
// integer lattice; anything else is not a pentagon at all.
//
// Score: how far the resulting pentagon is from regular. Write the five
// vertices as complex numbers, centre them, and take the discrete Fourier
// transform. A regular pentagon traversed in order is exactly the m=1 mode, so
//
//     error = sqrt(sum of |a_m|^2 for m != 1) / |a_1|
//
// is a scale-, rotation- and translation-invariant measure of irregularity.
// Zero means perfectly regular, which no integer basis can reach.

const TAU = Math.PI * 2;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

function pentagon(p, q, r, s, t) {
    const edges = [[q, r], [-s, t], [-p, 0], [-s, -t], [q, -r]];
    const V = [[0, 0]];
    for (let i = 0; i < 4; i++) V.push([V[i][0] + edges[i][0], V[i][1] + edges[i][1]]);
    return V;
}

function convex(V) {
    let sign = 0;
    for (let i = 0; i < 5; i++) {
        const a = V[i], b = V[(i + 1) % 5], c = V[(i + 2) % 5];
        const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        if (cr === 0) return false;
        const sg = Math.sign(cr);
        if (sign === 0) sign = sg;
        else if (sg !== sign) return false;
    }
    return true;
}

function irregularity(V) {
    const cx = V.reduce((a, v) => a + v[0], 0) / 5;
    const cy = V.reduce((a, v) => a + v[1], 0) / 5;
    const z = V.map((v) => [v[0] - cx, v[1] - cy]);
    const A = [];
    for (let m = 0; m < 5; m++) {
        let re = 0, im = 0;
        for (let k = 0; k < 5; k++) {
            const th = -TAU * m * k / 5, c = Math.cos(th), sn = Math.sin(th);
            re += z[k][0] * c - z[k][1] * sn;
            im += z[k][0] * sn + z[k][1] * c;
        }
        A.push(Math.hypot(re, im) / 5);
    }
    const main = Math.max(A[1], A[4]);          // either orientation
    const rest = A.reduce((acc, v, m) =>
        acc + ((A[1] >= A[4] ? m === 1 : m === 4) ? 0 : v * v), 0);
    return main > 0 ? Math.sqrt(rest) / main : Infinity;
}

const BOUND = Number(process.argv[2] || 60);

// Keep only the best basis at each size. Storing every candidate exhausts memory
// past a bound of about 50, and nothing but the per-size best can ever be a
// record anyway.
const bestAt = new Array(BOUND + 1).fill(null);
let count = 0;
for (let q = 1; q <= BOUND; q++)
for (let s = 0; s < q; s++) {
    const p = 2 * (q - s);
    if (p > BOUND || p === 0) continue;
    for (let r = 1; r <= BOUND; r++)
    for (let t = 1; t <= BOUND; t++) {
        const g = [p, q, r, s, t].reduce((a, b) => gcd(a, b));
        if (g > 1) continue;
        const V = pentagon(p, q, r, s, t);
        if (!convex(V)) continue;
        count++;
        const err = irregularity(V);
        const size = Math.max(p, q, r, s, t);
        if (!bestAt[size] || err < bestAt[size].err) bestAt[size] = { p, q, r, s, t, err, size };
    }
}

const PHI = (1 + Math.sqrt(5)) / 2;
const F = [0, 1]; for (let i = 2; i < 40; i++) F[i] = F[i - 1] + F[i - 2];
const L = [2, 1]; for (let i = 2; i < 40; i++) L[i] = L[i - 1] + L[i - 2];
const inFamily = (x) => {
    for (let n = 2; n < 30; n++)
        if (x.p === 2 * L[n - 1] && x.q === L[n] && x.r === F[n + 1] &&
            x.s === L[n - 2] && x.t === F[n + 2]) return `family n=${n}`;
    return "";
};

console.log(`bound ${BOUND}: ${count} closing convex bases\n`);
console.log("RECORD HOLDERS -- each strictly better than every smaller basis");
console.log("size   v0        v1         v2          irregularity   gain");
let best = Infinity, prev = null;
for (let size = 1; size <= BOUND; size++) {
    const x = bestAt[size];
    if (!x || x.err >= best - 1e-12) continue;
    best = x.err;
    const gain = prev ? prev / x.err : 0;
    const mosaic = (x.p===4&&x.q===3&&x.r===2&&x.s===1&&x.t===4) ? "  <== mosaic" : "";
    console.log(
        `${String(x.size).padStart(4)}   (${x.p},0)`.padEnd(19) +
        `(${x.q},${x.r})`.padEnd(11) + `(${x.s},${x.t})`.padEnd(12) +
        x.err.toExponential(4).padStart(12) +
        (gain ? gain.toFixed(3) : "  -  ").padStart(8) +
        "   " + inFamily(x) + mosaic);
    prev = x.err;
}
console.log(`\nLucas/Fibonacci family plateaus at 2.0245e-3 -- it gets q/p and s/p exactly`);
console.log(`right (phi/2 and 1/(2phi), both in Q(sqrt5)) but r/p and t/p wrong,`);
console.log(`because sin36 and sin72 are degree 4 over Q and no Fibonacci ratio reaches them.`);
