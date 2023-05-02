import type { Engine } from './engine';

export type Vec2D = [number, number];
export type Vec2DArray = Vec2D[] | Vec2D[][];

export type Vec3D = [number, number, number] | number[];
export type Vec3DArray = Vec3D[] | Vec3D[][];

export type ProgramTemplate = {
    name: string;
    order: number;
    objectDrawArgs?: {
        components: number;
        depthFunc: number;
        mode: number;
    };
    beforeDraw?: (engine: Engine<unknown>) => void;
    afterDraw?: (engine: Engine<unknown>) => void;
    sceneDrawArgs?: {
        depthFunc: number;
        mode: number;
        count: number;
    };
    vertexShader: string;
    fragmentShader: string;
    attributes: Record<
        string,
        {
            buffer?: WebGLBuffer;
            components: number;
            normalized: boolean;
            type: number;
            generateData: (engine: Engine<unknown>) => BufferSource;
        }
    >;
    constantUniforms?: Record<
        string,
        (engine: Engine<unknown>, loc: WebGLUniformLocation) => void
    >;
    staticUniforms?: Record<
        string,
        (engine: Engine<unknown>, loc: WebGLUniformLocation) => void
    >;
    dynamicUniforms?: Record<
        string,
        (engine: Engine<unknown>, loc: WebGLUniformLocation, obj: Obj3d) => void
    >;
};

export type CompiledProgram = ProgramTemplate & {
    compiledProgram: WebGLProgram;
};

export type Obj3d = {
    name: string;
    position: number[];
    rotation: number[];
    offsets: number[];
    vertexes: number[];
    computeBbox?: boolean;
    hideWhenFarAway?: boolean;
    transparent?: boolean;
    normals?: number[];
    allowClipping?: boolean;
    children?: Obj3d[];
    _parent?: Obj3d;
    texcoords?: number[];
    texture?: texture;
    colors?: number[];
    visible?: boolean;
    scale?: [number, number, number];
    properties?: Record<any, any>;
    additionalMatrix?: number[];
    _bbox?: bbox;
    _computed?: {
        positionMatrix: number[];
    };
    update?: (time_t: number, engine: Engine<unknown>) => void;
    beforeDraw?: (engine: Engine<unknown>) => void;
} & Record<any, any>;

export type bbox = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
};

export type repeat_mode = 'repeat' | 'clamp_to_edge' | 'mirrored_repeat';

export type texture = {
    uri: string;
    repeat_horizontal: repeat_mode;
    repeat_vertical: repeat_mode;
    enabled?: boolean;
    _computed?: {
        webglTexture: WebGLTexture;
        square: boolean;
    };
};

export function Vec3(x: number, y: number, z: number): Vec3D {
    return [x, y, z];
}

export function Repeat(arr: Vec3D, qty: number): Vec3D[] {
    const result = [];
    for (let i = 0; i < qty; i++) {
        result.push([...arr]);
    }
    return result;
}

export function Flatten(arr: Vec3DArray): number[] {
    const data = [...arr];

    if (Array.isArray(data[0][0])) {
        return (data as Vec3D[][]).flatMap((num) => num).flatMap((num) => num);
    } else {
        return (data as Vec3D[]).flatMap((num) => num);
    }
}

export function Repeat2D(arr: Vec2DArray | Vec2D, qty: number): Vec2D[] {
    const result = [];
    for (let i = 0; i < qty; i++) {
        result.push([...arr]);
    }
    return result;
}

export function Flatten2D(arr: Vec2DArray): number[] {
    if (Array.isArray(arr[0]?.[0])) {
        return (arr as Vec2D[][]).flatMap((num) => num).flatMap((num) => num);
    } else {
        return (arr as Vec2D[]).flatMap((num) => num);
    }
}
