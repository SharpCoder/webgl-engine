import type { ProgramTemplate } from '../models';

const fogVertexShader = `
attribute vec4 a_position;

uniform mat4 u_worldView;
uniform mat4 u_projection;
uniform mat4 u_camera;

varying vec3 v_position;

void main() {
    gl_Position = u_projection * u_camera * u_worldView * a_position;
    v_position = (u_camera * u_worldView * a_position).xyz;
}
`;

const fogFragmentShader = `
#define LOG2 1.442695

precision mediump float;

varying vec3 v_position;

// Fog
uniform vec4 u_fogColor;
uniform float u_fogDensity;

void main() {
    float fogDistance = length(v_position) / 100.0;
    float fogAmount = 1.0 - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
    fogAmount = clamp(fogAmount, 0.2, 1.0);
    gl_FragColor = mix(vec4(0, 0, 0, 0), u_fogColor, fogAmount);
}
`;

const gl = document.createElement('canvas').getContext('webgl');
export const FogShader: ProgramTemplate = {
    name: 'fog',
    order: 1,
    objectDrawArgs: {
        components: 3,
        depthFunc: gl?.LEQUAL,
        mode: gl?.TRIANGLES,
    },
    vertexShader: fogVertexShader,
    fragmentShader: fogFragmentShader,
    attributes: {
        a_position: {
            components: 3,
            type: gl?.FLOAT,
            normalized: false,
            generateData: (engine) => {
                return new Float32Array(
                    engine.activeScene.objects.flatMap((obj) => obj.vertexes)
                );
            },
        },
    },
    staticUniforms: {
        u_fogColor: (engine, loc) => {
            const { gl } = engine;
            gl.uniform4fv(loc, engine.settings.fogColor);
        },
        u_fogDensity: (engine, loc) => {
            const { gl } = engine;
            gl.uniform1f(loc, engine.settings.fogDensity);
        },
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
    },
    dynamicUniforms: {
        u_worldView: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, obj._computed.positionMatrix);
        },
    },
};
