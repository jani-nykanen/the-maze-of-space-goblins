import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Intro } from "./intro.js";
import { State } from "./keyboard.js";
import { MAP_DATA } from "./mapdata.js";
import { clamp } from "./math.js";
import { Menu, MenuButton } from "./menu.js";
import { drawBox } from "./misc.js";
import { SoundSource } from "./soundsrc.js";
import { Stage } from "./stage.js";
import { TitleScreen } from "./title.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";



const CLEAR_LOGO_TIME = 30;
const CLEAR_WAIT_TIME = 60;
const START_TIME = 20;
const INITIAL_CONTROL_SCREEN_TIME = 30;


const HINT = "HINT: PRESS BACKSPACE TO UNDO A MOVE. ";


export class GameScene implements Scene {


    private stage : Stage;

    private pauseMenu : Menu;

    private clearTimer : number;
    private cleared : boolean;

    private startTimer : number;
    private hintPos : number;

    private controlScreenActive : boolean;
    private initialControlScreenTimer : number;
    private initialControlScreenPhase : number;


    constructor(param : number, event : CoreEvent) {

        let startIndex = clamp(Number(param), 1, MAP_DATA.length);

        this.stage = new Stage(startIndex);

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
                    () => {

                        this.controlScreenActive = true;
                    }
                ),
                new MenuButton("AUDIO: " + (event.sound.isEnabled() ? "ON " : "OFF") ,
                event => {

                    event.sound.toggle(!event.sound.isEnabled());
                    this.pauseMenu.changeButtonText(3, 
                        "AUDIO: " + (event.sound.isEnabled() ? "ON " : "OFF"));
                }),
                new MenuButton("QUIT",
                    event => {

                    event.transition.activate(true, TransitionEffectType.BoxVertical,
                        1.0/30.0, event => event.changeScene(TitleScreen));
                })
            ]
        );

        this.cleared = false;
        this.clearTimer = 0;
        this.startTimer = START_TIME;

        event.transition.activate(false, TransitionEffectType.CirleIn,
            1.0/30.0, null).setCenter(new Vector2(80, 72));

        this.hintPos = 0;
        this.controlScreenActive = false;

        this.initialControlScreenTimer = 0;
        this.initialControlScreenPhase = startIndex == 1 ? 3 : 0;
    }


    private nextStage() {

        try {

            window.localStorage.setItem("jn__spacemonsters_save", String(this.stage.index+1));
        }
        catch (e) {

            console.log(e);
        }

        let index = this.stage.index;
        this.stage = new Stage(index+1);

        this.cleared = false;
        this.clearTimer = 0;
        this.startTimer = START_TIME;
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
      
        const HINT_POS_SPEED = 0.5;

        if (event.transition.isActive()) return;

        if (this.initialControlScreenPhase > 0) {

            if (this.initialControlScreenPhase == 2) {

                if (event.keyboard.isAnyPressed()) {

                    -- this.initialControlScreenPhase;
                    event.sound.playSequence(SoundSource.Select, 0.60, "square");
                }
            }
            else {

                if ((this.initialControlScreenTimer += event.step) >= INITIAL_CONTROL_SCREEN_TIME) {

                    this.initialControlScreenTimer = 0;
                    if ( (-- this.initialControlScreenPhase) == 0) {

                        this.startTimer = 0;
                    }
                    
                }
            }

            return;
        }

        if (this.startTimer > 0) {

            this.startTimer -= event.step;
            return;
        }

        if (this.controlScreenActive) {

            if (event.keyboard.isAnyPressed()) {

                event.sound.playSequence(SoundSource.Select, 0.60, "square");
                this.controlScreenActive = false;
            }

            return;
        }

        if (this.cleared) {

            this.stage.update(event);

            if ((this.clearTimer -= event.step) <= 0) {

                if (this.stage.isFinalStage()) {

                    event.transition.activate(true, TransitionEffectType.Fade,
                        1.0/60.0, event => event.changeScene(Intro), 
                        [255, 255, 255], 4);
                }
                else {

                    event.transition.activate(true, TransitionEffectType.CirleIn,
                        1.0/30.0, () => this.nextStage(), 
                        [0, 0, 0])
                        .setCenter(new Vector2(80, 72));
                }
            }

            return;
        }

        if (this.pauseMenu.isActive()) {
            
            this.hintPos = (this.hintPos + HINT_POS_SPEED * event.step) % (HINT.length * 8);

            this.pauseMenu.update(event);
            return;
        }

        if (event.keyboard.getActionState("start") == State.Pressed) {

            event.sound.playSequence(SoundSource.Pause, 0.60, "square");
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

            event.sound.playSequence(SoundSource.Choose, 0.60, "square");
            this.stage.undo();
        }
        else if (event.keyboard.getActionState("restart") == State.Pressed) {

            event.sound.playSequence(SoundSource.Select, 0.60, "square");
            this.resetTransition(event);
        }
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


    private drawControlsScreen(canvas : Canvas, y : number) {

        if (this.startTimer <= 0) {

            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect();
        }

        drawBox(canvas, 0, y, 128, 80);

        let font = canvas.data.getBitmap("font");
        let fontYellow = canvas.data.getBitmap("fontYellow");

        canvas.moveTo(0, y);

        canvas.drawText(fontYellow, "CONTROLS:", canvas.width/2, 32, 0, 0, true);
        canvas.drawText(font, "ARROW KEYS: MOVE", canvas.width/2, 32 + 16, 0, 0, true);
        canvas.drawText(font, "BACKSPACE: UNDO", canvas.width/2, 32 + 32, 0, 0, true);
        canvas.drawText(font, "R: RESTART", canvas.width/2, 32 + 48, 0, 0, true);
        canvas.drawText(font, "ENTER: PAUSE", canvas.width/2, 32 + 64, 0, 0, true);

        canvas.moveTo();
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);
        canvas.moveTo();

        this.stage.draw(canvas);

        let fontYellow = canvas.data.getBitmap("fontYellow");

        if (this.startTimer > 0) {

            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect();

            canvas.drawText(fontYellow,
                "STAGE " + String(this.stage.index), 
                canvas.width/2, canvas.height/2-8, 
                0, 0, true);
        }

        let y : number;
        let t : number;

        if (this.controlScreenActive || this.initialControlScreenPhase > 0) {

            y = 0;
            t = this.initialControlScreenTimer / INITIAL_CONTROL_SCREEN_TIME;

            if (this.initialControlScreenPhase == 1) {

                y = -Math.round(t * 144);
            }
            else if (this.initialControlScreenPhase == 3) {

                y = Math.round((1.0 - t) * 144);
            }

            this.drawControlsScreen(canvas, y);
            return;
        }

        if (this.pauseMenu.isActive()) {

            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect();

            this.pauseMenu.draw(canvas, 
                0, 0, 0, 13, true);

            for (let i = 0; i < 2; ++ i) {

                canvas.drawText(fontYellow, HINT, 
                    canvas.width/2 - this.hintPos + HINT.length*8*i, 
                    144-10, 
                    0, 0, true);
            }
        }

        if (this.cleared) {

            this.drawClear(canvas);
        }
    }
    
    
    public dispose = () : void => <any> (this.cleared && this.stage.isFinalStage() ? 2 : 0);
}
