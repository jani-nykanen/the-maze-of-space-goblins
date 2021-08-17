import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { ExistingObject } from "./types.js";
import { Vector2 } from "./vector.js";


export class Agent extends ExistingObject {


    private id : number;
    private frameTimer : number;
    private frame : number;

    private pos : Vector2;
    private target : Vector2;
    private renderPos : Vector2;

    private moving : boolean;
    private moveTimer : number;
    private readonly moveTime : number;


    constructor(x : number, y : number, id : number, moveTime : number) {

        super(true);

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = Vector2.scalarMultiply(this.pos, 16);

        this.moveTimer = 0;
        this.moveTime = moveTime;
        this.moving = false;

        this.id = id;
        this.frameTimer = 0;
        if (id >= 2) {

            this.frame = (x % 2 == y % 2) ? 0 : 2;
        }
        else {

            this.frame = 0;
        }
    } 


    private animate(event : CoreEvent) {

        const FRAME_TIME = 8;

        if (this.id >= 2) {

            if ((this.frameTimer += event.step) >= FRAME_TIME) {

                this.frameTimer -= FRAME_TIME;
                this.frame = (this.frame + 1) % 4;
            }
        }
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        this.animate(event);
    }


    public draw(canvas : Canvas) {

        const FACE_SRCX = [0, 8, 0];
        const FACE_SRCY = [0, 0, 8];

        const START_FRAME = [1, 4, 6, 6, 6];

        if (!this.exist) return;

        let palette = 1;
        if (this.id >= 3)
            palette = this.id - 1;

        let bmp = canvas.data.getBitmap("art" + String(palette));

        let flip = Flip.None;

        let px = Math.round(this.renderPos.x);
        let py = Math.round(this.renderPos.y);

        let frame = this.frame == 3 ? 1 : this.frame;
        frame += START_FRAME[this.id];

        canvas.drawBitmapRegion(bmp, 
            frame*16, 0, 16, 16,
            px, py, flip);

        

        if (this.id >= 2) {

            canvas.drawBitmapRegion(
                canvas.data.getBitmap("art1"),
                144 + FACE_SRCX[this.id-2],
                FACE_SRCY[this.id-2],
                8, 8, px + 4, py + 4);
        }
    }
}
