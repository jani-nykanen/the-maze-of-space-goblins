import { Agent } from "./agent.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { MAP_DATA, MAP_HEIGHT, MAP_WIDTH } from "./mapdata.js";
import { negMod } from "./math.js";
import { Particle } from "./particle.js";
import { StarrySkyRenderer } from "./sky.js";
import { Bitmap, nextObject } from "./types.js";
import { Vector2 } from "./vector.js";


const STATIC_TILES = [1, 8, 9, 10, 11];
const SOLID_TILES = [1, 10];

const FIRST_MONSTER = 3;
const LAST_MONSTER = 6;

const MOVE_TIME = 12;


const PARTICLE_PALETTES = [
    [0b000100, 0b101100, 0b011000],
    [0b000110, 0b101111, 0b011011],
    [0b100100, 0b111110, 0b111000],
    [0b101100, 0b011011, 0b111000],
    [0b111000, 0b111100, 0b111110]
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
    
    private background : StarrySkyRenderer;
    private finalStarTimer : number;

    private checkMade : boolean; // Heh, check mate
    private waitTimer : number;

    private stageClear : boolean;

    private data : Array<number>;

    public readonly width : number;
    public readonly height : number;
    public readonly index : number;


    constructor(index : number) {

        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;

        this.particles = new Array<Particle> ();

        this.index = index;
        this.data = MAP_DATA[index-1];

        // Unnecessary, but takes Closure warnings away
        this.staticLayer = new Array<number> ();
        this.objectLayer = new Array<number> ();
        this.agents = new Array<Agent> ();

        this.staticLayerStack = new Array<Array<number>> ();
        this.objectLayerStack = new Array<Array<number>> ();

        this.checkMade = true;
        this.waitTimer = 0;
        this.stageClear = false;
        this.finalStarTimer = 0;

        this.reset();

        this.background = new StarrySkyRenderer(new Vector2(0, 0.5));

    }


    public reset() {

        this.staticLayer = Array.from(this.data)
            .map(i => (STATIC_TILES.includes(i) ? i : 0));
        this.staticLayerStack.length = 0;
        this.staticLayerStack.push(Array.from(this.staticLayer));

        this.objectLayer = Array.from(this.data)
            .map(i => (i >= 2 && i <= LAST_MONSTER+1 ? (i-1) : 0));
        this.objectLayerStack.length = 0;
        this.objectLayerStack.push(Array.from(this.objectLayer));

        this.agents = new Array<Agent> ();

        this.parseObjects();

        this.checkMade = true;
        this.waitTimer = 0;
        this.stageClear = false;

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
                tid = this.data[i];
                if (tid == 0) continue;

                -- tid;

                switch (tid) {

                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    
                    this.agents.push(new Agent(x, y, tid-1, MOVE_TIME));
                    break;

                default:
                    break;
                }
            }
        }
    }


    private computeNeighbors(x : number, y : number, v : number) : number {

        let dx : number;
        let dy : number;

        let count = 0;
        let k : number;

        for (let j = -1; j <= 1; ++ j) {

            for (let i = -1; i <= 1; ++ i) {

                if (Math.abs(i) == Math.abs(j)) continue;

                dx = negMod(x + i, this.width);
                dy = negMod(y + j, this.height);

                k  = dy * this.width + dx;
                if (this.objectLayer[k] == v ||
                    this.objectLayer[k] == LAST_MONSTER ||
                    (v == LAST_MONSTER && this.objectLayer[k] >= FIRST_MONSTER &&
                    this.objectLayer[k] <= LAST_MONSTER)) {

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
                if (((this.objectLayer[k] == v || 
                    this.objectLayer[k] == LAST_MONSTER || 
                    v == LAST_MONSTER)
                    && arr[k] >= 2)) {

                    return true;
                }
            }
        }

        return false;
    }


    private checkConnections() : boolean {

        let neighborCount = (new Array<number> (this.width*this.height)).fill(0);
  
        let i : number;
        // First round: compute neighbors
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;

                if (this.objectLayer[i] < FIRST_MONSTER ||
                    this.objectLayer[i] > LAST_MONSTER) {

                    // Star
                    if (this.objectLayer[i] == 1 &&
                        this.staticLayer[i] == 8) {

                        this.staticLayer[i] = 0;
                        this.spawnParticles(x*16 + 8, y*16 + 8,
                            0.5, 1.0, 16, PARTICLE_PALETTES[4]);
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


    private toggleWalls(state : boolean) {

        for (let i = 0; i < this.width*this.height; ++ i) {

            if (this.data[i] == 9) 
                this.staticLayer[i] = state ? 10 : 9;

            else if (this.data[i] == 10) 
                this.staticLayer[i] = state ? 9 : 10;
        }
    }


    private checkButtonsAndStars() {

        let toggle = true;
        this.stageClear = true;

        let i : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                i = y * this.width + x;

                if (toggle &&
                    this.staticLayer[i] == 11 &&
                    this.objectLayer[i] == 0) {

                    toggle = false;
                }

                if (this.stageClear &&
                    this.staticLayer[i] == 8) {

                    this.stageClear = false;
                }

                if (!toggle && !this.stageClear) break;
            }
        }

        this.toggleWalls(toggle);
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

        const FINAL_STAR_ANIMATION_SPEED = 1.0 / 12.0;

        this.finalStarTimer = (this.finalStarTimer + FINAL_STAR_ANIMATION_SPEED * event.step) % 1.0;

        this.background.update(event);

        for (let p of this.particles) {

            p.update(event);
        }

        let anyMoving = false;
        for (let a of this.agents) {

            if (a.isMoving()) {

                anyMoving = true;
                break;
            }
        }
        
        let somethingMoved = false;
        let first = true;
        if (!anyMoving && !this.stageClear) {
            
            if (!this.checkMade) {

                this.checkMade = true;
                if (this.checkConnections()) {

                    this.destroy(event);
                    this.waitTimer = MOVE_TIME;
                }
                this.checkButtonsAndStars();
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

        const SRCX = [0, , , , , , , 10];

        let bmps = 
            [canvas.data.getBitmap("art1"),
            canvas.data.getBitmap("art2"),
            canvas.data.getBitmap("art3")
            ];
        let bmp : Bitmap;

        let tid : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.staticLayer[y * this.width + x];
                if (tid == 0) continue;

                bmp = bmps[0];

                switch (tid) {

                case 9:

                    canvas.drawBitmapRegion(bmp, 88, 8, 8, 8,
                        x*16, y*16);
                    canvas.drawBitmapRegion(bmp, 88, 8, 8, 8,
                        x*16+8, y*16, Flip.Horizontal);
                    canvas.drawBitmapRegion(bmp, 88, 8, 8, 8,
                        x*16, y*16+8, Flip.Vertical);
                    canvas.drawBitmapRegion(bmp, 88, 8, 8, 8,
                        x*16+8, y*16+8, Flip.Both);

                    break;

                case 10:

                    canvas.setFillColor(0, 0, 0);
                    canvas.fillRect(x*16, y*16, 16, 16);

                    canvas.setFillColor(85, 0, 170);
                    canvas.fillRect(x*16, y*16+1, 15, 15);

                    canvas.setFillColor(255, 170, 255);
                    canvas.fillRect(x*16, y*16+1, 14, 14);

                    canvas.setFillColor(170, 85, 255);
                    canvas.fillRect(x*16+1, y*16+2, 13, 13);

                    canvas.drawBitmapRegion(bmp, 88, 0, 8, 8,
                        x*16+4, y*16+4);
                        
                    break;

                case 11:

                    canvas.setFillColor(0, 0, 0);
                    canvas.fillRect(x*16+1, y*16+1, 14, 14);

                    canvas.setFillColor(85, 85, 85);
                    canvas.fillRect(x*16+2, y*16+2, 12, 12);

                    canvas.setFillColor(255, 255, 255);
                    canvas.fillRect(x*16+2, y*16+2, 12, 11);

                    canvas.setFillColor(170, 170, 170);
                    canvas.fillRect(x*16+3, y*16+3, 11, 10);

                    canvas.drawBitmapRegion(canvas.data.getBitmap("art2"), 176, 0, 8, 8,
                        x*16+4, y*16+4);
                    canvas.drawBitmapRegion(bmp, 176, 0, 8, 8,
                        x*16+4, y*16+3);

                    break;

                case 8:

                    if (this.isFinalStage()) {

                        bmp = bmps[Math.floor(this.finalStarTimer*3)];
                    }

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


    public draw(canvas : Canvas) {

        this.background.draw(canvas);
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
        if (SOLID_TILES.includes(tid) || (!canTouchStar && tid == 8))
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
        while(!SOLID_TILES.includes(this.staticLayer[i]) &&
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


    public isStageClear = () : boolean => this.stageClear;
    public isFinalStage = () : boolean => this.index == MAP_DATA.length;
}
