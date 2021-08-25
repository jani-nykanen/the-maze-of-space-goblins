import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { TitleScreen } from "./title.js";
import { TransitionEffectType } from "./transition.js";



export class StartIntro implements Scene {


    private waitTimer : number;


    constructor(param : any, event : CoreEvent) {

        const WAIT_TIME = 120;

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/30.0,
            null, [0, 0, 0], 4);

        this.waitTimer = WAIT_TIME;
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) return;

        if ((this.waitTimer -= event.step) <= 0 ||
            event.keyboard.isAnyPressed()) {

            event.transition.activate(true,
                TransitionEffectType.Fade, 1.0/30.0,
                event => event.changeScene(TitleScreen), 
                [0, 0, 0], 4);
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear();
        canvas.drawBitmap(canvas.data.getBitmap("startIntro"), 0, 0);

        canvas.drawBitmapRegion(canvas.data.getBitmap("art1"), 184, 0, 32, 16, canvas.width/2-16, 40);
        canvas.drawBitmapRegion(canvas.data.getBitmap("art1"), 184+32, 0, 32, 16, canvas.width/2-16, 56);
    }


    public dispose = () : any => <any> null;

}
