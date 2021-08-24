import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { negMod } from "./math.js";
import { State } from "./keyboard.js";
import { drawBox } from "./misc.js";


export class MenuButton {


    private text : string;
    private callback : (event : CoreEvent) => void;


    constructor(text : string, callback : (event : CoreEvent) => void) {

        this.text = text;
        this.callback = callback;
    }


    public getText = () : string => this.text;
    public evaluateCallback = (event : CoreEvent) => this.callback(event);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }


    public changeText(newText : string) {

        this.text = newText;
    }
}


export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number;
    private active : boolean;

    private maxLength : number;


    constructor(buttons : Array<MenuButton>) {

        this.buttons = (new Array<MenuButton> (buttons.length))
            .fill(null)
            .map((b, i) => buttons[i].clone());

        this.maxLength = Math.max(
            ...this.buttons.map(b => b.getText().length));

        this.cursorPos = 0;
        this.active = false;
    }


    public activate(cursorPos = -1) {

        if (cursorPos >= 0)
            this.cursorPos = cursorPos % this.buttons.length;

        this.active = true;
    }


    public deactivate() {

        this.active = false;
    }


    public update(event : CoreEvent) {

        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.keyboard.getActionState("up") == State.Pressed) {

            -- this.cursorPos;
        }
        else if (event.keyboard.getActionState("down") == State.Pressed) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            // TODO: Possibly play audio here

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (event.keyboard.getActionState("fire") == State.Pressed ||
            event.keyboard.getActionState("start") == State.Pressed) {

            activeButton.evaluateCallback(event);
        }
    }


    public draw(canvas : Canvas, x : number, y : number,
        xoff = -9, yoff = 12, box = false) {

        if (!this.active) return;

        let str = "";

        let font = canvas.data.getBitmap("font");
        let fontYellow = canvas.data.getBitmap("fontYellow");

        let w = (this.maxLength+1) * (16 + xoff);
        let h = (this.buttons.length * yoff);

        let dx = canvas.width/2 - w / 2 + x;
        let dy = canvas.height/2 - h / 2 + y;

        if (box) {

            drawBox(canvas, x, y, w, h);
            dx -= 2;
        }

        for (let i = 0; i < this.buttons.length; ++ i) {

            str = this.buttons[i].getText();
            if (i == this.cursorPos) {

                str = " " + str;

                canvas.drawBitmapRegion(canvas.data.getBitmap("art1"),
                    176, 8, 8, 8, dx + 2, dy + i * yoff + 3);
            }
            

            canvas.drawText(
                i == this.cursorPos ? fontYellow : font, 
                str, dx, dy + i * yoff, xoff, 0);
        } 
    }


    public isActive = () : boolean => this.active;


    public changeButtonText(index : number, text : string) {

        this.buttons[index].changeText(text);
    }
}
