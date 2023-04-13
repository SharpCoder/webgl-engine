import { createProgram, createShader } from './helpers';
import { Loader } from './loader';
import { isPowerOf2, m4 } from './math';
import type {
    bbox,
    CompiledProgram,
    Obj3d,
    ProgramTemplate,
    repeat_mode,
} from './models';
import type { Scene } from './scene';
import { rads } from './utils';

export type ReadyState = 'initialize' | 'loading' | 'ready' | 'destroyed';
export type EventType = 'keydown' | 'click' | 'mousemove';
export type EngineComputedValues = {
    cameraMatrix: number[];
    inverseCameraMatrix: number[];
    projectionMatrix: number[];
} & Record<string, any>;

export class Engine {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    id: number;
    lastTime: number;
    scenes: Scene[];
    activeScene: Scene;
    settings: {
        fov: number;
        zNear: number;
        zFar: number;
        fogColor: [number, number, number, number];
        fogDensity: number;
    };
    properties: Record<any, any>;
    readyState: ReadyState;
    onReadyChange?: (ready: ReadyState) => void;
    _debugLogs: string;
    loader: Loader;

    /** Values that are computed by the engine. */
    computed: EngineComputedValues;

    private _locations: Record<string, WebGLUniformLocation>;
    private _buffers: Record<string, WebGLBuffer>;
    private _canvasId: number;
    private programs: Record<string, CompiledProgram>;

    // Input processes
    keymap: Record<string, boolean>;
    mousebutton: number;
    mousex: number;
    mousey: number;

    // These need to be stored somewhere
    private keydownListener: any;
    private keypressListener: any;
    private keyupListener: any;
    private mousemoveListener: any;
    private mousedownListener: any;
    private mouseupListener: any;

    constructor() {
        this.id = new Date().getTime() * Math.random();
        this.lastTime = new Date().getTime();
        this.scenes = [];
        this.keymap = {};
        this.programs = {};
        this.computed = {
            cameraMatrix: [],
            inverseCameraMatrix: [],
            projectionMatrix: [],
        };
        this.settings = {
            fov: 65,
            zNear: 1,
            zFar: 10000,
            fogColor: [0.0, 0.0, 0.0, 1],
            fogDensity: 0.088,
        };

        this.mousebutton = -1;
        this.mousex = window.innerWidth / 2;
        this.mousey = window.innerHeight / 2;
        this.properties = {};
        this._locations = {};
        this._buffers = {};
        this._debugLogs = '';
        this.loader = new Loader();
        this.readyState = 'initialize';

        // Configure the event listeners
        this.keydownListener = this._handleKeydown.bind(this);
        this.keypressListener = this._handleKeydown.bind(this);
        this.keyupListener = this._handleKeyup.bind(this);
        this.mousemoveListener = this._handleMouseMove.bind(this);
        this.mousedownListener = this._handleMouseDown.bind(this);
        this.mouseupListener = this._handleMouseUp.bind(this);

        document.addEventListener('keydown', this.keydownListener);
        document.addEventListener('keypress', this.keypressListener);
        document.addEventListener('keyup', this.keyupListener);
        document.addEventListener('mousemove', this.mousemoveListener);
        document.addEventListener('mousedown', this.mousedownListener);
        document.addEventListener('mouseup', this.mouseupListener);
    }

    initialize(canvas: HTMLCanvasElement) {
        this.setReady('initialize');
        this.setCanvas(canvas);
    }

    attachProgram(template: ProgramTemplate) {
        const { gl } = this;
        const result: CompiledProgram = {
            ...template,
            compiledProgram: createProgram(
                gl,
                createShader(gl, gl.VERTEX_SHADER, template.vertexShader),
                createShader(gl, gl.FRAGMENT_SHADER, template.fragmentShader)
            ),
        };

        this.programs[template.name] = result;
    }

