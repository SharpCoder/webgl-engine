import { Camera } from './camera';
import type { Engine } from './engine';
import {
    Flatten,
    Flatten2D,
    type Light,
    type Obj3d,
    type ProgramTemplate,
    Repeat,
    Repeat2D,
    type Spotlight,
} from './models';

function del(obj: Record<any, any>) {
    for (const prop in obj) delete obj[prop];
}

export type SceneStatus = 'initializing' | 'ready';
export class Scene<T> {
    title: string;
    visible: boolean;
    status: SceneStatus;
    shaders: ProgramTemplate[];
    objects: Obj3d[];
    camera: Camera;
    engine: Engine<T>;
    once?: (engine: Engine<T>) => void;
    init?: (engine: Engine<T>) => void;
    update: (time_t: number, engine: Engine<T>) => void;
    onClick?: (engine: Engine<T>) => void;
    onMouseUp?: (engine: Engine<T>) => void;

    lights: (Light | Spotlight)[];

    colors: number[];
    colorMetadata: Record<string, { offset: number; length: number }>;
    vertexes: number[];
    vertexMetadata: Record<string, { offset: number; length: number }>;
    normals: number[];
    normalMetadata: Record<string, { offset: number; length: number }>;
    texcoords: number[];
    texcoordMetadata: Record<string, { offset: number; length: number }>;

    constructor({
        title,
        init,
        update,
        shaders,
        status,
        once,
        onClick,
        onMouseUp,
    }: {
        title: string;
        once?: (engine: Engine<T>) => void;
        init?: (engine: Engine<T>) => void;
        update: (time_t: number, engine: Engine<T>) => void;
        onClick?: (engine: Engine<T>) => void;
        onMouseUp?: (engine: Engine<T>) => void;
        status?: SceneStatus;
        shaders: ProgramTemplate[];
    }) {
        this.title = title;
        this.visible = true;
        this.objects = [];
        this.update = update;
        this.onClick = onClick;
        this.onMouseUp = onMouseUp;
        this.shaders = shaders;
        this.init = init;
        this.once = once;
        this.status = status ?? 'ready';
        this.colors = [];
        this.vertexes = [];
        this.texcoords = [];
        this.normals = [];
        this.spotlights = [];
        this.lights = [];
        this.vertexMetadata = {};
        this.texcoordMetadata = {};
        this.colorMetadata = {};
        this.normalMetadata = {};
        this.camera = new Camera({});
    }

    getObject(name: string): Obj3d | null {
        for (const obj of this.objects) {
            if (obj.name === name) {
                return obj;
            }
        }

        return null;
    }

    private registerObject(obj: Obj3d) {
        let name = obj.name;
        if (!this.vertexMetadata[name]) {
            const vertexes = obj.vertexes;
            const normals =
                obj.normals ?? Flatten(Repeat([0, 0, 0], vertexes.length / 3));
            const colors =
                obj.colors ?? Flatten(Repeat([0, 0, 0], vertexes.length / 3));
            const texcoords =
                obj.texcoords ??
                Flatten2D(Repeat2D([0, 0], vertexes.length / 3));

            // Register it
            this.vertexMetadata[name] = {
                offset: this.vertexes.length,
                length: vertexes.length,
            };

            this.normalMetadata[name] = {
                offset: this.normals.length,
                length: normals.length,
            };

            this.texcoordMetadata[name] = {
                offset: this.texcoords.length,
                length: texcoords.length,
            };

            this.colorMetadata[name] = {
                offset: this.colors.length,
                length: colors.length,
            };

            for (const normal of normals) {
                this.normals.push(normal);
            }

            for (const color of colors) {
                this.colors.push(color);
            }

            for (const vertex of vertexes) {
                this.vertexes.push(vertex);
            }

            for (const texcoord of texcoords) {
                this.texcoords.push(texcoord);
            }
        }
    }

    addLight(source: Light | Spotlight) {
        this.lights.push(source);
    }

    getOffsetAndLength(type: 'texcoord' | 'vertex' | 'normals', name: string) {
        switch (type) {
            case 'texcoord': {
                return [
                    this.texcoordMetadata[name].offset,
                    this.texcoordMetadata[name].length,
                ];
            }

            case 'normals': {
                return [
                    this.normalMetadata[name].offset,
                    this.normalMetadata[name].length,
                ];
            }

            case 'vertex': {
                return [
                    this.vertexMetadata[name].offset,
                    this.vertexMetadata[name].length,
                ];
            }
        }
    }

    clear() {
        this.objects.length = 0;
        this.vertexes.length = 0;
        this.texcoords.length = 0;
        this.normals.length = 0;
        this.colors.length = 0;

        del(this.vertexMetadata);
        del(this.texcoordMetadata);
        del(this.colorMetadata);
        del(this.normalMetadata);
    }

    addObject(obj: Obj3d) {
        const queue = [obj];
        // Collect all root and child nodes.
        while (queue.length > 0) {
            const obj = queue.pop();
            if (obj) {
                this.registerObject(obj);
                this.objects.push(obj);

                if (obj.children) {
                    for (const child of obj.children) {
                        child._parent = obj;
                        queue.push(child);
                    }
                }
            } else {
                break;
            }
        }
    }

    removeObject(obj: Obj3d) {
        const queue = [obj];
        // Collect all root and child nodes.
        while (queue.length > 0) {
            const obj = queue.pop();
            if (obj) {
                const index = this.objects.indexOf(obj);
                if (obj && index >= 0) {
                    this.objects.splice(index, 1);
                    if (obj.children) {
                        for (const child of obj.children) {
                            child._parent = obj;
                            queue.push(child);
                        }
                    }
                } else {
                    break;
                }
            }
        }
    }

    setVisibility(visible: boolean) {
        this.visible = visible;
    }
}
