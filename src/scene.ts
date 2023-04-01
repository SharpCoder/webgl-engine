import { Camera } from './camera';
import type { Engine } from './engine';
import type { Obj3d, ProgramTemplate } from './models';

export type SceneStatus = 'initializing' | 'ready';
export class Scene {
    title: string;
    visible: boolean;
    status: SceneStatus;
    shaders: ProgramTemplate[];
    objects: Obj3d[];
    camera: Camera;
    init?: (engine: Engine) => void;
    update: (time_t: number, engine: Engine) => void;
    onClick?: () => void;

    constructor({
        title,
        init,
        update,
        shaders,
        status,
        onClick,
    }: {
        title: string;
        init?: (engine: Engine) => void;
        update: (time_t: number, engine: Engine) => void;
        onClick?: () => void;
        status?: SceneStatus;
        shaders: ProgramTemplate[];
    }) {
        this.title = title;
        this.visible = true;
        this.objects = [];
        this.update = update;
        this.onClick = onClick;
        this.shaders = shaders;
        this.init = init;
        this.status = status;
        this.camera = new Camera({});
    }

    addObject(obj: Obj3d) {
        this.objects.push(obj);
    }

    setVisibility(visible: boolean) {
        this.visible = visible;
    }
}