    useProgram(program: CompiledProgram) {
        const { gl } = this;
        gl.useProgram(program.compiledProgram);

        for (const attribute in program.attributes) {
            program.attributes[attribute].buffer = gl.createBuffer();
            const data = program.attributes[attribute];
            const loc = gl.getAttribLocation(
                program.compiledProgram,
                attribute
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(
                loc,
                data.components,
                data.type,
                data.normalized,
                0,
                0
            );
            gl.bufferData(
                gl.ARRAY_BUFFER,
                data.generateData(this),
                gl.STATIC_DRAW
            );
        }
    }

    getProgram(name: string): CompiledProgram {
        return this.programs[name];
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');

        const { gl } = this;
        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // This disables some warning because it's the fallback
        // vertex context or something.
        gl.enableVertexAttribArray(0);
    }

    setFov(fov: number) {
        this.settings.fov = fov;
    }

    destroy() {
        this.setReady('destroyed');

        document.removeEventListener('keydown', this.keydownListener);
        document.removeEventListener('keypress', this.keypressListener);
        document.removeEventListener('keyup', this.keyupListener);
        document.removeEventListener('mousemove', this.mousemoveListener);
        document.removeEventListener('mousedown', this.mousedownListener);
    }

    setOnReadyChange(cb: (ready: ReadyState) => void) {
        this.onReadyChange = cb;
    }

    async setReady(ready: ReadyState) {
        this.readyState = ready;

        return new Promise((resolve) => {
            this.onReadyChange && this.onReadyChange(ready);
            setTimeout(resolve, 100);
        });
    }

    _handleKeydown(evt: KeyboardEvent) {
        if (evt.shiftKey) {
            this.keymap['shift'] = true;
        }

        if (evt.altKey) {
            this.keymap['alt'] = true;
        }

        const { key } = evt;
        if (
            [
                'F1',
                'F2',
                'F3',
                'F4',
                'F5',
                'F6',
                'F7',
                'F8',
                'F9',
                'F10',
                'F11',
                'F12',
            ].includes(key)
        ) {
            const number = parseInt(key.substring(1)) - 1;
            if (this.scenes.length > number) {
                this.setScene(this.scenes[number].title);
                evt.stopPropagation();
                evt.preventDefault();
            }
        }

        this.keymap[evt.key] = true;
    }

    _handleKeyup(evt: KeyboardEvent) {
        if (!evt.shiftKey) {
            this.keymap['shift'] = false;
        }

        if (!evt.altKey) {
            this.keymap['alt'] = false;
        }

        this.keymap[evt.key] = false;
    }

    _handleMouseMove(evt: MouseEvent) {
        this.mousex = evt.clientX;
        this.mousey = evt.clientY;
        this.mousebutton = evt.buttons;
    }

    _handleMouseDown(evt: MouseEvent) {
        if (this.activeScene) {
            this.activeScene.onClick?.call(this.activeScene);
        }

        if (evt.button === 2) {
            evt.preventDefault();
            evt.stopPropagation();
            this.keymap = {};
        }
    }

    _handleMouseUp(evt: MouseEvent) {}

    debug(str: string) {
        this._debugLogs += str;
        this._debugLogs += '\n';
    }

    addScene(scene: Scene) {
        scene.engine = this;
        this.scenes.push(scene);
        if (!this.activeScene) {
            this.setScene(scene.title);
        }
    }

    setScene(title: string) {
        for (const scene of this.scenes) {
            if (scene.title === title) {
                this.activeScene = scene;
                this.setReady('initialize');
                return;
            }
        }

        console.error('Did not find scene ' + title);
    }

    private configureShaders(shaders: ProgramTemplate[]) {
        this.programs = {};
        for (const shader of shaders) {
            this.attachProgram(shader);
        }
    }

    async _reconfigureBuffers() {
        if (this.readyState === 'destroyed') return;

        console.log('init reconfigure buffers');
        console.time('reconfigure buffers');

        const { loader, activeScene, gl } = this;
        if (!gl) return;

        await this.setReady('loading');

        /***************************************
         * Load all of the texture first
         * *************************************/
        // Collect all the textures
        console.time('load textures');
        const textureMap: Record<string, WebGLTexture> = {};

        for (const obj of activeScene.objects) {
            if (obj.texture && obj.texture.enabled !== false) {
                textureMap[obj.texture.uri] = null;
            }
        }

        // Load each texture, async but blocking.
        const promises = [];
        for (const texture of Object.keys(textureMap)) {
            promises.push(loader.load(texture));
        }

        await Promise.all(promises);
        console.timeEnd('load textures');

        console.time('bind textures');

        for (const texture of Object.keys(textureMap)) {
            const image = loader.fetch(texture);
            console.time('load texture into shader');
            const webglTexture = gl.createTexture();
            textureMap[texture] = webglTexture;
            gl.bindTexture(gl.TEXTURE_2D, webglTexture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            console.timeEnd('load texture into shader');
        }
        console.timeEnd('bind textures');

        for (const program of Object.values(this.programs)) {
            this.useProgram(program);

            // Parse the attributes
            for (const attribute in program.attributes) {
                console.time(`loading attribute ${attribute}`);
                const data = program.attributes[attribute];
                const loc = gl.getAttribLocation(
                    program.compiledProgram,
                    attribute
                );
                gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(
                    loc,
                    data.components,
                    data.type,
                    data.normalized,
                    0,
                    0
                );
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    data.generateData(this),
                    gl.STATIC_DRAW
                );
                console.timeEnd(`loading attribute ${attribute}`);
            }
        }

        /***************************************
         * Handle texture
         * *************************************/
        console.time('load texture buffer');
        for (const obj of activeScene.objects) {
            if (obj.texture && obj.texture.enabled !== false) {
                const image = loader.fetch(obj.texture.uri);
                obj.texture._computed = {
                    webglTexture: textureMap[obj.texture.uri],
                    square: isPowerOf2(image.width) && isPowerOf2(image.height),
                };
            }
        }

        console.timeEnd('load texture buffer');

        for (const program of Object.values(this.programs)) {
            this.useProgram(program);

            for (const uniform in program.constantUniforms ?? {}) {
                const loc = gl.getUniformLocation(
                    program.compiledProgram,
                    uniform
                );
                program.constantUniforms[uniform](this, loc);
            }
        }

        await this.setReady('ready');
        console.timeEnd('reconfigure buffers');
    }

    async draw() {
        const { gl, activeScene } = this;
        if (!gl) return;

        // Clear debug logs
        this._debugLogs = '';

        gl.clearColor(...this.settings.fogColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.readyState === 'destroyed') {
            return;
        } else if (this.readyState === 'initialize') {
            if (this.activeScene.init) {
                this.activeScene.init(this);
            }
            this.configureShaders(this.activeScene.shaders);
            await this._reconfigureBuffers();
            return;
        } else if (this.readyState === 'loading') {
            return;
        } else if (!activeScene) {
            return;
        } else if (this.activeScene.visible === false) {
            return;
        }

        const REPEAT_MAP: Record<repeat_mode, number> = {
            repeat: gl.REPEAT,
            clamp_to_edge: gl.CLAMP_TO_EDGE,
            mirrored_repeat: gl.MIRRORED_REPEAT,
        };

        // Calculate the camera matrixes
        const { camera } = this.activeScene;

        // Compute the main values
        this.computed.projectionMatrix = m4.perspective(
            rads(this.settings.fov),
            gl.canvas.clientWidth / gl.canvas.clientHeight,
            this.settings.zNear,
            this.settings.zFar
        );

        this.computed.cameraMatrix = camera.getMatrix();
        this.computed.inverseCameraMatrix = m4.inverse(
            this.computed.cameraMatrix
        );
        // Collect all the objects
        const drawables = activeScene.objects;
        for (const drawable of drawables) {
            if (drawable._parent) {
                // console.log(drawable);
            }
        }
        // const queue = activeScene.objects;
        // Collect all root and child nodes.
        // while (queue.length > 0) {
        //     const obj = queue.pop();
        //     if (obj) {
        //         drawables.push(obj);
        //         if (obj.children) {
        //             for (const child of obj.children) {
        //                 child._parent = obj;
        //                 queue.push(child);
        //             }
        //         }
        //     } else {
        //         break;
        //     }
        // }

        for (const obj of drawables) {
            obj._computed = {
                positionMatrix: computePositionMatrix(obj),
            };

            // If it has a parent, merge the position matrixes.
            // This should always work, in theory, because of how the queue
            // is constructed (hierarchically).
            if (obj._parent) {
                obj._computed.positionMatrix = m4.combine([
                    obj._parent._computed.positionMatrix,
                    obj._computed.positionMatrix,
                ]);
            }
            obj._bbox = computeBbox(obj);
        }

        const programs = Object.values(this.programs);
        programs.sort((a, b) => a.order - b.order);

        for (const program of programs) {
            this.useProgram(program);

            for (const uniform in program.staticUniforms ?? {}) {
                const loc = gl.getUniformLocation(
                    program.compiledProgram,
                    uniform
                );
                program.staticUniforms[uniform](this, loc);
            }

            let offset = 0;
            gl.depthFunc(program.objectDrawArgs?.depthFunc ?? gl.LESS);
            for (const obj of drawables) {
                for (const uniform in program.dynamicUniforms ?? {}) {
                    const loc = gl.getUniformLocation(
                        program.compiledProgram,
                        uniform
                    );
                    program.dynamicUniforms[uniform](this, loc, obj);
                }

                if (obj.visible === false) {
                    // Pretend we drew it already.
                    offset += obj.vertexes.length / 3;
                    continue;
                }

                /// Apply the current texture if relevant
                if (obj.texture && obj.texture.enabled !== false) {
                    const { webglTexture, square } = obj.texture._computed;
                    gl.bindTexture(gl.TEXTURE_2D, webglTexture);

                    if (obj.texture._computed) {
                        if (square) {
                            gl.texParameteri(
                                gl.TEXTURE_2D,
                                gl.TEXTURE_WRAP_S,
                                REPEAT_MAP[obj.texture.repeat_horizontal]
                            );

                            gl.texParameteri(
                                gl.TEXTURE_2D,
                                gl.TEXTURE_WRAP_T,
                                REPEAT_MAP[obj.texture.repeat_vertical]
                            );
                        } else {
                            gl.texParameteri(
                                gl.TEXTURE_2D,
                                gl.TEXTURE_WRAP_S,
                                gl.CLAMP_TO_EDGE
                            );

                            gl.texParameteri(
                                gl.TEXTURE_2D,
                                gl.TEXTURE_WRAP_T,
                                gl.CLAMP_TO_EDGE
                            );
                        }
                    }
                }

                if (program.objectDrawArgs) {
                    const { mode } = program.objectDrawArgs;
                    gl.drawArrays(mode, offset, obj.vertexes.length / 3);
                }

                offset += obj.vertexes.length / 3;
            }

            if (program.sceneDrawArgs) {
                const { mode, depthFunc, count } = program.sceneDrawArgs;
                gl.depthFunc(depthFunc);
                gl.drawArrays(mode, 0, count);
            }
        }

        return;
    }

    update() {
        if (this.readyState !== 'ready') return;

        const { activeScene } = this;
        const now = new Date().getTime();
        const time_t = now - this.lastTime;
        this.lastTime = now;
        if (!activeScene) {
            return;
        }

        activeScene.update(time_t, this);
        for (const obj of activeScene.objects) {
            obj.update && obj.update(time_t, this);
        }
    }
}

function computePositionMatrix(obj: Obj3d): number[] {
    // Calculate the position of all the vertexes for
    // this object.
    const scaleX = obj.scale?.[0] ?? 1.0;
    const scaleY = obj.scale?.[1] ?? 1.0;
    const scaleZ = obj.scale?.[2] ?? 1.0;

    let positionMatrixes = [
        m4.scale(scaleX, scaleY, scaleZ),
        m4.translate(obj.position[0], -obj.position[1], -obj.position[2]),
        m4.rotateX(obj.rotation[0]),
        m4.rotateY(obj.rotation[1]),
        m4.rotateZ(obj.rotation[2]),
        m4.translate(obj.offsets[0], obj.offsets[1], obj.offsets[2]),
    ];

    return m4.combine(positionMatrixes);
}

function computeBbox(obj: Obj3d): bbox {
    const positionMatrix = obj._computed?.positionMatrix ?? [];
    const scaleX = obj.scale?.[0] ?? 1.0;
    const scaleY = obj.scale?.[1] ?? 1.0;
    const scaleZ = obj.scale?.[2] ?? 1.0;

    // Calculate the dimensions
    const min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const max = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];

