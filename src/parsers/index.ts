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
    extension: Extensions,
    normalize?: boolean
): Promise<ParsedModel> {
    let parsedModel: ParsedModel;

    switch (extension) {
        case 'off': {
            parsedModel = OFFParser(await file.text());
        }

        case 'obj': {
            parsedModel = OBJParser(await file.text());
        }
    }

    if (normalize) {
        const minmax = parsedModel.vertexes.reduce(
            (acc, cur) => {
                if (isNaN(cur)) cur = 0;
                if (acc[0] > cur) acc[0] = cur;
                if (acc[1] < cur) acc[1] = cur;
                return acc;
            },
            [Number.MAX_VALUE, -Number.MAX_VALUE]
        );

        const factor = minmax[1];
        parsedModel.vertexes = parsedModel.vertexes.map((vertex) => {
            if (isNaN(vertex)) vertex = 0;
            return vertex / factor;
        });
    }

    return parsedModel;
}
