import { texture } from '../models';
import { OBJParser } from './objParser';
import { OFFParser } from './offParser';

export type ParsedModel = {
    normals: number[];
    vertexes: number[];
    texcoords: number[];
    texture?: texture;
};

export type Extensions = 'off' | 'obj';
export async function loadModel(
    file: Blob,
    path: string,
    extension: Extensions,
    normalize?: boolean
): Promise<ParsedModel> {
    let parsedModel: ParsedModel;

    switch (extension) {
        case 'off': {
            parsedModel = OFFParser(await file.text());
        }

        case 'obj': {
            parsedModel = await OBJParser(await file.text(), path);
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
