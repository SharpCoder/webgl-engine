import { Camera } from './camera';
import type { Engine, Obj3d } from './engine';

export class Scene {
    title: string;
    visible: boolean;
    objects: Obj3d[];
    camera: Camera;
    init?: () => void;
    update: (time_t: number, engine: Engine) => void;
    onClick?: () => void;

    constructor({
        title,
        init,
        update,
        onClick,
    }: {
        title: string;
        init?: () => void;
        update: (time_t: number, engine: Engine) => void;
        onClick?: () => void;
    }) {
        this.title = title;
        this.visible = true;
        this.objects = [];
        this.update = update;
        this.onClick = onClick;
        this.camera = new Camera({});

        if (init) {
            init.call(this);
        }
    }

    addObject(obj: Obj3d) {
        this.objects.push(obj);
    }

    setVisibility(visible: boolean) {
        this.visible = visible;
    }
}
