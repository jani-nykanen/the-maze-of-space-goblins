import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Dust } from "./dust.js";
import { State } from "./keyboard.js";
import { Stage } from "./stage.js";
import { ExistingObject, nextObject } from "./types.js";
import { Vector2 } from "./vector.js";


export class Agent extends ExistingObject {


    private id : number;
    private frameTimer : number;
    private frame : number;
    private flip : Flip;

    private pos : Vector2;
    private target : Vector2;
    private renderPos : Vector2;

    private moving : boolean;
    private moveTimer : number;
    private readonly moveTime : number;

    private dust : Array<Dust>;
    private dustTimer : number;


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

        this.flip = Flip.None;

        if (this.id == 0) {

            this.dust = new Array<Dust> ();
            this.dustTimer = 0;
        }
    } 


    private move(stage : Stage, event : CoreEvent) {

        if (!this.moving) return;

        if ((this.moveTimer += event.step) >= this.moveTime) {

            this.pos = this.target.clone();
            this.renderPos = Vector2.scalarMultiply(this.pos, 16);

            stage.markObjectTile(this.pos.x, this.pos.y, this.id+1);

            this.moving = false;

            return;
        }

        this.renderPos = Vector2.scalarMultiply(
            Vector2.lerp(this.pos, this.target, this.moveTimer / this.moveTime), 
            16);
    }


    private animate(event : CoreEvent) {

        const FRAME_TIME = 8;

        if (this.id >= 2) {

            if ((this.frameTimer += event.step) >= FRAME_TIME) {

                this.frameTimer -= FRAME_TIME;
                this.frame = (this.frame + 1) % 4;
            }
        }
        else if (this.id == 0 && this.moving) {

            this.flip = Flip.None;
            if (Math.abs(this.target.x - this.pos.x) > 0) {

                this.frame = 2;
                this.flip = this.target.x > this.pos.x ? Flip.None : Flip.Horizontal;
            }
            else if (Math.abs(this.target.y - this.pos.y) > 0) {

                this.frame = this.target.y > this.pos.y ? 0 : 1;
            }
        }
    }


    private updateDust(event : CoreEvent) {

        const DUST_GEN_TIME = 6;
        const DUST_LIFE_TIME = 30;

        const OFFX = [0, 0, -6, 6];
        const OFFY = [-6, 6, 2, 2];

        for (let d of this.dust) {

            d.update(event);
        }

        if (!this.moving) return;

        let dir = this.frame;
        if (this.flip == Flip.Horizontal) dir = 3;

        if ((this.dustTimer += event.step) >= DUST_GEN_TIME) {

            nextObject(this.dust, Dust)
                .spawn(
                    this.renderPos.x + 8 + OFFX[dir], 
                    this.renderPos.y + 8 + OFFY[dir],
                    DUST_LIFE_TIME, 4);

            this.dustTimer -= DUST_GEN_TIME;
        }
    }


    public update(stage : Stage, event : CoreEvent) {

        if (!this.exist) return;

        this.move(stage, event);
        this.animate(event);

        if (this.id == 0) {

            this.updateDust(event);
        }
    }


    public control(stage : Stage, event : CoreEvent) : boolean {

        if (this.moving) return false;

        let dx = 0;
        let dy = 0;

        if (event.keyboard.getActionState("right") & State.DownOrPressed) {

            dx = 1;
        }
        else if (event.keyboard.getActionState("left") & State.DownOrPressed) {

            dx = -1;
        }
        else if (event.keyboard.getActionState("down") & State.DownOrPressed) {

            dy = 1;
        }
        else if (event.keyboard.getActionState("up") & State.DownOrPressed) {

            dy = -1;
        }

        if (dx != 0 || dy != 0) {

            if (stage.isSolid(this.pos.x + dx, this.pos.y + dy, this.id == 0) ||
                (this.id != 0 && !stage.isPlayerInDirection(this.pos.x, this.pos.y, -dx, -dy)))
                return false;

            this.moving = true;
            this.moveTimer = 0;

            this.target = Vector2.add(this.pos, new Vector2(dx, dy));

            stage.markObjectTile(this.pos.x, this.pos.y, 0);

            return true;
        }

        return false;
    }


    public draw(canvas : Canvas) {

        const FACE_SRCX = [0, 8, 0];
        const FACE_SRCY = [0, 0, 8];

        const START_FRAME = [1, 4, 6, 6, 6];

        if (!this.exist) return;

        if (this.id == 0) {

            for (let d of this.dust) {

                d.draw(canvas);
            }
        }

        let palette = 1;
        if (this.id >= 3)
            palette = this.id - 1;

        let bmp = canvas.data.getBitmap("art" + String(palette));

        let px = Math.round(this.renderPos.x);
        let py = Math.round(this.renderPos.y);

        let frame = this.frame == 3 ? 1 : this.frame;
        frame += START_FRAME[this.id];

        canvas.drawBitmapRegion(bmp, 
            frame*16, 0, 16, 16,
            px, py, this.flip);

        if (this.id >= 2) {

            canvas.drawBitmapRegion(
                canvas.data.getBitmap("art1"),
                144 + FACE_SRCX[this.id-2],
                FACE_SRCY[this.id-2],
                8, 8, px + 4, py + 4);
        }
    }


    public isMoving = () : boolean => this.moving;
}
