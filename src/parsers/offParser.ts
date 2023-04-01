import type { ParsedModel } from '.';

function toNumber(row: string[]) {
    return row.map((item) => parseInt(item)).filter((x) => !isNaN(x));
}

export function OFFParser(file: string): ParsedModel {
    const lines = file.split('\n').map((row) => row.trim());
    const info = lines.splice(0, 1)[0].split(' ');
    const vertexRows = parseInt(info[1]);
    const vertexes: Array<number[]> = [];
    const triangles: Array<number[]> = [];
    const vertexList = [];

    for (let i = 0; i < lines.length; i++) {
        if (i > vertexRows - 1) {
            triangles.push(toNumber(lines[i].split(' ')));
        } else {
            vertexes.push(toNumber(lines[i].split(' ')));
        }
    }

    for (const triangle of triangles) {
        // Skip rows that have lots of points.
        // In my experiments, it looks bad to render
        // those
        if (triangle.length > 4) {
            continue;
        }

        for (let i = 1; i < triangle.length; i++) {
            const row = vertexes[triangle[i]];
            if (row) {
                for (const number of row) {
                    vertexList.push(number);
                }
            }
        }
    }

    return {
        vertexes: vertexList,
        normals: [],
        texcoords: [],
    };
}
