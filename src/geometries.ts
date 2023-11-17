import { Flatten, Vec3 } from './models';

export function rect2D(w: number, h: number) {
    return Flatten([
        [0, 0],
        [w, 0],
        [w, h],
        [0, 0],
        [w, h],
        [0, h],
    ]);
}

export function tex2D(w: number, h: number) {
    // prettier-ignore
    return [
        0, 0, 
        w, 0, 
        w, h, 
        0, 0, 
        w, h, 
        0, h
    ];
}

export function cuboid(w: number, d: number, h: number) {
    return [
        w,
        d,
        0,
        0,
        d,
        0,
        0,
        d,
        h,
        w,
        d,
        0,
        0,
        d,
        h,
        w,
        d,
        h,
        w,
        0,
        h,
        w,
        d,
        h,
        0,
        d,
        h,
        w,
        0,
        h,
        0,
        d,
        h,
        0,
        0,
        h,
        0,
        0,
        h,
        0,
        d,
        h,
        0,
        d,
        0,
        0,
        0,
        h,
        0,
        d,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        w,
        0,
        0,
        w,
        0,
        h,
        0,
        0,
        0,
        w,
        0,
        h,
        0,
        0,
        h,
        w,
        0,
        0,
        w,
        d,
        0,
        w,
        d,
        h,
        w,
        0,
        0,
        w,
        d,
        h,
        w,
        0,
        h,
        0,
        0,
        0,
        0,
        d,
        0,
        w,
        d,
        0,
        0,
        0,
        0,
        w,
        d,
        0,
        w,
        0,
        0,
    ];
}

export function cuboidNormals() {
    return [
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        0, -1, 0, 0, -1, 0, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        0, -1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    ];
}

export function cylinder(sides: number, length: number, dia: number) {
    const result = [];
    const vertices = [];
    const inc = (Math.PI * 2.0) / sides;

    for (let i = 0, angle = 0; i < sides; i++, angle += inc) {
        const x = (dia / 2) * Math.cos(angle);
        const z = (dia / 2) * Math.sin(angle);

        vertices[i] = Vec3(x, z, 0);
        vertices[i + sides] = Vec3(x, z, length);
    }

    for (let i = 0; i < sides - 1; i++) {
        const a = i + 1,
            b = i,
            c = sides + i,
            d = sides + i + 1;

        result.push(vertices[a]);
        result.push(vertices[b]);
        result.push(vertices[c]);
        result.push(vertices[a]);
        result.push(vertices[c]);
        result.push(vertices[d]);
    }

    result.push(vertices[0]);
    result.push(vertices[sides - 1]);
    result.push(vertices[2 * sides - 1]);
    result.push(vertices[0]);
    result.push(vertices[2 * sides - 1]);
    result.push(vertices[sides]);

    return Flatten(result);
}
