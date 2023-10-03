import { Camera } from './camera';
import { createProgram, createShader } from './helpers';
import { Loader } from './loader';
import { isPowerOf2, m4 } from './math';
import type {
    bbox,
    CompiledProgram,
    Obj3d,
    ProgramTemplate,
    Spotlight,
} from './models';
import type { Scene } from './scene';
import { LightShader } from './shaders/light';
import { rads } from './utils';

export type ReadyState = 'initialize' | 'loading' | 'ready' | 'destroyed';
export type EventType = 'keydown' | 'click' | 'mousemove';
export type EngineComputedValues = {
    cameraMatrix: number[];
    inverseCameraMatrix: number[];
    projectionMatrix: number[];
} & Record<string, any>;

const warnings: Record<string, number> = {};

function logWarning(message: string) {
    warnings[message] = warnings[message] ?? 0;
    warnings[message] += 1;

    if (warnings[message] === 4) {
        console.warn(`NO LONGER REPORTING '${message}' because of frequency`);
        return;
    } else if (warnings[message] > 4) {
        return;
    }
    console.warn(message);
}

export class Engine<T> {
    // @ts-ignore
    canvas: HTMLCanvasElement;
    // @ts-ignore
    gl: WebGLRenderingContext;
    id: number;
    lastTime: number;
    scenes: Scene<T>[];
    // @ts-ignore
    activeScene: Scene<T>;
    settings: {
        fov: number;
        zNear: number;
        zFar: number;
        fogColor: [number, number, number, number];
        fogDensity: number;
    };
    properties: Partial<T>;
    readyState: ReadyState;
    /** How many requests to load textures have been initiated. When this is zero, you can safely render. Probably. */
    textureLoadCount: number;
    onReadyChange?: (ready: ReadyState) => void;
    _debugLogs: string;
    loader: Loader;

    /** Values that are computed by the engine. */
    computed: EngineComputedValues;
    private programs: Record<string, CompiledProgram>;

    // Lighting-specific shaders
    private lightShader?: CompiledProgram;