    // Calculate the bounding box based on the vertexes
    for (let r = 0; r < obj.vertexes.length / 3; r += 1) {
        for (let i = 0; i < 3; i++) {
            const axis = obj.vertexes[r * 3 + i];
            if (min[i] > axis) {
                min[i] = axis;
            }
            if (max[i] < axis) {
                max[i] = axis;
            }
        }
    }

    const width = (max[0] - min[0]) * scaleX;
    const height = (max[1] - min[1]) * scaleY;
    const depth = (max[2] - min[2]) * scaleZ;

    // Calculate the bounding box of the shape
    // based on the rotations being applied.
    let bboxMatrixes = [
        m4.rotateZ(obj.rotation[2]),
        m4.rotateY(obj.rotation[1]),
        m4.rotateX(obj.rotation[0]),
        m4.translate(
            width + obj.offsets[0],
            height + obj.offsets[1],
            depth + obj.offsets[2]
        ),
        m4.scale(scaleX, scaleY, scaleZ),
    ];

    const bboxMatrix = m4.combine(bboxMatrixes);

    // Generate the bounding box property
    // with the absolute final position and
    // dimensions relative to orientation in
    // 3d space.
    return {
        x: positionMatrix[12],
        y: positionMatrix[13],
        z: positionMatrix[14],
        w: bboxMatrix[12],
        h: bboxMatrix[13],
        d: bboxMatrix[14],
    };
}
