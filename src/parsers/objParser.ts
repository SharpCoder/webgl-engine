import type { ParsedModel } from '.';
import { Material, texture } from '../models';

function parseNumbers(row: string, skip: number) {
    const result = row.trim().split(' ');
    result.splice(0, skip);
    return result
        .filter((item) => item.length > 0)
        .map((item) => parseFloat(item));
}

let materials: Record<string, [Material[], texture]> = {};
export async function OBJParser(
    file: string,
    path: string
): Promise<ParsedModel> {
    let activeMaterial: Material = undefined;
    const materialsList: Record<string, Material> = {};

    const lines = file.split('\n');
    const basepath = path.substring(0, path.lastIndexOf('/') + 1);
    const positions: Array<number[]> = [[0, 0, 0]];
    const texcoords: Array<number[]> = [[0, 0, 0]];
    const normals: Array<number[]> = [[0, 0, 0]];
    const result: ParsedModel = {
        normals: [],
        texcoords: [],
        vertexes: [],
        colors: [],
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

                // Add the respsective color
                if (activeMaterial) {
                    const r =
                        activeMaterial.diffuse[0] * activeMaterial.shininess;
                    const g =
                        activeMaterial.diffuse[1] * activeMaterial.shininess;

                    const b =
                        activeMaterial.diffuse[2] * activeMaterial.shininess;

                    result.colors.push(
                        Math.min(r, 255.0),
                        Math.min(g, 255.0),
                        Math.min(b, 255.0)
                    );
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
                continue;
            }

            case 'v': {
                // Position
                positions.push(parseNumbers(line, 1));
                continue;
            }

            case 'usemtl': {
                activeMaterial = materialsList[parts[1]];
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

            case 'mtllib': {
                // Fetch the material
                if (materials[parts[1]] === undefined) {
                    const mtlfile = await fetch(basepath + parts[1]).then(
                        (blob) => blob.text()
                    );
                    materials[parts[1]] = parseMtl(mtlfile, basepath);
                }

                result.texture = materials[parts[1]][1];

                // Create a materials list
                for (const mtl of materials[parts[1]][0]) {
                    materialsList[mtl.name] = mtl;
                }
            }
        }
    }

    return result;
}

function parseMtl(file: string, basepath: string): [Material[], texture] {
    const lines = file.split('\n');
    const materials: Material[] = [];
    let mtl: Material = undefined;

    const result: texture = {
        uri: '',
        repeat_horizontal: 'clamp_to_edge',
        repeat_vertical: 'clamp_to_edge',
    };

    for (const line of lines) {
        const parts = line
            .trim()
            .replace(/  /g, ' ')
            .split(' ')
            .map((item) => item.trim());

        switch (parts[0]) {
            case 'newmtl': {
                if (mtl) {
                    materials.push(Object.assign({}, mtl));
                }

                mtl = {
                    name: parts[1],
                };
                continue;
            }
            case 'Ka': {
                mtl.ambient = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ];
                continue;
            }

            case 'Ns': {
                mtl.shininess = parseFloat(parts[1]);
                continue;
            }

            case 'Kd': {
                mtl.diffuse = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ];
                continue;
            }

            case 'Ks': {
                mtl.specular = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ];
                continue;
            }

            case 'Ke': {
                mtl.emissive = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ];
                continue;
            }

            case 'd': {
                mtl.opacity = parseFloat(parts[1]);
                continue;
            }

            case 'Ni': {
                mtl.opticalDensity = parseFloat(parts[1]);
                continue;
            }

            case 'illum': {
                mtl.illum = parseInt(parts[1]);
                continue;
            }

            case 'map_Kd': {
                result.uri = basepath + parts[1];
                continue;
            }
        }
    }

    if (mtl) {
        materials.push(Object.assign({}, mtl));
    }

    if (result.uri.length === 0) return [materials, undefined];
    return [materials, result];
}