    // Input processes
    keymap: Record<string, boolean>;
    mousebutton: number;
    mousex: number;
    mousey: number;
    mouseClickDuration: number;
    private mouseClickStart: number;

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
            zFar: 3000,
            fogColor: [0.0, 0.0, 0.0, 1],
            fogDensity: 0.088,
        };

        this.mousebutton = -1;
        this.mouseClickStart = -1;
        this.mouseClickDuration = 0;
        this.mousex = window.innerWidth / 2;
        this.mousey = window.innerHeight / 2;
        this.properties = {};
        this._debugLogs = '';
        this.loader = new Loader();
        this.readyState = 'initialize';
        this.textureLoadCount = 0;

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

    private compileProgram(template: ProgramTemplate): CompiledProgram | null {
        const { gl } = this;

        template.properties = template.properties ?? {};
        if (template.init) {
            template.init(template, this);
        }

        const program = createProgram(
            gl,
            template.vertexShader,
            template.fragmentShader
        );

        if (program) {
            return {
                ...template,
                compiledProgram: program,
            };
        }

        return null;
    }

    attachProgram(template: ProgramTemplate) {
        const compiled = this.compileProgram(template);
        if (compiled) {
            this.programs[template.name] = compiled;
        }
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

            if (loc == -1) {
                logWarning(`Could not find attribute ${attribute}`);
                continue;
            }

            if (data.buffer) {
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
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') as WebGL2RenderingContext;

        const { gl } = this;
        // @ts-ignore
        gl.canvas.width = gl.canvas.clientWidth;
        // @ts-ignore
        gl.canvas.height = gl.canvas.clientHeight;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

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
            this.activeScene.onClick?.call(this.activeScene, this);
        }

        if (evt.button === 2) {
            evt.preventDefault();
            evt.stopPropagation();
            this.keymap = {};
        }

        this.mouseClickStart = new Date().getTime();
        this.mouseClickDuration = 0;
    }

    _handleMouseUp(evt: MouseEvent) {
        this.mouseClickDuration = new Date().getTime() - this.mouseClickStart;
        const { activeScene } = this;

        if (activeScene && activeScene.onMouseUp) {
            activeScene.onMouseUp(this);
        }
    }

    debug(str: string) {
        this._debugLogs += str;
        this._debugLogs += '\n';
    }

    addScene(scene: Scene<T>) {
        scene.engine = this;
        this.scenes.push(scene);
        if (!this.activeScene) {
            this.setScene(scene.title);
        }

        if (scene.once) {
            scene.once(this);
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
        // Create the light programs
        const lightProgram = this.compileProgram(LightShader);
        if (lightProgram) {
            this.lightShader = lightProgram;
        }
    }

    async _loadTextures() {
        const { loader, activeScene, gl } = this;

        this.textureLoadCount += 1;

        /***************************************
         * Load all of the texture first
         * *************************************/
        // Collect all the textures
        console.time('load textures');
        const textureMap: Record<string, WebGLTexture | null> = {};

        for (const obj of activeScene.objects) {
            if (obj.texture && obj.texture.enabled !== false) {
                textureMap[obj.texture.uri] = null;
            }
        }

        // Load each texture, async but blocking.
        const promises: Promise<any>[] = [];
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

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            console.timeEnd('load texture into shader');
        }
        console.timeEnd('bind textures');

        /***************************************
         * Handle texture
         * *************************************/
        console.time('load texture buffer');
        for (const obj of activeScene.objects) {
            if (
                obj.texture &&
                obj.texture.uri.length > 0 &&
                obj.texture.enabled !== false
            ) {
                const image = loader.fetch(obj.texture.uri);
                const webglTexture = textureMap[obj.texture.uri];
                if (image && webglTexture) {
                    obj.texture._computed = {
                        image,
                        webglTexture,
                        width: image.width,
                        height: image.height,
                        square:
                            isPowerOf2(image.width) && isPowerOf2(image.height),
                    };
                }
            }
        }

        console.timeEnd('load texture buffer');
        this.textureLoadCount -= 1;
    }

    async _reconfigureBuffers() {
        if (this.readyState === 'destroyed') return;

        console.log('init reconfigure buffers');
        console.time('reconfigure buffers');

        const { gl } = this;
        if (!gl) return;

        await this.setReady('loading');
        await this._loadTextures();

        for (const program of Object.values(this.programs)) {
            this.useProgram(program);

            for (const uniform in program.constantUniforms ?? {}) {
                const loc = gl.getUniformLocation(
                    program.compiledProgram,
                    uniform
                );

                if (
                    loc &&
                    program.constantUniforms &&
                    program.constantUniforms[uniform]
                ) {
                    program.constantUniforms[uniform](this, loc);
                }
            }
        }

        await this.setReady('ready');
        console.timeEnd('reconfigure buffers');
    }

    private loadStaticUniforms(program: CompiledProgram) {
        const { gl } = this;

        for (const uniform in program.staticUniforms ?? {}) {
            const loc = gl.getUniformLocation(program.compiledProgram, uniform);

            if (!loc) {
                logWarning(`Could not find uniform ${uniform}`);
            }

            if (
                program &&
                program.staticUniforms &&
                program.staticUniforms[uniform] &&
                loc
            ) {
                program.staticUniforms[uniform](this, loc);
            }
        }
    }

    private loadDynamicUniforms(program: CompiledProgram, obj: Obj3d) {
        const { gl } = this;
        for (const uniform in program.dynamicUniforms ?? {}) {
            const loc = gl.getUniformLocation(program.compiledProgram, uniform);

            if (!loc) {
                logWarning(`Could not find uniform ${uniform}`);
            }

            if (
                program &&
                program.dynamicUniforms &&
                program.dynamicUniforms[uniform] &&
                loc
            ) {
                program.dynamicUniforms[uniform](this, loc, obj);
            }
        }
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
        } else if (this.textureLoadCount > 0) {
            return;
        }

        if (
            // @ts-ignore
            gl.canvas.width != gl.canvas.clientWidth ||
            // @ts-ignore
            gl.canvas.height != gl.canvas.clientHeight
        ) {
            // @ts-ignore
            gl.canvas.width = gl.canvas.clientWidth;
            // @ts-ignore
            gl.canvas.height = gl.canvas.clientHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        // Calculate the camera matrixes
        const { camera } = this.activeScene;

        // Compute the main values
        this.computed.projectionMatrix = m4.perspective(
            rads(this.settings.fov),
            // @ts-ignore
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

        for (const obj of drawables) {
            if (shouldSkip(this.settings.zFar, camera, obj)) continue;

            obj._computed = {
                positionMatrix: computePositionMatrix(obj),
            };

            // If it has a parent, merge the position matrixes.
            // This should always work, in theory, because of how the queue
            // is constructed (hierarchically).
            if (obj._parent && obj._parent._computed) {
                obj._computed.positionMatrix = m4.combine([
                    obj._parent._computed.positionMatrix,
                    obj._computed.positionMatrix,
                ]);
            }
        }

        for (const obj of drawables) {
            if (shouldSkip(this.settings.zFar, camera, obj)) continue;
            obj._bbox = computeBbox(activeScene, obj);
        }

        const programs = Object.values(this.programs);
        programs.sort((a, b) => a.order - b.order);

        for (const program of programs) {
            this.useProgram(program);
            this.loadStaticUniforms(program);

            if (program.objectDrawArgs?.blend) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }

            gl.depthFunc(program.objectDrawArgs?.depthFunc ?? gl.LESS);
            program.beforeDraw && program.beforeDraw.call(this, this);

            for (const obj of drawables) {
                if (shouldSkip(this.settings.zFar, camera, obj)) continue;

                if (
                    obj &&
                    obj.texture &&
                    (!this.loader.isLoaded(obj.texture.uri) ||
                        obj.texture._computed === undefined)
                ) {
                    await this._loadTextures();
                }

                this.loadDynamicUniforms(program, obj);
                const components = program.objectDrawArgs?.components ?? 3;
                const [offset, length] = activeScene.getOffsetAndLength(
                    'vertex',
                    obj.name
                );

                if (program.objectDrawArgs) {
                    const { mode } = program.objectDrawArgs;
                    if (obj.visible !== false) {
                        gl.drawArrays(
                            mode,
                            offset / components,
                            length / components
                        );
                    }
                }
            }

            if (program.sceneDrawArgs) {
                const { mode, depthFunc, count } = program.sceneDrawArgs;
                gl.depthFunc(depthFunc);
                gl.drawArrays(mode, 0, count);
            }

            program.afterDraw && program.afterDraw.call(this, this);
        }

        // Render the light if it's a 3D scene
        if (this.lightShader && activeScene.components === 3) {
            gl.enable(gl.BLEND);
            const program = this.lightShader;
            this.useProgram(program);
            for (const lightSource of activeScene.lights) {
                if (lightSource.disabled === true) continue;

                this.loadStaticUniforms(program);
                gl.depthFunc(gl.ALWAYS);

                for (const obj of drawables) {
                    if (shouldSkip(this.settings.zFar, camera, obj)) continue;
                    this.loadDynamicUniforms(program, obj);
                    if (obj.normals === undefined) {
                        logWarning(
                            `Not computing light for ${obj.name} because it is missing normals`
                        );
                    }

                    // Add the additional uniforms
                    const uLightColor = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_lightColor'
                    );
                    const uLightPosition = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_lightPosition'
                    );
                    const uSpotlight = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_spotlight'
                    );
                    const uLowerLimit = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_lowerLimit'
                    );
                    const uUpperLimit = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_upperLimit'
                    );
                    const uShininess = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_shininess'
                    );
                    const uLightRotation = gl.getUniformLocation(
                        program.compiledProgram,
                        'u_lightRotation'
                    );

                    const spotlight = lightSource as Spotlight;

                    const isSpotlight =
                        spotlight.rotation !== undefined &&
                        spotlight.lowerLimit !== undefined &&
                        spotlight.upperLimit !== undefined;

                    gl.blendFuncSeparate(
                        gl.SRC_ALPHA,
                        gl.ONE_MINUS_SRC_ALPHA,
                        gl.ZERO,
                        gl.ONE
                    );

                    if (isSpotlight) {
                        const lmat = m4.combine([
                            m4.rotateX(spotlight.rotation[0]),
                            m4.rotateY(spotlight.rotation[1]),
                            m4.rotateZ(spotlight.rotation[2]),
                        ]);

                        gl.uniform3fv(uLightRotation, [
                            -lmat[8],
                            -lmat[9],
                            -lmat[10],
                        ]);
                    }

                    gl.uniform1i(uSpotlight, isSpotlight ? 1 : 0);
                    gl.uniform1f(uShininess, spotlight.shininess ?? 150);
                    gl.uniform1f(uLowerLimit, Math.cos(spotlight.lowerLimit));
                    gl.uniform1f(uUpperLimit, Math.cos(spotlight.upperLimit));
                    gl.uniform3fv(
                        uLightColor,
                        lightSource.color.map((v) => v / 256)
                    );
                    gl.uniform3fv(uLightPosition, [
                        lightSource.position[0],
                        -lightSource.position[1],
                        -lightSource.position[2],
                    ]);

                    const components = program.objectDrawArgs?.components ?? 3;
                    const [offset, length] = activeScene.getOffsetAndLength(
                        'vertex',
                        obj.name
                    );

                    if (obj.visible !== false) {
                        gl.drawArrays(
                            gl.TRIANGLES,
                            offset / components,
                            length / components
                        );
                    }
                }
            }
        }

        return;
    }

    update() {
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
        for (const light of activeScene.lights) {
            light.update && light.update.call(light, time_t, this);
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
        m4.translate(obj.position[0], -obj.position[1], -obj.position[2]),
        m4.rotateX(obj.rotation[0]),
        m4.rotateY(obj.rotation[1]),
        m4.rotateZ(obj.rotation[2]),
    ];

    if (obj.additionalMatrix) {
        positionMatrixes.push([...obj.additionalMatrix]);
    }

    positionMatrixes.push(
        m4.translate(obj.offsets[0], obj.offsets[1], obj.offsets[2])
    );
    positionMatrixes.push(m4.scale(scaleX, scaleY, scaleZ));

    return m4.combine(positionMatrixes);
}

