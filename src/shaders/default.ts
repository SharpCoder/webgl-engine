import type { ProgramTemplate } from '../models';
import { Flatten2D, Repeat2D } from '../models';

const default3DVertexShader = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texcoord;

    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera;

    varying vec4 v_color;
    varying vec2 v_texcoord;
    uniform bool u_transparent;

    void main() {

        if (u_transparent) {
            gl_Position = vec4(0);
        } else {
            gl_Position = u_projection * u_camera * u_worldView * a_position;
        }

        v_color = a_color;
        v_texcoord = a_texcoord;
    }
`;

const default3DFragmentShader = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_texcoord;

    // The texture
    uniform sampler2D u_texture;
    uniform bool u_showtex;
    uniform bool u_transparent;
    uniform float u_opacity;
    
    void main() {
        if (u_showtex) {
            gl_FragColor = texture2D(u_texture, v_texcoord);
        } else {
            gl_FragColor = v_color;
        }

        if (u_transparent) {
            gl_FragColor[3] = 0.0;
        } 
    }
`;

const gl = document.createElement('canvas').getContext('webgl');
export const DefaultShader: ProgramTemplate = {
    name: 'default',
    order: 0,
    objectDrawArgs: {
        depthFunc: gl?.LESS,
        mode: gl?.TRIANGLES,
    },
    vertexShader: default3DVertexShader,
    fragmentShader: default3DFragmentShader,
    attributes: {
        a_color: {
            components: 3,
            type: gl?.UNSIGNED_BYTE,
            normalized: true,
            generateData: (engine) => {
                return new Uint8Array(
                    engine.activeScene.objects.flatMap(
                        (obj) => obj.colors ?? []
                    )
                );
            },
        },
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
        a_texcoord: {
            components: 2,
            type: gl?.FLOAT,
            normalized: false,
            generateData: (engine) => {
                return new Float32Array(
                    engine.activeScene.objects.flatMap((obj) =>
                        obj.texcoords &&
                        obj.texture &&
                        obj.texture.enabled !== false
                            ? obj.texcoords
                            : Flatten2D(
                                  Repeat2D(
                                      [0, 0],
                                      (obj.vertexes.length / 3) * 2
                                  )
                              )
                    )
                );
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
    },
    dynamicUniforms: {
        u_showtex: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniform1i(
                loc,
                obj.texture && obj.texture.enabled !== false ? 1 : 0
            );
        },
        u_transparent: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniform1i(loc, obj.transparent === true ? 1 : 0);
        },
        u_worldView: (engine, loc, obj) => {
            const { gl } = engine;
            gl.uniformMatrix4fv(loc, false, obj._computed.positionMatrix);
        },
    },
};
