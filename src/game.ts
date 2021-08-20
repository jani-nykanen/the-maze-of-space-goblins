import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { State } from "./keyboard.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";



const CLEAR_LOGO_TIME = 30;
const CLEAR_WAIT_TIME = 60;


export class GameScene implements Scene {


    private stage : Stage;

    private pauseMenu : Menu;

    private clearTimer : number;
    private cleared : boolean;


    constructor() {

        const START_INDEX = 13;

        this.stage = new Stage(START_INDEX);

        this.pauseMenu = new Menu(
            [
                new MenuButton("RESUME",
                () => {

                    this.pauseMenu.deactivate();
                }),
                new MenuButton("RESTART",
                event => {

                    this.pauseMenu.deactivate();
                    this.resetTransition(event);
                }),
                new MenuButton("CONTROLS",
                    () => {}
                ),
                new MenuButton("AUDIO: OFF",
                    () => {}),
                new MenuButton("QUIT",
                    event => {

                })
            ]
        );

        this.cleared = false;
        this.clearTimer = 0;
    }


    private nextStage() {

        let index = this.stage.index;
        this.stage = new Stage(index+1);

        this.cleared = false;
        this.clearTimer = 0;
    }


    private reset() {

        this.cleared = false;
        this.clearTimer = 0;

        this.stage.reset();
    }

    
    private resetTransition(event : CoreEvent) {

        event.transition.activate(true, 
            TransitionEffectType.BoxVertical, 1.0/20.0,
            () => this.reset());
    }


    public update(event : CoreEvent) {
      
        if (event.transition.isActive()) return;

        if (this.cleared) {

            if ((this.clearTimer -= event.step) <= 0) {

                event.transition.activate(true, TransitionEffectType.CirleIn,
                    1.0/30.0, () => this.nextStage(), 
                    [0, 0, 0])
                    .setCenter(new Vector2(80, 72));

                return;
            }
        }

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if (event.keyboard.getActionState("start") == State.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        this.stage.update(event);
        if (!this.cleared && this.stage.isStageClear()) {

            this.cleared = true;
            this.clearTimer = CLEAR_LOGO_TIME + CLEAR_WAIT_TIME;
            return;
        }

        if (event.keyboard.getActionState("back") == State.Pressed) {

            this.stage.undo();
        }
        else if (event.keyboard.getActionState("restart") == State.Pressed) {

            this.resetTransition(event);
        }
        // TEMP !
        /*
        else if (event.keyboard.getActionState("fire") == State.Pressed) {

            this.cleared = true;
            this.clearTimer = CLEAR_LOGO_TIME + CLEAR_WAIT_TIME;
        }
        */
    }


    public drawPause(canvas : Canvas) {

        const WIDTH = 88;
        const HEIGHT = 72;
        const MARGIN = 6;

        const COLORS = [
            0b111111,
            0,
            0b000110
        ];

        canvas.setFillColor(0, 0, 0, 0.67);
        canvas.fillRect();

        let x = canvas.width/2 - WIDTH/2;
        let y = canvas.height/2 - HEIGHT/2;

        for (let j = 0; j <= 2; ++ j) {

            canvas.setFillColor(...canvas.data.getRGB222Color(COLORS[j]));
            canvas.fillRect(
                x - MARGIN + j, 
                y - MARGIN + j, 
                WIDTH + MARGIN*2 - j*2, 
                HEIGHT + MARGIN*2 - j*2);
        }

        this.pauseMenu.draw(canvas, 
            x-2, y+1, -8, 13);
    }


    public drawClear(canvas : Canvas) {
        
        canvas.setFillColor(0, 0, 0, 0.67);
        canvas.fillRect();

        let bmp = canvas.data.getBitmap("clear");

        let t = 0;
        if (this.clearTimer > CLEAR_WAIT_TIME) {

            t = (this.clearTimer - CLEAR_WAIT_TIME) / CLEAR_LOGO_TIME; 
        }

        let y = Math.round(canvas.height/2 * t);

        canvas.drawBitmapRegion(bmp, 0, 0,
            bmp.width, bmp.height/2,
            canvas.width/2 - bmp.width/2,
            canvas.height/2 - bmp.height/2 - y);
        canvas.drawBitmapRegion(bmp, 0, bmp.height/2,
            bmp.width, bmp.height/2,
            canvas.width/2 - bmp.width/2,
            canvas.height/2 + y);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);
        canvas.moveTo();

        this.stage.draw(canvas);

        if (this.pauseMenu.isActive()) {

            this.drawPause(canvas);
        }

        if (this.cleared) {

            this.drawClear(canvas);
        }
    }
    
    
    public dispose = () : void => <any> 0;
}
