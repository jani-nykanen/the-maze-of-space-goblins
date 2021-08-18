import { Agent } from "./agent.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { MAP_DATA, MAP_HEIGHT, MAP_WIDTH } from "./mapdata.js";
import { negMod } from "./math.js";
import { Particle } from "./particle.js";
import { nextObject } from "./types.js";
import { Vector2 } from "./vector.js";


const STATIC_TILES = [1, 7];

const FIRST_MONSTER = 3;
const LAST_MONSTER = 5;

const MOVE_TIME = 12;


const PARTICLE_PALETTES = [
    [0b000100, 0b101100, 0b011000],
    [0b000110, 0b101111, 0b011011],
    [0b100100, 0b111110, 0b111000],
    [0b111000 ,0b111100, 0b111110]
];


export const enum ItemEffect {

    None = 0,
    PickUpStar = 1,
}


export class Stage {


    private staticLayer : Array<number>;
    private staticLayerStack : Array<Array<number>>;
    private objectLayer : Array<number>;
    private objectLayerStack : Array<Array<number>>;

    private agents : Array<Agent>;
    private particles : Array<Particle>;
    
    private sparkTimes : Array<number>;
    private starPos : number;

    private checkMade : boolean; // Heh, check mate
    private waitTimer : number;

    public readonly width : number;
    public readonly height : number;


    constructor() {

        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;

        this.particles = new Array<Particle> ();

        // Unnecessary, but takes Closure warnings away
        this.staticLayer = new Array<number> ();
        this.objectLayer = new Array<number> ();
        this.agents = new Array<Agent> ();

        this.staticLayerStack = new Array<Array<number>> ();
        this.objectLayerStack = new Array<Array<number>> ();

        this.checkMade = true;
        this.waitTimer = 0;

        this.reset();

        this.sparkTimes = (new Array<number> (10))
            .fill(0)
            .map((v, i) => (Math.PI*2 / 10) * i);

        this.starPos = 0;
    }


    public reset() {

        this.staticLayer = Array.from(MAP_DATA)
            .map(i => (STATIC_TILES.includes(i) ? i : 0));
        this.staticLayerStack.length = 0;
        this.staticLayerStack.push(Array.from(this.staticLayer));

        this.objectLayer = Array.from(MAP_DATA)
            .map(i => (i >= 2 && i <= 6 ? (i-1) : 0));
        this.objectLayerStack.length = 0;
        this.objectLayerStack.push(Array.from(this.objectLayer));

        this.agents = new Array<Agent> ();

        this.parseObjects();

        this.checkMade = true;
        this.waitTimer = 0;

        for (let p of this.particles) {

            p.kill();
        }
    }


