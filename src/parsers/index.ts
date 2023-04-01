import { OBJParser } from './objParser';
import { OFFParser } from './offParser';

export type ParsedModel = {
    normals: number[];
    vertexes: number[];
    texcoords: number[];
};

export type Extensions = 'off' | 'obj';
export async function loadModel(
    file: Blob,
    extension: Extensions
): Promise<ParsedModel> {
    switch (extension) {
        case 'off': {
            return OFFParser(await file.text());
        }

        case 'obj': {
            return OBJParser(await file.text());
        }
    }
}
