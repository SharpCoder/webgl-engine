import type { ParsedModel } from '.';

function parseNumbers(row: string, skip: number) {
    const result = row.trim().split(' ');
    result.splice(0, skip);
    return result
        .filter((item) => item.length > 0)
        .map((item) => parseFloat(item));
}

export function OBJParser(file: string): ParsedModel {
    const lines = file.split('\n');
    let name = 'Unknown';
    const positions: Array<number[]> = [[0, 0, 0]];
    const texcoords: Array<number[]> = [[0, 0, 0]];
    const normals: Array<number[]> = [[0, 0, 0]];
    const result: ParsedModel = {
        normals: [],
        texcoords: [],
        vertexes: [],
    };

    const sourceMap = {
        0: positions,
        1: texcoords,
        2: normals,
    };

    const resultMap = {
        0: result.vertexes,
        1: result.texcoords,
        2: result.normals,
    };

    function process(triangle: string) {
        // This will just be simple for now
        const parts = triangle.split(' ');
        parts.splice(0, 1);

        for (let z = 0; z < parts.length - 2; z++) {
            for (let r = 0; r < Math.min(parts.length, 3); r++) {
                // Something like 1/2/3
                const path = parts[r === 0 ? r : r + z].split('/');

                // For each item in the path, look up the candidate from the source map
                for (let resultIdx = 0; resultIdx < path.length; resultIdx++) {
                    const candidate = sourceMap[resultIdx][path[resultIdx]];
                    if (candidate) {
                        for (const value of candidate) {
                            resultMap[resultIdx].push(value);
                        }
                    }
                }
            }
        }
    }

    for (const line of lines) {
        const parts = line
            .trim()
            .replace(/  /g, ' ')
            .split(' ')
            .map((item) => item.trim());

        switch (parts[0]) {
            case 'f': {
                let triangle = line.trim();
                if (triangle && triangle.length > 0) {
                    process(triangle);
                }
                continue;
            }

            case 'o': {
                // Name?
                name = parts[1];
                continue;
            }

            case 'v': {
                // Position
                positions.push(parseNumbers(line, 1));
                continue;
            }

            case 'vt': {
                // Texture position
                texcoords.push(parseNumbers(line, 1));
                continue;
            }

            case 'vn': {
                normals.push(parseNumbers(line, 1));
                continue;
            }
        }
    }

    return result;
}
