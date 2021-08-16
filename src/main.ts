import { Core } from "./core.js";
import { GameScene } from "./game.js";


const BRICK = [0, 0b100000, 0b110100, 0b111000]; 
const EMPTY = [-1, -1, -1, -1];

const UFO1 = [0, -1, 0b001011, 0b101111]; 
const UFO2 = [0, -1, 0b001011, 0b101010]; 

const ASTEROID1 = [0, -1, 0b101000, 0b111110]; 
const ASTEROID2 = [0, -1, 0b101000, 0b010100]; 

const STAR = [0, 0, 0b101011, 0b111111]; 

const RUBBLE1 = [0, 0b010100, 0b101001, 0b111110];

const ICON1 = [0, -1, 0b111000, 0b111101]; 
const ICON2 = [0, -1, 0b011000, 0b111111]; 

const PSTAR1 = [0, -1, 0b111101, 0b111000];
const PSTAR2 = [0, -1, 0b100100, 0b111000];


const PALETTE = [

    // Line 1
    BRICK, BRICK, UFO1, UFO1, UFO1, UFO1, UFO1, UFO1,
    ASTEROID1, ASTEROID1, STAR, EMPTY, RUBBLE1, RUBBLE1, ICON1, ICON1,
    PSTAR1, PSTAR2, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
    EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,

    // Line 2
    BRICK, BRICK, UFO2, UFO2, UFO2, UFO2, UFO2, UFO2,
    ASTEROID2, ASTEROID2, STAR, EMPTY, RUBBLE1, RUBBLE1, ICON2, EMPTY,
    PSTAR2, PSTAR2, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
    EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
];


window.onload = () => (new Core(160, 144))
    .addAction("left", "ArrowLeft")
    .addAction("up", "ArrowUp")
    .addAction("right", "ArrowRight")
    .addAction("down", "ArrowDown")
    .addAction("fire", "Space")
    .addAction("back", "Backspace")
    .addAction("start", "Enter")
    .run(GameScene, event => {

        event.data.generateBitmapFont("font1", "Arial", 10, 256, 256);
        event.data.generateColorBitmap("art", "art.png", PALETTE);
    });
