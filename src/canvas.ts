import { DataGenerator } from "./datagen.js";
import { clamp } from "./math.js";
import { Bitmap } from "./types.js";
import { Vector2 } from "./vector.js";


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3,
};


export const getColorString = (r : number, g : number, b : number, a = 1.0) : string =>
    "rgba(" + String(r | 0) + "," + 
        String(g | 0) + "," + 
        String(b | 0) + "," + 
        String(clamp(a, 0.0, 1.0));


export class Canvas {

    public readonly width : number;
    public readonly height : number;
    public readonly data : DataGenerator;

    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private translation : Vector2;


    constructor(width : number, height : number, data : DataGenerator) {

        this.width = width;
        this.height = height;    
        this.data = data;

        this.translation = new Vector2();

        this.ctx = null;
        this.canvas = null;

        this.createHtml5Canvas(width, height);
        window.addEventListener("resize", () => this.resize(
            window.innerWidth, window.innerHeight));
    }


    private createHtml5Canvas(width : number, height : number) {

        let cdiv = document.createElement("div");
        cdiv.setAttribute("style", 
            "position: absolute; top: 0; left: 0; z-index: -1;");

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        this.canvas.setAttribute(
            "style", 
            "position: absolute; top: 0; left: 0; z-index: -1;" + 
            "image-rendering: optimizeSpeed;" + 
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;"
            );
        cdiv.appendChild(this.canvas);
        document.body.appendChild(cdiv);

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.resize(window.innerWidth, window.innerHeight);
    }


    private resize(width : number, height : number) {

        let c = this.canvas;

        // Find the best multiplier for
        // square pixels (unless too small for that)
        let mul = Math.min(
            width / c.width, 
            height / c.height);
        if (mul >= 1.0) {

            mul = Math.floor(mul);
        }

        let totalWidth = c.width * mul;
        let totalHeight = c.height * mul;
        let x = width/2 - totalWidth/2;
        let y = height/2 - totalHeight/2;

        let top = String(y | 0) + "px";
        let left = String(x | 0) + "px";

        c.style.width = String(totalWidth | 0) + "px";
        c.style.height = String(totalHeight | 0) + "px";
        
        c.style.top = top;
        c.style.left = left;
    }


    public moveTo(x = 0.0, y = 0.0) {

        this.translation.x = x | 0;
        this.translation.y = y | 0;
    }


    public move(x : number, y : number) {

        this.translation.x += x | 0;
        this.translation.y += y | 0;
    }


    public clear(r = 0, g = 0, b = 0) {

        this.ctx.fillStyle = getColorString(r, g, b);
        this.ctx.fillRect(0, 0, this.width, this.height);
    }


    public setFillColor(r = 0, g = r, b = g, a = 1.0) {

        let colorStr = getColorString(r, g, b, a);

        this.ctx.fillStyle = colorStr;
    }


    public setGlobalAlpha(a = 1.0) {

        this.ctx.globalAlpha = clamp(a, 0, 1);
    }


    public fillRect(x = 0, y = 0, w = this.width, h = this.height) {

        x += this.translation.x;
        y += this.translation.y;

        this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
    }


    public drawBitmap(bmp : Bitmap, 
        dx : number, dy : number, flip = Flip.None) {

        this.drawBitmapRegion(bmp, 
            0, 0, bmp.width, bmp.height,
            dx, dy, flip);
    }


    public drawBitmapRegion(bmp : Bitmap, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, flip = Flip.None) {

        if (bmp == null || sw <= 0 || sh <= 0) 
            return;

        let c = this.ctx;

        dx += this.translation.x;
        dy += this.translation.y;

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;

        dx |= 0;
        dy |= 0;

        flip = flip | Flip.None;
        
        if (flip != Flip.None) {
            c.save();
        }

        if ((flip & Flip.Horizontal) != 0) {

            c.translate(sw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {

            c.translate(0, sh);
            c.scale(1, -1);
            dy *= -1;
        }

        c.drawImage(bmp, sx, sy, sw, sh, dx, dy, sw, sh);

        if (flip != Flip.None) {

            c.restore();
        }
    }


    public drawText(font : Bitmap, str : string, 
        dx : number, dy : number, 
        xoff = 0.0, yoff = 0.0, center = false) {

        let cw = (font.width / 16) | 0;
        let ch = cw;

        let x = dx;
        let y = dy;
        let c : number;

        if (center) {

            dx -= ((str.length) * (cw + xoff))/ 2.0 ;
            x = dx;
        }

        for (let i = 0; i < str.length; ++ i) {

            c = str.charCodeAt(i);
            if (c == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff);
                continue;
            }

            this.drawBitmapRegion(
                font, 
                (c % 16) * cw, ((c/16)|0) * ch,
                cw, ch, x, y);

            x += cw + xoff;
        }
    }


    public fillCircle(radius : number, centerx : number, centery : number) {

        if (radius <= 0) return;
        
        centerx += this.translation.x;
        centery += this.translation.y;

        let dy : number;
        let w : number;
        for (let y = centery - radius; y < centery + radius; ++ y) {

            dy = y - centery;
            
            w = (Math.sqrt(radius*radius - dy*dy) | 0) * 2;

            this.ctx.fillRect((centerx - w/2) | 0, y | 0, w | 0, 1);
        }
    }


    public fillCircleOutside(r : number, cx : number, cy : number) {

        let c = this.ctx;

        if (r <= 0) {

            c.fillRect(0, 0, this.width, this.height);
            return;
        }
        else if (r*r >= this.width*this.width + this.height*this.height) {

            return;
        }

        if (cx == null)
            cx = this.width / 2;
        if (cy == null)
            cy = this.height / 2;
        
        let start = Math.max(0, cy - r) | 0;
        let end = Math.min(this.height, cy + r) | 0;

        // Areas below and on the top of the circle area
        if (start > 0)
            c.fillRect(0, 0, this.width, start);
        if (end < this.height)
            c.fillRect(0, end, this.width, this.height - end);

        let dy : number;
        let px1 : number;
        let px2 : number;
        
        for (let y = start; y < end; ++ y) {

            dy = y - cy;

            if (Math.abs(dy) >= r) {

                c.fillRect(0, y | 0, this.width | 0, 1);
                continue;
            }

            px1 = Math.round(cx - Math.sqrt(r*r - dy*dy));
            px2 = Math.round(cx + Math.sqrt(r*r - dy*dy));

            // Left side
            if (px1 > 0)
                c.fillRect(0, y | 0, px1 | 0, 1);
            // Right side
            if (px2 < this.width)
                c.fillRect(px2 | 0, y | 0, (this.width-px1) | 0, 1);
        }
    }
}