export function shouldSkip(zFar: number, camera: Camera, obj: Obj3d) {
    if (obj.visible === false) return true;
    if (obj.hideWhenFarAway) {
        const dist = Math.hypot(
            obj.position[0] - camera.position[0],
            obj.position[1] - camera.position[1],
            obj.position[2] - camera.position[2]
        );
        if (dist > 1.25 * zFar) {
            return true;
        }
    }
    return false;
}

function computeBbox(activeScene: Scene<unknown>, obj: Obj3d): bbox {
    if (obj.computeBbox !== true)
        return {
            x: 0,
            y: 0,
            z: 0,
            w: 0,
            h: 0,
            d: 0,
        };

    const positionMatrix = obj._computed?.positionMatrix ?? [];
    const scaleX = obj.scale?.[0] ?? 1.0;
    const scaleY = obj.scale?.[1] ?? 1.0;
    const scaleZ = obj.scale?.[2] ?? 1.0;

    // Calculate the dimensions
    const min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const max = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    const [offset, length] = activeScene.getOffsetAndLength('vertex', obj.name);
    const vertexes = activeScene.vertexes.slice(offset, offset + length);

    // Calculate the bounding box based on the vertexes
    for (let r = 0; r < vertexes.length / 3; r += 1) {
        for (let i = 0; i < 3; i++) {
            const axis = vertexes[r * 3 + i];
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
        m4.translate(width, height, depth),
        m4.scale(scaleX, scaleY, scaleZ),
    ];

    const bboxMatrix = m4.combine(bboxMatrixes);

    // Generate the bounding box property
    // with the absolute final position and
    // dimensions relative to orientation in
    // 3d space.
    return {
        x: positionMatrix[12],
        y: -positionMatrix[13],
        z: -positionMatrix[14],
        w: bboxMatrix[12],
        h: -bboxMatrix[13],
        d: -bboxMatrix[14],
    };
}
