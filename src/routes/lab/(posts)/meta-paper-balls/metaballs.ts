export type Vec2 = { x: number; y: number };

export const vadd   = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const vsub   = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const vmul   = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const vnorm  = (a: Vec2): Vec2 => { const l = Math.hypot(a.x, a.y); return l ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 }; };
export const vpolar = (angle: number, r: number): Vec2 => ({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });

export class Drop {
    pos: Vec2;
    vel: Vec2 = { x: 0, y: 0 };
    acc: Vec2 = { x: 0, y: 0 };
    rad: number;
    handleScaleFactor = 0.13;
    handle_len_rate: number;
    attraction = 0.06;
    friction = -0.02;
    age = 0;
    fixed = true;

    constructor(pos: Vec2, rad: number) {
        this.pos = { ...pos };
        this.rad = rad;
        this.handle_len_rate = rad * this.handleScaleFactor;
    }

    setSize(newSize: number) {
        const scale = newSize / (this.rad * 2);
        this.rad *= scale;
        this.handle_len_rate = this.rad * this.handleScaleFactor;
        return this;
    }

    grow(rate: number) {
        return this.setSize(this.rad * 2 * rate);
    }

    animateIn(targetRad: number) {
        this.acc = { x: 0, y: 0 };
        if (this.rad < targetRad) {
            this.grow(1.1);
        } else {
            this.fixed = false;
        }
    }

    place(vec: Vec2) {
        this.pos.x = vec.x;
        this.pos.y = vec.y;
    }

    follow(vec: Vec2) {
        const delta    = vmul(vnorm(vsub(vec, this.pos)), this.attraction);
        const friction = vmul(vnorm(this.vel), this.friction);
        this.acc = vadd(delta, friction);
        return this;
    }

    teleport(w: number, h: number) {
        this.pos = { x: Math.random() * w, y: Math.random() * h };
        this.vel = { x: 0, y: 0 };
        this.age = 0;
        this.setSize(1);
        this.fixed = true;
    }

    update(randomSize: () => number) {
        if (this.fixed) this.animateIn(randomSize());
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.age++;
    }
}

export type MetaballCurve = {
    p1a: Vec2; p2a: Vec2; p2b: Vec2; p1b: Vec2;
    c1out: Vec2; c2ain: Vec2; c2out: Vec2; c1bin: Vec2;
};

export function metaball(b1: Drop, b2: Drop, v: number, maxDistance: number): MetaballCurve | null {
    const r1 = b1.rad, r2 = b2.rad;
    if (r1 === 0 || r2 === 0) return null;

    const dx = b2.pos.x - b1.pos.x;
    const dy = b2.pos.y - b1.pos.y;
    const d = Math.hypot(dx, dy);
    if (d > maxDistance || d <= Math.abs(r1 - r2)) return null;

    const pi2 = Math.PI / 2;
    let u1 = 0, u2 = 0;
    if (d < r1 + r2) {
        u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
        u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
    }

    const a1  = Math.atan2(dy, dx);
    const a2  = Math.acos((r1 - r2) / d);
    const a1a = a1 + u1 + (a2 - u1) * v;
    const a1b = a1 - u1 - (a2 - u1) * v;
    const a2a = a1 + Math.PI - u2 - (Math.PI - u2 - a2) * v;
    const a2b = a1 - Math.PI + u2 + (Math.PI - u2 - a2) * v;

    const p1a = vadd(b1.pos, vpolar(a1a, r1));
    const p1b = vadd(b1.pos, vpolar(a1b, r1));
    const p2a = vadd(b2.pos, vpolar(a2a, r2));
    const p2b = vadd(b2.pos, vpolar(a2b, r2));

    const totalR = r1 + r2;
    let d2 = Math.min(v * b2.handle_len_rate, Math.hypot(p1a.x - p2a.x, p1a.y - p2a.y) / totalR);
    d2 *= Math.min(1, d * 2 / totalR);
    const h1 = r1 * d2, h2 = r2 * d2;

    return {
        p1a, p2a, p2b, p1b,
        c1out: vadd(p1a, vpolar(a1a - pi2, h1)),
        c2ain: vadd(p2a, vpolar(a2a + pi2, h2)),
        c2out: vadd(p2b, vpolar(a2b - pi2, h2)),
        c1bin: vadd(p1b, vpolar(a1b + pi2, h1)),
    };
}
