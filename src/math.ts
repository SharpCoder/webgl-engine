import type { Vec3D } from './models';

export class m3 {
    static identity(): number[] {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static translate(x: number, y: number) {
        return [1, 0, 0, 0, 1, 0, x, y, 1];
    }

    static rotate(rads: number) {
        const c = Math.cos(rads);
        const s = Math.sin(rads);
        return [c, -s, 0, s, c, 0, 0, 0, 1];
    }

    static scale(x: number, y: number) {
        return [x, 0, 0, 0, y, 0, 0, 0, 1];
    }

    static multiply(a: number[], b: number[]) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    }

    static combine(matrixes: number[][]): number[] {
        let result = matrixes[0];
        for (let i = 1; i < matrixes.length; i++) {
            result = m3.multiply(result, matrixes[i]);
        }
        return result;
    }

    static dot(a: number[], b: number[]): number {
        return a.map((_x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    }

    static cross(a: number[], b: number[]): number[] {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    }

    static projection(width: number, height: number) {
        return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
    }
}

export class m4 {
    static perspective(
        fieldOfViewInRadians: number,
        aspect: number,
        near: number,
        far: number
    ) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        const rangeInv = 1.0 / (near - far);

        return [
            f / aspect,
            0,
            0,
            0,
            0,
            f,
            0,
            0,
            0,
            0,
            (near + far) * rangeInv,
            -1,
            0,
            0,
            near * far * rangeInv * 2,
            0,
        ];
    }

    static translate(x: number, y: number, z: number) {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
    }

    static rotateX(rads: number) {
        const c = Math.cos(rads);
        const s = Math.sin(rads);

        return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
    }

    static rotateY(rads: number) {
        const c = Math.cos(rads);
        const s = Math.sin(rads);

        return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
    }

    static rotateZ(rads: number) {
        const c = Math.cos(rads);
        const s = Math.sin(rads);

        return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    static scale(x: number, y: number, z: number) {
        return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
    }

    static projection(width: number, height: number, depth: number) {
        return [
            2 / width,
            0,
            0,
            0,
            0,
            -2 / height,
            0,
            0,
            0,
            0,
            2 / depth,
            0,
            -1,
            1,
            0,
            1,
        ];
    }

    static cross(a: number[], b: number[]) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    }

    static subtract(a: number[], b: number[]) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    static normalize(v: number[]) {
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        // make sure we don't divide by 0.
        if (length > 0.00001) {
            return [v[0] / length, v[1] / length, v[2] / length];
        } else {
            return [0, 0, 0];
        }
    }

    static lookAt(origin: number[], target: number[], up: number[]) {
        var zAxis = m4.normalize(m4.subtract(origin, target));
        var xAxis = m4.normalize(m4.cross(up, zAxis));
        var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

        return [
            xAxis[0],
            xAxis[1],
            xAxis[2],
            0,
            yAxis[0],
            yAxis[1],
            yAxis[2],
            0,
            zAxis[0],
            zAxis[1],
            zAxis[2],
            0,
            origin[0],
            origin[1],
            origin[2],
            1,
        ];
    }

    static multiply(a: number[], b: number[]) {
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];

        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }

    static mult(v: number[], m: number[]) {
        const dst: number[] = [];
        for (let i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (let j = 0; j < 4; ++j) {
                dst[i] += v[j] * m[j * 4 + 1];
            }
        }
        return dst;
    }

    static inverse(m: number[]) {
        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];
        var tmp_0 = m22 * m33;
        var tmp_1 = m32 * m23;
        var tmp_2 = m12 * m33;
        var tmp_3 = m32 * m13;
        var tmp_4 = m12 * m23;
        var tmp_5 = m22 * m13;
        var tmp_6 = m02 * m33;
        var tmp_7 = m32 * m03;
        var tmp_8 = m02 * m23;
        var tmp_9 = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;

