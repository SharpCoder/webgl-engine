import { Camera } from './camera';
import type { Engine } from './engine';
import {
    Flatten,
    Flatten2D,
    Obj3d,
    ProgramTemplate,
    Repeat,
    Repeat2D,
} from './models';

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

    colors: number[];
    colorMetadata: Record<string, { offset: number; length: number }>;
    vertexes: number[];
    vertexMetadata: Record<string, { offset: number; length: number }>;
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
        this.status = status;
        this.colors = [];
        this.vertexes = [];
        this.texcoords = [];
        this.vertexMetadata = {};
        this.texcoordMetadata = {};
        this.colorMetadata = {};
        this.camera = new Camera({});
    }

    private registerObject(obj: Obj3d) {
        let name = obj.name;
        if (!this.vertexMetadata[name]) {
            const vertexes = obj.vertexes;
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

            this.texcoordMetadata[name] = {
                offset: this.texcoords.length,
                length: texcoords.length,
            };

            this.colorMetadata[name] = {
                offset: this.colors.length,
                length: colors.length,
            };

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

    getOffsetAndLength(type: 'texcoord' | 'vertex', name: string) {
        switch (type) {
            case 'texcoord': {
                return [
                    this.texcoordMetadata[name].offset,
                    this.texcoordMetadata[name].length,
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
        this.objects.splice(0, this.objects.length);
        this.vertexes = [];
        this.texcoords = [];
        this.vertexMetadata = {};
        this.texcoordMetadata = {};
    }

    addObject(obj: Obj3d) {
        const queue = [obj];
        // Collect all root and child nodes.
        while (queue.length > 0) {
            const obj = queue.pop();
            if (obj) {
                this.registerObject(obj);
                delete obj.vertexes;
                delete obj.texcoords;
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
            if (obj && this.objects.indexOf(obj) >= 0) {
                this.objects.splice(this.objects.indexOf(obj), 1);
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

    setVisibility(visible: boolean) {
        this.visible = visible;
    }
}
