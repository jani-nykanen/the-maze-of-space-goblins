import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { negMod } from "./math.js";



export class StarrySkyRenderer {


    private sparkTimes : Array<number>;
    private starPos : number;
    private scrollSpeed : number;


    constructor(scrollSpeed = 0) {

        this.sparkTimes = (new Array<number> (10))
            .fill(0)
            .map((v, i) => (Math.PI*2 / 10) * i);

        this.starPos = 0;
        this.scrollSpeed = scrollSpeed;
    }


    private darken(canvas : Canvas, i : number, x : number, y : number) {

        let t = (Math.sin(this.sparkTimes[i]) + 1.0)/2.0;
        t = Math.round(t * 0.67 * 3) / 3.0;

        canvas.setFillColor(0, 0, 0, t);
        canvas.fillRect(x, y, 8, 8);
    }


    public update(event : CoreEvent) {

        const SPARK_SPEED = 0.05;

        for (let i = 0; i < this.sparkTimes.length; ++ i) {

            this.sparkTimes[i] = 
                (this.sparkTimes[i] + SPARK_SPEED*event.step) % (Math.PI*2);
        }
        this.starPos = (this.starPos + this.scrollSpeed * event.step) % 160;
    }


    public draw(canvas : Canvas) {

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
}