        var t0 =
            tmp_0 * m11 +
            tmp_3 * m21 +
            tmp_4 * m31 -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 =
            tmp_1 * m01 +
            tmp_6 * m21 +
            tmp_9 * m31 -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 =
            tmp_2 * m01 +
            tmp_7 * m11 +
            tmp_10 * m31 -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 =
            tmp_5 * m01 +
            tmp_8 * m11 +
            tmp_11 * m21 -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d *
                (tmp_1 * m10 +
                    tmp_2 * m20 +
                    tmp_5 * m30 -
                    (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d *
                (tmp_0 * m00 +
                    tmp_7 * m20 +
                    tmp_8 * m30 -
                    (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d *
                (tmp_3 * m00 +
                    tmp_6 * m10 +
                    tmp_11 * m30 -
                    (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d *
                (tmp_4 * m00 +
                    tmp_9 * m10 +
                    tmp_10 * m20 -
                    (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d *
                (tmp_12 * m13 +
                    tmp_15 * m23 +
                    tmp_16 * m33 -
                    (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d *
                (tmp_13 * m03 +
                    tmp_18 * m23 +
                    tmp_21 * m33 -
                    (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d *
                (tmp_14 * m03 +
                    tmp_19 * m13 +
                    tmp_22 * m33 -
                    (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d *
                (tmp_17 * m03 +
                    tmp_20 * m13 +
                    tmp_23 * m23 -
                    (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d *
                (tmp_14 * m22 +
                    tmp_17 * m32 +
                    tmp_13 * m12 -
                    (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d *
                (tmp_20 * m32 +
                    tmp_12 * m02 +
                    tmp_19 * m22 -
                    (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d *
                (tmp_18 * m12 +
                    tmp_23 * m32 +
                    tmp_15 * m02 -
                    (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d *
                (tmp_22 * m22 +
                    tmp_16 * m02 +
                    tmp_21 * m12 -
                    (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
        ];
    }

    static identity(): number[] {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    static combine(matrixes: number[][]): number[] {
        let result = matrixes[0];
        for (let i = 1; i < matrixes.length; i++) {
            result = m4.multiply(result, matrixes[i]);
        }
        return result;
    }
}

export function norm(arr: number[]) {
    return Math.sqrt(
        [...arr].map((p) => Math.pow(p, 2)).reduce((a, b) => a + b)
    );
}

export function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}

export function rotationBetweenPoints(a: Vec3D, b: Vec3D) {
    const angles = [0, 0, 0];
    const [x1, y1, z1] = a;
    const [x2, y2, z2] = b;
    let x = x1 - x2;
    let y = -(y1 - y2);
    let z = z1 - z2;

    /// Don't let z be absolutely zero because that fucks with atan2
    if (z === 0) {
        z -= 0.0001;
    }

    angles[0] = Math.atan2(y, z);

    if (z >= 0) {
        angles[1] = Math.atan2(x * Math.cos(angles[0]), -z);
    } else {
        angles[1] = -Math.atan2(x * Math.cos(angles[0]), z);
    }

    angles[2] = Math.atan2(
        Math.cos(angles[0]),
        Math.sin(angles[0]) * Math.sin(angles[1])
    );

    return angles;
}

export function getAnglesFromMatrix(mm: number[]) {
    let thetaX = 0,
        thetaY = 0,
        thetaZ = 0;

    function idx(row: number, col: number) {
        return (col - 1) * 4 + row - 1;
    }

    thetaX = Math.asin(mm[idx(3, 2)]);
    if (thetaX < Math.PI / 2) {
        if (thetaX > -Math.PI / 2) {
            thetaZ = Math.atan2(-mm[idx(1, 2)], mm[idx(2, 2)]);
            thetaY = Math.atan2(-mm[idx(3, 1)], mm[idx(3, 3)]);
        } else {
            thetaZ = -Math.atan2(-mm[idx(1, 3)], mm[idx(1, 1)]);
            thetaY = 0;
        }
    } else {
        thetaZ = Math.atan2(mm[idx(1, 3)], mm[idx(1, 1)]);
        thetaY = 0;
    }
    return [thetaX, thetaY, thetaZ];
}

export function getAnglesFromMatrix2(mm: number[]) {
    let thetaX = 0,
        thetaY = 0,
        thetaZ = 0;

    function idx(row: number, col: number) {
        return (col - 1) * 4 + row - 1;
    }

    const thetaYs = [
        -Math.asin(mm[idx(3, 1)]),
        Math.PI + Math.asin(mm[idx(3, 1)]),
    ];

    const thetaXs = [
        Math.atan2(
            mm[idx(3, 2) / Math.cos(thetaYs[0])],
            mm[idx(3, 3) / Math.cos(thetaYs[0])]
        ),
        Math.atan2(
            mm[idx(3, 2) / Math.cos(thetaYs[1])],
            mm[idx(3, 3) / Math.cos(thetaYs[1])]
        ),
    ];

    const thetaZs = [
        Math.atan2(
            mm[idx(2, 1)] / Math.cos(thetaYs[0]),
            mm[idx(1, 1)] / Math.cos(thetaYs[0])
        ),
        Math.atan2(
            mm[idx(2, 1)] / Math.cos(thetaYs[1]),
            mm[idx(1, 1)] / Math.cos(thetaYs[1])
        ),
    ];

    if (mm[idx(3, 1)] != 1) {
        thetaX = thetaXs[0];
        if (isNaN(thetaX)) thetaX = thetaXs[1];
        if (isNaN(thetaX)) thetaX = 0;

        thetaY = thetaYs[0];
        if (isNaN(thetaY)) thetaY = thetaYs[1];
        if (isNaN(thetaY)) thetaY = 0;

        thetaZ = thetaZs[0];
        if (isNaN(thetaZ)) thetaZ = thetaZs[1];
        if (isNaN(thetaZ)) thetaZ = 0;
    } else {
        thetaZ = 0;

        if (mm[idx(3, 1)] == -1) {
            thetaY = Math.PI / 2;
            thetaX = Math.atan2(mm[idx(1, 2)], mm[idx(1, 3)]);
        } else {
            thetaY = -Math.PI / 2;
            thetaX = Math.atan2(-mm[idx(1, 2)], -mm[idx(1, 3)]);
        }
    }

    return [thetaX, thetaY, thetaZ];
}
