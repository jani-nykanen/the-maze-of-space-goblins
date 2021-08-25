import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { StartIntro } from "./startintro.js";


const TEXT =
`WOULD YOU LIKE\nTO ENABLE AUDIO?\nYOU CAN CHANGE\nTHIS LATER.\n\nPRESS ENTER TO\nCONFIRM.`;


export class AudioIntro implements Scene {


    static INITIAL_SAMPLE_VOLUME = 0.50;
    static INITIAL_MUSIC_VOLUME = 0.60;


    private yesNoMenu : Menu;
    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                    event => {

                        event.sound.toggle(true);

                        event.changeScene(StartIntro);
                    }),

                new MenuButton("NO",
                    event => {

                        event.sound.toggle(false);

                        event.changeScene(StartIntro);
                    })
            ]
        );

        this.yesNoMenu.activate(0);

        this.width = Math.max(...TEXT.split('\n').map(s => s.length));
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        canvas.drawText(canvas.data.getBitmap("font"), TEXT,
            16, 8, -8, -4, false);

        this.yesNoMenu.draw(canvas, 0, 40, -8, 12);
    }


    public dispose = () : any => <any>0;

}
