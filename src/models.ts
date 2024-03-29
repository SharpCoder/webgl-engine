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
        blend: boolean;
    };
    init?: (self: ProgramTemplate, engine: Engine<unknown>) => void;
    beforeDraw?: (engine: Engine<unknown>) => void;
    afterDraw?: (engine: Engine<unknown>) => void;
    properties?: Record<any, any>;
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
            buffer?: WebGLBuffer | null;
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

type BaseLight = {
    /** The position of the light source */
    position: number[];
    /** The color of the light source */
    color: number[];
    /** If true, the light will be turned off */
    disabled?: boolean;
    /** Method to invoke when the update frame is called */
    update?: (time_t: number, engine: Engine<unknown>) => void;
};

export type Light = {} & BaseLight;

export type Spotlight = {
    /** Which direction the light will be facing */
    rotation: number[];
    /** The lower limit (in radians) for which to disperse the light */
    lowerLimit: number;
    /** The upper limit (in radians) for which to disperse the light */
    upperLimit: number;
    /** How shiny the light is */
    shininess?: number;
} & BaseLight;

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
    zIndex?: number;
    _bbox?: bbox;
    _computed?: {
        positionMatrix: number[];
    };
    update?: (time_t: number, engine: Engine<unknown>) => void;
    beforeDraw?: (engine: Engine<unknown>) => void;
} & Record<any, any>;

export type Drawable = Obj3d;

export type bbox = {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
};

export type repeat_mode = 'repeat' | 'clamp_to_edge' | 'mirrored_repeat';

export type Material = {
    name: string;
    shininess?: number;
    ambient?: number[];
    diffuse?: number[];
    specular?: number[];
    emissive?: number[];
    opticalDensity?: number;
    illum?: number;
    opacity?: number;
};

export type texture = {
    uri: string;
    repeat_horizontal: repeat_mode;
    repeat_vertical: repeat_mode;
    enabled?: boolean;
    _computed?: {
        webglTexture: WebGLTexture;
        image: HTMLImageElement;
        square: boolean;
        width: number;
        height: number;
    };
};

export function Vec3(x: number, y: number, z: number): Vec3D {
    return [x, y, z];
}

export function Repeat(arr: Vec3D, qty: number): Vec3D[] {
    const result = [];
    for (let i = 0; i < qty; i++) {
        // @ts-ignore
        result.push([...arr]);
    }
    return result;
}

export function Flatten(arr: Vec3DArray): number[] {
    const data = [...arr];

    if (Array.isArray(data[0]?.[0])) {
        return (data as Vec3D[][]).flatMap((num) => num).flatMap((num) => num);
    } else {
        return (data as Vec3D[]).flatMap((num) => num);
    }
}

export function Repeat2D(arr: Vec2DArray | Vec2D, qty: number): Vec2D[] {
    const result: Vec2D[] = [];
    for (let i = 0; i < qty; i++) {
        // @ts-ignore
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