    private parseObjects() {

        let tid : number;
        let i : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;
                tid = MAP_DATA[i];
                if (tid == 0) continue;

                -- tid;

                switch (tid) {

                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    
                    this.agents.push(new Agent(x, y, tid-1, MOVE_TIME));
                    break;

                default:
                    break;
                }
            }
        }
    }


    private updateBackground(event : CoreEvent) {

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


    private computeNeighbors(x : number, y : number, v : number) : number {

        let dx : number;
        let dy : number;

        let count = 0;

        for (let j = -1; j <= 1; ++ j) {

            for (let i = -1; i <= 1; ++ i) {

                if (Math.abs(i) == Math.abs(j)) continue;

                dx = negMod(x + i, this.width);
                dy = negMod(y + j, this.height);

                if (this.objectLayer[dy * this.width + dx] == v) {

                    ++ count;
                }
            }
        }
        return count;
    }

    
    private checkIfDestroyable(x : number, y : number, v : number, arr : Array<number>) : boolean {

        // TODO: Repeating code, merge with above somehow?

        let dx : number;
        let dy : number;

        let k : number;

        for (let j = -1; j <= 1; ++ j) {

            for (let i = -1; i <= 1; ++ i) {

                if (Math.abs(i) == Math.abs(j)) continue;

                dx = negMod(x + i, this.width);
                dy = negMod(y + j, this.height);

                k = dy * this.width + dx;
                if (this.objectLayer[k] == v && arr[k] >= 2) {

                    return true;
                }
            }
        }

        return false;
    }


    private checkConnections() : boolean {

        let neighborCount = (new Array<number> (this.width*this.height)).fill(0);
  
        let i : number;
        // For round: compute neighbors
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;

                if (this.objectLayer[i] < FIRST_MONSTER ||
                    this.objectLayer[i] > LAST_MONSTER) {

                    if (this.objectLayer[i] == 1 &&
                        this.staticLayer[i] == 7) {

                        this.staticLayer[i] = 0;
                        this.spawnParticles(x*16 + 8, y*16 + 8,
                            0.5, 1.0, 16, PARTICLE_PALETTES[3]);
                    }

                    continue;
                }
                neighborCount[i] = this.computeNeighbors(x, y, this.objectLayer[i]);
            }
        }

        // Second round: mark to be destroyed
        let destroy : boolean;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;
                if (this.objectLayer[i] < FIRST_MONSTER ||
                    this.objectLayer[i] > LAST_MONSTER)
                    continue;

                if (neighborCount[i] >= 2 ||
                    this.checkIfDestroyable(x, y, 
                        this.objectLayer[i], neighborCount)) {

                    // Go through all agents and find one to be destroyed
                    // (a bit slow, I know)
                    for (let a of this.agents) {

                        a.markForDestruction(x, y);
                    }

                    destroy = true;
                }
            }
        }

        return destroy;
    }


    private spawnParticles(x : number, y : number, 
        minSpeed : number, maxSpeed : number,
        count : number, palette : Array<number>) {

        const LIFE_TIME = 24;

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


    private destroy(event : CoreEvent) {

        let p : Vector2;
        for (let a of this.agents) {

            if (a.kill(this)) {

                p = a.getRenderPos();

                this.spawnParticles(p.x + 8, p.y + 8, 
                    0.5, 1.0, 24, PARTICLE_PALETTES[a.id-2]);
            }
        }
    }


    public update(event : CoreEvent) {

        this.updateBackground(event);

        let anyMoving = false;
        for (let a of this.agents) {

            if (a.isMoving()) {

                anyMoving = true;
                break;
            }
        }
        
        let somethingMoved = false;
        let first = true;
        if (!anyMoving) {
            
            if (!this.checkMade) {

                this.checkMade = true;
                if (this.checkConnections()) {

                    this.destroy(event);
                    this.waitTimer = MOVE_TIME;
                }
            }
            
            if (this.waitTimer <= 0) {

                do {

                    somethingMoved = false;

                    for (let a of this.agents) {

                        if (a.control(this, first, event)) {

                            somethingMoved = true;
                            first = false;
                        }
                    }

                    if (somethingMoved)
                        this.checkMade = false;
                }
                while (somethingMoved);
            }
            else {

                this.waitTimer -= event.step;
            }
        }

        for (let a of this.agents) {

            a.update(this, event);
        }
    }


    private drawStaticLayer(canvas : Canvas,) {

        const SRCX = [0, , , , , , 10];

        let bmp = canvas.data.getBitmap("art1");

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

        let bmp = canvas.data.getBitmap("art1");

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
        
        for (let a of this.agents) {

            a.draw(canvas, this);
        }

        for (let p of this.particles) {

            p.draw(canvas);
        }
    }


    public isSolid(x : number, y : number, canTouchStar = false) : boolean {

        x = negMod(x, this.width);
        y = negMod(y, this.height);

        let tid = this.staticLayer[y * this.width + x];
        if (tid == 1 || (!canTouchStar && tid == 7))
            return true;

        return this.objectLayer[y * this.width + x] > 0; 
    }


    public markObjectTile(x : number, y : number, newValue : number) {

        this.objectLayer[y * this.width + x] = newValue;
    }


    public isPlayerInDirection(x : number, y : number, 
        dirx : number, diry : number) : boolean {

        let sx = x;
        let sy = y;

        let i : number;
        do {

            x += dirx;
            y += diry;

            x = negMod(x, this.width);
            y = negMod(y, this.height);

            i = y * this.width + x;

            if (this.objectLayer[i] == 1)
                return true;
        }
        while(this.staticLayer[i] == 0 &&
            this.objectLayer[i] != 0 &&
            (x != sx || y != sy));

        return false;
    }


    private findNextAgent(id : number) : Agent {

        // First round: only those who exist
        for (let a of this.agents) {

            if (!a.hadBeenReset() && a.id == id && a.doesExist()) {

                return a;
            }
        }

        // Second round: those who do not exist
        for (let a of this.agents) {

            if (!a.hadBeenReset() && a.id == id) {

                return a;
            }
        }

        return null;
    }


    public undo() {

        if (!this.checkMade || this.waitTimer > 0 ||
            this.objectLayerStack.length == 0) return;

        this.objectLayer = Array.from(this.objectLayerStack.pop());
        this.staticLayer = Array.from(this.staticLayerStack.pop());

        let a : Agent;

        let v : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                v = this.objectLayer[y*this.width+x];
                if (v == 0) continue;

                a = this.findNextAgent(v-1);
                if (a == null) continue;

                a.setPos(x, y, true);
            }
        }
    }


    public storeMove() {

        const MAX_LENGTH = 64;

        this.objectLayerStack.push(Array.from(this.objectLayer));
        if (this.objectLayerStack.length > MAX_LENGTH)
            this.objectLayerStack.shift();

        this.staticLayerStack.push(Array.from(this.staticLayer));
        if (this.staticLayerStack.length > MAX_LENGTH)
            this.staticLayerStack.shift();
    }
}
