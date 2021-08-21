import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";



export class Intro implements Scene {


    private phase : number;


    constructor(param : any, event : CoreEvent) {

        this.phase = Number(param);
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) return;
    }


    public redraw(canvas : Canvas) {

        let font = canvas.data.getBitmap("font");

        canvas.clear();

        if (this.phase == 1) {

            canvas.drawText(font, "THE END",
                canvas.width/2, canvas.height/2 - 8, -8, 0, true);
        }
    }


    public dispose = () : any => <any>null;

}
