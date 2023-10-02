import type { ProgramTemplate } from '../models';

const vertexShader = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    
    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera;
    uniform vec3 u_cameraPostiion;
    uniform vec3 u_lightColor;
    uniform vec3 u_lightPosition;
    uniform vec3 u_lightRotation;

    varying vec3 v_normal;
    varying vec3 v_lightColor;
    varying vec3 v_lightPosition;
    varying vec3 v_surfaceToLight;
    varying vec3 v_lightRotation;
    varying vec3 v_surfaceToView;

    void main() {
        gl_Position = u_projection * u_camera * u_worldView * a_position;

        vec3 surfaceWorldPosition = (u_worldView * a_position).xyz;

        v_normal = mat3(u_worldView) * a_normal;
        v_lightColor = u_lightColor;
        v_lightPosition = u_lightPosition;
        v_surfaceToLight = u_lightPosition - surfaceWorldPosition;
        v_lightRotation = u_lightRotation;
        v_surfaceToView = u_cameraPostiion - surfaceWorldPosition;
    }
`;

const fragmentShader = `
    precision mediump float;

    varying vec3 v_normal;
    varying vec3 v_lightColor;
    varying vec3 v_lightPosition;
    varying vec3 v_surfaceToLight;
    varying vec3 v_lightRotation;
    varying vec3 v_surfaceToView;

    uniform bool u_spotlight;
    uniform float u_lowerLimit;
    uniform float u_upperLimit;
    uniform float u_shininess;

    void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightSource = normalize(v_lightPosition);
        vec3 surfaceLightDirection = normalize(v_surfaceToLight);

        if (u_spotlight) {
            vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            vec3 halfVector = normalize(surfaceLightDirection + surfaceToViewDirection);
            float dotFromDirection = dot(surfaceLightDirection, -v_lightRotation);
            float inLight = smoothstep(u_upperLimit, u_lowerLimit, dotFromDirection);
            float specular = inLight * pow(dot(normal, halfVector), u_shininess);
            float light = inLight * dot(normal, surfaceLightDirection);
            gl_FragColor = vec4(v_lightColor, light);
            gl_FragColor.rgb += specular;
        } else {
            float light = dot(normal, lightSource);
            gl_FragColor = vec4(v_lightColor, light);
        }
    }
`;

const gl = document
    .createElement('canvas')
    .getContext('webgl') as WebGLRenderingContext;
export const LightShader: ProgramTemplate = {
    name: 'Omnilight',
    order: 2,
    objectDrawArgs: {
        components: 3,
        depthFunc: gl?.ALWAYS,
        mode: gl?.TRIANGLES,
        blend: true,
    },
    properties: {
        color: [1, 1, 1],
        position: [0, 0, 0],
    },
    vertexShader,
    fragmentShader,
    attributes: {
        a_normal: {
            components: 3,
            type: gl?.FLOAT,
            normalized: false,
            generateData: (engine) => {
                return new Float32Array(engine.activeScene.normals);
            },
        },
        a_position: {
            components: 3,
            type: gl?.FLOAT,
            normalized: false,
            generateData: (engine) => {
                return new Float32Array(engine.activeScene.vertexes);
            },
        },
    },
    staticUniforms: {
        u_projection: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, engine.computed.projectionMatrix);
        },
        u_camera: (engine, loc) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(
                loc,
                false,
                engine.computed.inverseCameraMatrix
            );
        },
        u_cameraPostiion: (engine, loc) => {
            const { gl } = engine;
            const { camera } = engine.activeScene;
            const mat = camera.getMatrix();

            gl.uniform3fv(loc, [mat[12], mat[13], mat[14]]);
        },
    },
    dynamicUniforms: {
        u_worldView: (engine, loc, obj) => {
            const { gl } = engine;
            if (obj._computed)
                gl.uniformMatrix4fv(loc, false, obj._computed.positionMatrix);
        },
    },
};
