# webgl-engine

WebGL Engine is a typescript library for making games! It is intended as a learning platform to grow my openGL knowledge, 
as such, it's probably only useful for game jams and education. A lot of the concepts come from the wonderful [WebGL Fundamentals](https://webglfundamentals.org/)
but the engine itself is my own construct. I've taken their ideas and adapted it to something a little reusable.

## Installation

Hmm, maybe copy the code and include it? This isn't published anywhere yet.

## Usage

```
import { Engine, Scene, cuboid, rads } from 'webgl-engine';

// In your project, something like this
let engine = new Engine();

// Register the scenes
const DemoScene = new Scene({
    title: 'demo'
});


const RANGE = 2000;
for (let i = 0; i < 300; i++) {
    const positions = [
        Math.random() * RANGE - Math.random() * RANGE,
        Math.random() * RANGE - Math.random() * RANGE,
        Math.random() * RANGE - Math.random() * RANGE,
    ];

    all_positions.push(positions);

    const scale = Math.random() * 50 + 10;
    DemoScene.addObject({
        position: positions,
        vertexes: cuboid(scale, scale, scale),
        dimensions: [scale, scale, scale],
        offsets: [-scale / 2, -scale / 2, -scale / 2],
        properties: {
            rx: Math.random() * 20 + 2,
            ry: Math.random() * 20 + 2,
        },
        colors: Flatten([
            Repeat(Vec3(0, 199, 255), 6),
            Repeat(Vec3(255, 0, 199), 6),
            Repeat(Vec3(199, 255, 0), 6),
            Repeat(Vec3(0, 255, 222), 6),
            Repeat(Vec3(222, 0, 255), 6),
            Repeat(Vec3(255, 222, 0), 6),
        ]),
        update: function (t: number) {
            this.rotation[0] += rads((t * 1) / this.properties.rx);
            this.rotation[1] += rads((-t * 1) / this.properties.ry);
        },
        rotation: [
            rads(Math.random() * 360),
            rads(Math.random() * 360),
            rads(Math.random() * 360),
        ],
    });
}

engine.addScene(DemoScene);


function draw() {
    engine.draw();
    requestAnimationFrame(draw.bind(this));
}

function update() {
    engine.update();
    requestAnimationFrame(update.bind(this));
}

draw();
update();
```

## Contributing

I'm not sure anyone will want to contribute, but if you are so inspired, I'd gladly encourage discussions through
the issues feature on github.

## License

[MIT](https://choosealicense.com/licenses/mit/)
