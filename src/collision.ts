import type { Vec2D } from './models';

export type Cuboid = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
};

export type Sphere = {
    x: number;
    y: number;
    z: number;
    radius: number;
};

function getAABB(rect: Cuboid) {
    const result = {
        min: [rect.x, rect.y, rect.z],
        max: [rect.x + rect.w, rect.y + rect.h, rect.z + rect.d],
    };

    // Swap the vertices if the min/max is reversed
    // because of orientation or whatever.
    for (let i = 0; i < 3; i++) {
        if (result.max[i] < result.min[i]) {
            // Swap
            const a = result.min[i];
            result.min[i] = result.max[i];
            result.max[i] = a;
        }
    }

    return result;
}

function squaredDistPointAABB(sphere: Sphere, rect: Cuboid) {
    let sqDist = 0;
    const p = [sphere.x, sphere.y, sphere.z];
    const b = getAABB(rect);

    for (let i = 0; i < 3; i++) {
        // for each axis count any excess distance outside box extents
        let v = p[i];
        if (v < b.min[i]) sqDist += (b.min[i] - v) * (b.min[i] - v);
        if (v > b.max[i]) sqDist += (v - b.max[i]) * (v - b.max[i]);
    }
    return sqDist;
}

export function getIntersectionPoints(sphere: Sphere, rect: Cuboid) {
    const r = [0, 0, 0];
    const p = [sphere.x, sphere.y, sphere.z];
    const b = getAABB(rect);

    for (let i = 0; i < 3; i++) {
        // for each axis count any excess distance outside box extents
        let v = p[i];
        if (v < b.min[i]) r[i] = b.min[i] - v;
        if (v > b.max[i]) r[i] = v - b.max[i];
    }
    return r;
}

//Given point p, return the point q on or in AABB b that is closest to p
export function closestPointAABB(sphere: Sphere, rect: Cuboid) {
    const result = [0, 0, 0];
    const p = [sphere.x, sphere.y, sphere.z];
    const b = getAABB(rect);
    // For each coordinate axis, if the point coordinate value is
    // outside box, clamp it to the box, else keep it as is
    for (let i = 0; i < 3; i++) {
        const v = p[i];
        result[i] = v;
        if (v < b.min[i]) result[i] = b.min[i];
        if (v > b.max[i]) result[i] = b.max[i];
    }
    return result;
}

export function sphereRectCollision(
    sphere: Sphere,
    rect: Cuboid
): [boolean, number] {
    // Compute squared distance between sphere center and AABB
    // the sqrt(dist) is fine to use as well, but this is faster.
    let sqDist = squaredDistPointAABB(sphere, rect);

    // Sphere and AABB intersect if the (squared) distance between them is
    // less than the (squared) sphere radius.
    return [sqDist <= sphere.radius * sphere.radius, sqDist];
}

// a1 is line1 start, a2 is line1 end, b1 is line2 start, b2 is line2 end
export function lineBoxIntersects(a1: Vec2D, a2: Vec2D, b1: Vec2D, b2: Vec2D) {
    const b = [a2[0] - a1[0], a2[1] - a1[1]];
    const d = [b2[0] - b1[0], b2[1] - b1[1]];
    const bDotDPerp = b[0] * d[1] - b[1] * d[0];

    // if b dot d == 0, it means the lines are parallel so have infinite intersection points
    if (bDotDPerp == 0) {
        return false;
    }

    const c = [b1[0] - a1[0], b1[1] - a1[1]];
    const t = (c[0] * d[1] - c[1] * d[0]) / bDotDPerp;

    if (t < 0 || t > 1) {
        return false;
    }

    const u = (c[0] * b[1] - c[1] * b[0]) / bDotDPerp;
    if (u < 0 || u > 1) {
        return false;
    }

    return true;
}
