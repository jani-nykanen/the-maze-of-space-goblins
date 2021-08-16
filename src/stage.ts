import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { DataGenerator } from "./datagen.js";
import { MAP_DATA, MAP_HEIGHT, MAP_WIDTH } from "./mapdata.js";
import { clamp, negMod } from "./math.js";
import { Particle } from "./particle.js";
import { nextObject } from "./types.js";
import { Vector2 } from "./vector.js";


const STATIC_TILES = [1];


export const enum ItemEffect {

    None = 0,
    PickUpStar = 1,
}


export class Stage {


    private staticLayer : Array<number>;

    private particles : Array<Particle>;
    
    private sparkTimes : Array<number>;
    private starPos : number;


    public readonly width : number;
    public readonly height : number;


    constructor() {

        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;

        this.staticLayer = Array.from(MAP_DATA)
            .map(i => (STATIC_TILES.includes(i) ? i : 0));

        this.sparkTimes = (new Array<number> (10))
            .fill(0)
            .map((v, i) => (Math.PI*2 / 10) * i);

        this.parseObjects();

        this.particles = new Array<Particle> ();

        this.starPos = 0;
    }


    private parseObjects() {

        let tid : number;
        let i : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;
                tid = MAP_DATA[i];
                if (tid == 0) continue;

                switch (tid) {

                default:
                    break;
                }
            }
        }
    }


    public update(event : CoreEvent) {

        const SPARK_SPEED = 0.05;
        const STAR_MOVE_SPEED = 0.5;

        for (let i = 0; i < this.sparkTimes.length; ++ i) {

            this.sparkTimes[i] = 
                (this.sparkTimes[i] + SPARK_SPEED*event.step) % (Math.PI*2);
        }
        this.starPos = (this.starPos + STAR_MOVE_SPEED * event.step) % 160;

        for (let p of this.particles) {

            p.update(event);
        }
    }


    private drawStaticLayer(canvas : Canvas,) {

        const SRCX = [0];

        let bmp = canvas.data.getBitmap("art");

        let tid : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.staticLayer[y * this.width + x];
                if (tid == 0) continue;

                switch (tid) {

                // ...

                default:
                    canvas.drawBitmapRegion(bmp, 
                        SRCX[tid-1]*16, 0, 
                        16, 16,
                        x*16, y*16);
                    break;
                }
            }
        }
    }


    private darken(canvas : Canvas, i : number, x : number, y : number) {

        let t = (Math.sin(this.sparkTimes[i]) + 1.0)/2.0;
        t = Math.round(t * 0.67 * 3) / 3.0;

        canvas.setFillColor(0, 0, 0, t);
        canvas.fillRect(x, y, 8, 8);
    }


    private drawBackground(canvas : Canvas) {

        const SMALL_STARS = [[1, 1], [4, 5], [14,6], [3, 11], [12, 12], [7, 13], [16, 13], [5, 17], [9, 0]];
        const BIG_STARS = [[8, 3], [9, 9], [14, 16], [16, 3], [19, 9]];

        let bmp = canvas.data.getBitmap("art");

        let x : number;
        let y : number;

        let p = Math.round(this.starPos);
        
        canvas.setFillColor(0);
        for (let i = 0; i < SMALL_STARS.length; ++ i) {

            x = SMALL_STARS[i][0]*8;
            y = -8 + negMod(SMALL_STARS[i][1]*8 + p, 160);

            canvas.drawBitmapRegion(bmp, 80, 0, 8, 8, x, y);

            this.darken(canvas, i, x, y);
        }

        for (let i = 0; i < BIG_STARS.length; ++ i) {

            x = BIG_STARS[i][0]*8;
            y = -8 + negMod(BIG_STARS[i][1]*8 + p, 160);

            canvas.drawBitmapRegion(bmp, 80, 8, 8, 8, x, y);

            this.darken(canvas, i, x, y);
        }
    }


    public draw(canvas : Canvas) {

        this.drawBackground(canvas);
        this.drawStaticLayer(canvas);

        for (let p of this.particles) {

            p.draw(canvas);
        }
    }


    private spawnParticles(x : number, y : number, 
        minSpeed : number, maxSpeed : number,
        count : number, palette : Array<number>) {

        const LIFE_TIME = 30;

        let pos = new Vector2(x, y);
        let speed : Vector2;
        let angle : number;
        let color : number;

        for (let i = 0; i < count; ++ i) {

            angle = Math.random() * Math.PI * 2;

            speed = Vector2.scalarMultiply(
                new Vector2(Math.cos(angle), Math.sin(angle)),
                Math.random() * (maxSpeed - minSpeed) + minSpeed);

            color = palette[(Math.random() * palette.length) | 0];

            nextObject(this.particles, Particle)
                .spawn(pos, speed, LIFE_TIME, color,
                    (1 + Math.random() * 2) | 0);
        }
    }

}
