

export class Vector2 {


    public x : number;
    public y : number


	constructor(x = 0.0, y = 0.0) {
		
		this.x = x;
        this.y = y;
	}

	
	public length = () : number => Math.hypot(this.x, this.y);
	
	
	public normalize(forceUnit = false) : Vector2 {
		
		const EPS = 0.0001;
		
		let len = this.length();
		if (len < EPS) {
			
			this.x = forceUnit ? 1 : 0;
            this.y = 0;

			return this.clone();
		}
		
		this.x /= len;
		this.y /= len;
		
		return this.clone();
	}
	
	
	public clone = () : Vector2 => new Vector2(this.x, this.y);


	public zeros() {

        this.x = 0;
        this.y = 0;
	}


	static normalize = (v : Vector2, forceUnit = false) : Vector2 => v.clone().normalize(forceUnit);
	

	static scalarMultiply = (v : Vector2, s : number) : Vector2 => new Vector2(v.x * s, v.y * s);
	

	static distance = (a : Vector2, b : Vector2) : number => Math.hypot(a.x - b.x, a.y - b.y);


	static direction = (a : Vector2, b : Vector2) : Vector2 => (new Vector2(b.x - a.x, b.y - a.y)).normalize(true);
	

	static add = (a : Vector2, b : Vector2) : Vector2 => new Vector2(a.x + b.x, a.y + b.y);


	static lerp = (a : Vector2, b : Vector2, t : number) : Vector2 => new Vector2(
		(1-t) * a.x + t * b.x,
		(1-t) * a.y + t * b.y);

}
