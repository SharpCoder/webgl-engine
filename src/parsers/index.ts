import { texture } from '../models';
import { OBJParser } from './objParser';
import { OFFParser } from './offParser';

export type ParsedModel = {
    name?: string;
    normals: number[];
    vertexes: number[];
    texcoords: number[];
    texture?: texture;
};

export type Extensions = 'off' | 'obj';
export async function loadModel(
    path: string,
    extension: Extensions,
    normalize?: boolean
): Promise<ParsedModel> {
    return new Promise(async (resolve) => {
        const file = await fetch(path);
        const blob = await file.blob();

        let parsedModel: ParsedModel;
        switch (extension) {
            case 'off': {
                parsedModel = OFFParser(await blob.text());
            }

            case 'obj': {
                parsedModel = await OBJParser(await blob.text(), path);
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

        // Configure the name
        parsedModel.name = parsedModel.name ?? path;
        resolve(parsedModel);
    });
}
