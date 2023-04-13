import { m4 } from './math';
import type { Vec3D } from './models';

export class Camera {
    position: Vec3D;
    rotation: Vec3D;
    offset: Vec3D;
    target?: Vec3D;
    colliding: boolean;

    constructor({
        position,
        rotation,
    }: {
        position?: Vec3D;
        rotation?: Vec3D;
    }) {
        this.colliding = false;
        this.offset = [0, 0, 0];
        this.position = position ?? [0, 0, 0];
        this.rotation = rotation ?? [0, 0, 0];
    }

    setTarget(x: number, y: number, z: number) {
        this.target = [x, y, z];
    }

    setPosition(x: number, y: number, z: number) {
        this.position = [x, y, z];
    }

    setX(x: number) {
        this.position[0] = x;
    }

    setY(y: number) {
        this.position[1] = y;
    }

    setZ(z: number) {
        this.position[2] = z;
    }

    setRotation(xRads: number, yRads: number, zRads: number) {
        this.rotation = [xRads, yRads, zRads];
    }

    rotateX(xRads: number) {
        this.rotation[0] = xRads;
    }

    rotateY(yRads: number) {
        this.rotation[1] = yRads;
    }

    rotateZ(zRads: number) {
        this.rotation[2] = zRads;
    }

    getMatrix(): number[] {
        const matrixes = [
            m4.translate(
                this.position[0],
                -this.position[1],
                -this.position[2]
            ),
            m4.rotateZ(this.rotation[2]),
            m4.rotateY(this.rotation[1]),
            m4.rotateX(this.rotation[0]),
            m4.translate.apply(this, this.offset),
        ];

        const matrix = m4.combine(matrixes);

        if (this.target) {
            const pos = [matrix[12], matrix[13], matrix[14]];
            return m4.lookAt(pos, this.target, [0, 1, 0]);
        } else {
            return matrix;
        }
    }
}
