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
