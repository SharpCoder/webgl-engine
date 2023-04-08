import { Flatten, Vec3 } from './models';

export function cuboid(w: number, h: number, d: number) {
    return Flatten([
        // Front
        Vec3(0, 0, 0),
        Vec3(0, 0, d),
        Vec3(0, h, d),
        Vec3(0, h, 0),
        Vec3(0, 0, 0),
        Vec3(0, h, d),

        // Left
        Vec3(w, 0, 0),
        Vec3(0, 0, 0),
        Vec3(w, h, 0),
        Vec3(w, h, 0),
        Vec3(0, 0, 0),
        Vec3(0, h, 0),

        // Back
        Vec3(w, 0, 0),
        Vec3(w, h, 0),
        Vec3(w, h, d),
        Vec3(w, 0, d),
        Vec3(w, 0, 0),
        Vec3(w, h, d),

        // Right
        Vec3(w, h, d),
        Vec3(0, 0, d),
        Vec3(w, 0, d),
        Vec3(w, h, d),
        Vec3(0, h, d),
        Vec3(0, 0, d),

        // Top
        Vec3(w, h, d),
        Vec3(0, h, 0),
        Vec3(0, h, d),
        Vec3(w, h, d),
        Vec3(w, h, 0),
        Vec3(0, h, 0),

        // Bottom
        Vec3(0, 0, 0),
        Vec3(w, 0, d),
        Vec3(0, 0, d),
        Vec3(w, 0, d),
        Vec3(0, 0, 0),
        Vec3(w, 0, 0),
    ]);
}

export function cuboidNormals() {
    return Flatten([
        // Front
        Vec3(0, 0, 1),
        Vec3(0, 0, 1),
        Vec3(0, 0, 1),
        Vec3(0, 0, 1),
        Vec3(0, 0, 1),
        Vec3(0, 0, 1),

        // Left
        Vec3(-1, 0, 0),
        Vec3(-1, 0, 0),
        Vec3(-1, 0, 0),
        Vec3(-1, 0, 0),
        Vec3(-1, 0, 0),
        Vec3(-1, 0, 0),

        // Back
        Vec3(0, 0, -1),
        Vec3(0, 0, -1),
        Vec3(0, 0, -1),
        Vec3(0, 0, -1),
        Vec3(0, 0, -1),
        Vec3(0, 0, -1),

        // Right
        Vec3(1, 0, 0),
        Vec3(1, 0, 0),
        Vec3(1, 0, 0),
        Vec3(1, 0, 0),
        Vec3(1, 0, 0),
        Vec3(1, 0, 0),

        // Top
        Vec3(0, 1, 0),
        Vec3(0, 1, 0),
        Vec3(0, 1, 0),
        Vec3(0, 1, 0),
        Vec3(0, 1, 0),
        Vec3(0, 1, 0),

        // Bottom
        Vec3(0, -1, 0),
        Vec3(0, -1, 0),
        Vec3(0, -1, 0),
        Vec3(0, -1, 0),
        Vec3(0, -1, 0),
        Vec3(0, -1, 0),
    ]);
}

export function cylinder(sides, length, dia) {
    const result = [];
    const vertices = [];
    const inc = (Math.PI * 2.0) / sides;

    for (let i = 0, angle = 0; i < sides; i++, angle += inc) {
        const x = (dia / 2) * Math.cos(angle);
        const z = (dia / 2) * Math.sin(angle);
        // vertices[i] = Vec3(length / 2, x, z);
        // vertices[i + sides] = Vec3(-length / 2, x, z);

        vertices[i] = Vec3(x, 0, z);
        vertices[i + sides] = Vec3(x, length, z);
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
