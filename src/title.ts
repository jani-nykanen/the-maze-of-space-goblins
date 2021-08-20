import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { State } from "./keyboard.js";
import { clamp } from "./math.js";
import { Menu, MenuButton } from "./menu.js";
import { StarrySkyRenderer } from "./sky.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";



export class TitleScreen implements Scene {


    private menu : Menu;
    private startIndex : number;

    private background : StarrySkyRenderer;
    private phase : number;
    private enterTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.startIndex = 1;

        this.menu = new Menu(
            [
                new MenuButton("NEW GAME",
                event => {
                    this.startGame(true, event);
                }),
                new MenuButton("CONTINUE",
                event => {
                    this.startGame(false, event);
                })
            ]
        );

        this.menu.activate();
        this.background = new StarrySkyRenderer();

        this.phase = 0;
        this.enterTimer = 1.0;

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/30.0, null,
            [0, 0, 0], 4);
    }


    private startGame(newGame : boolean, event : CoreEvent) {

        this.startIndex = 1;
        if (!newGame) {
            
            try {

                this.startIndex = clamp(Number(window.localStorage.getItem("jn__spacemonsters_save")), 1, 13);
            }
            catch (e) {

                this.startIndex = 1;
                console.log(e);
            }
        }

        event.transition.activate(true, TransitionEffectType.CirleIn, 1.0/30.0,
            event => event.changeScene(GameScene),
            [0, 0, 0])
            .setCenter(new Vector2(80, 72));
    }


    public update(event : CoreEvent) {

        const ENTER_SPEED = 1.0/60.0;

        this.background.update(event);

        if (event.transition.isActive()) return;

        if (this.phase == 0) {

            this.enterTimer = (this.enterTimer + ENTER_SPEED * event.step) % 1.0;

            if (event.keyboard.getActionState("start") == State.Pressed ||
                event.keyboard.getActionState("fire") == State.Pressed) {

                ++ this.phase;
            }

            return;
        }

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) {

        let logo = canvas.data.getBitmap("logo");

        canvas.clear();
        this.background.draw(canvas);

        let midx = canvas.width/2;

        canvas.drawBitmap(logo, midx - logo.width/2, 16);

        if (this.phase == 0) {

            if (this.enterTimer < 0.5) {

                canvas.drawText(canvas.data.getBitmap("fontYellow"), 
                    "PRESS ENTER", midx, canvas.height-40, -9, 0, true);
            }
        }
        else {

            this.menu.draw(canvas,
                0, 32, -8, 13, true);
        }

        canvas.drawText(canvas.data.getBitmap("font"), 
            "©2021 JANI NYKÄNEN", midx, canvas.height-13, -9, 0, true);
    }


    public dispose = () : any => <any> this.startIndex;
}
