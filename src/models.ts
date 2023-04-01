import type { Engine } from './engine';

export type Vec2D = [number, number];
export type Vec2DArray = Vec2D[] | Vec2D[][];

export type Vec3D = [number, number, number];
export type Vec3DArray = Vec3D[] | Vec3D[][];

export type ProgramTemplate = {
    name: string;
    order: number;
    objectDrawArgs?: {
        depthFunc: number;
        mode: number;
    };
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
            generateData: (engine: Engine) => BufferSource;
        }
    >;
    constantUniforms?: Record<
        string,
        (engine: Engine, loc: WebGLUniformLocation) => void
    >;
    staticUniforms?: Record<
        string,
        (engine: Engine, loc: WebGLUniformLocation) => void
    >;
    dynamicUniforms?: Record<
        string,
        (engine: Engine, loc: WebGLUniformLocation, obj: Obj3d) => void
    >;
};

export type CompiledProgram = ProgramTemplate & {
    compiledProgram: WebGLProgram;
};

export type Obj3d = {
    position: number[];
    rotation: number[];
    offsets: number[];
    vertexes: number[];
    normals?: number[];
    allowClipping?: boolean;
    texture?: texture;
    colors?: number[];
    visible?: boolean;
    scale?: [number, number, number];
    properties?: Record<any, any>;
    _bbox?: bbox;
    _computed?: {
        positionMatrix: number[];
    };
    update?: (time_t: number) => void;
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
    coordinates: number[];
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
    if (Array.isArray(arr[0][0])) {
        return (arr as Vec3D[][]).flatMap((num) => num).flatMap((num) => num);
    } else {
        return (arr as Vec3D[]).flatMap((num) => num);
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
    if (Array.isArray(arr[0][0])) {
        return (arr as Vec2D[][]).flatMap((num) => num).flatMap((num) => num);
    } else {
        return (arr as Vec2D[]).flatMap((num) => num);
    }
}
