const canvas = document.querySelector("canvas");
const staminaGauge = document.querySelector("#staminaGauge");
const scoreDisplay = document.querySelector("#score");
const retryBtn = document.querySelector("#retryButton");

retryBtn.addEventListener("click", (e) => {
   retry();
   retryBtn.classList.add("hidden");
})

function rng(start: number = 0, end: number){
   return Math.floor(start + Math.random() * (end - start));
}

function getRandomRGB(){
   return `rgb(${rng(0, 255)}, ${rng(0, 255)}, ${rng(0, 255)})`;
}

class Canvas{
   private _canvas: HTMLCanvasElement;
   private _ctx: CanvasRenderingContext2D;
   private _bgCol: string = "rgb(255, 255, 255)";

   constructor(canvas: HTMLCanvasElement, option?: {
      bgColor?: string
   }){
      this._canvas = canvas;
      this._ctx = canvas.getContext("2d");

      if(option){
         if(option.bgColor)
            this._bgCol = option.bgColor;
      }
   }

   get height(){ return this._canvas.height; }
   get width(){ return this._canvas.width; }

   clear(){
      this._ctx.fillStyle = this._bgCol;
      this._ctx.clearRect(0, 0, this._canvas.height, this._canvas.width);
   }
}

class Shape{
   protected _size: number;
   protected _rgb: string;

   protected _x: number;
   protected _y: number;

   constructor(obj: {size: number, rgb?: string, x?: number, y?: number}){
      this._size = obj.size;
      this._rgb = obj.rgb ?? "rgb(0, 0, 0)";
      this._x = obj.x ?? 0;
      this._y = obj.y ?? 0;
   }

   // getter
   get size(){ return this._size; }
   get rgb(){ return this._rgb; }

   get x(){ return this._x; }
   get y(){ return this._y; }

   // setter
   set x(x: number){ this._x = x; }
   set y(y: number){ this._y = y; }
   set size(size: number){ this._size = size }
 
   public draw(ctx: CanvasRenderingContext2D){}
   public getRandCoord(x?: number, y?: number){
      this._x = x ?? rng(this.size, canvas.width - this.size);
      this._y = y ?? rng(this.size, canvas.height - this.size);

      return this;
   }
}

class Circle extends Shape{
   constructor(obj: {size: number, rgb?: string, x?: number, y?: number}){
      super(obj);
   }

   public draw(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = this._rgb;
      ctx.arc(this._x, this._y, this._size / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
   }

   static isCollide(c1: Circle, c2: Circle): boolean{
       const dx = c1._x - c2._x;
       const dy = c1._y - c2._y;

       const dist = Math.sqrt(dx * dx + dy * dy);
       
       return dist < c1._size / 2 + c2._size / 2;
   }
}

class Rectangle extends Shape{
    constructor(obj: {size: number, rgb?: string, x: number, y: number}){
       super(obj);
    }
 
   public draw(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = this._rgb;
      ctx.strokeStyle = this._rgb;
      ctx.fillRect(this._x, this._y, this._size, this._size);
   }
}

class Me{
   name: string;
   shape: Shape;
   max_stamina = 100;
   stamina = 100;
   score = 0;

   constructor(name: string, shape: Shape){
      this.name = name;
      this.shape = shape;
   }

   addScore(score: number){
      this.score += score;
      this.max_stamina = 100 + Math.floor(this.score/10000 * 100);
   }

   draw(ctx: CanvasRenderingContext2D){
      this.shape.draw(ctx);

      // add name
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = "20px bold";
      ctx.fillText(this.name, this.shape.x, this.shape.y - this.shape.size / 2 - 3);
   }

   enlarge(size: number){
      this.shape.size += size;
   }

   reset(){
      this.shape.x = 0;
      this.shape.y = 0;
      this.shape.size = 10;
      this.score = 0;
      this.max_stamina = 100;
      this.stamina = 0;
   }
}

class Bot{
   shape: Shape;
   v_x: number;
   v_y: number;

   constructor(shape: Shape, v_x: number = 1, v_y: number = 1){
      this.shape = shape;
      this.v_x  = v_x;
      this.v_y  = v_y;
   }

   private _collide(canvas: HTMLCanvasElement){
      if((this.shape.x + this.shape.size / 2) > canvas.width || this.shape.x < this.shape.size / 2)
         this.v_x = -this.v_x;
      if((this.shape.y + this.shape.size / 2) > canvas.height ||this.shape.y < this.shape.size / 2)
         this.v_y = -this.v_y;

      return this;
   }

   move(canvas: HTMLCanvasElement){
      this._collide(canvas);

      this.shape.x += this.v_x;
      this.shape.y += this.v_y;
   }

   generateRandomBot(minSize: number, maxSize: number){
      this.v_x = rng(-2, 2);
      this.v_y = rng(-2, 2);

      this.shape = new Circle({size: rng(minSize, maxSize), rgb: getRandomRGB()}).getRandCoord();

      return this;
   }

   enlarge(size: number){
      this.shape.size += size;
   }

   draw(ctx: CanvasRenderingContext2D){
      this.shape.draw(ctx);
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.arc(this.shape.x, this.shape.y, this.shape.size /4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();

      // add name
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = "20px bold";
      ctx.fillText("bot", this.shape.x, this.shape.y - this.shape.size / 2 - 3);
   }
}

const me: Me = new Me("John Doe", new Circle({size: 10, rgb: getRandomRGB()}));
const bots: Bot[] = [];
const bits: Shape[] = [];
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
const moveSpeed = 3;
const max_bits = 50;
const max_bots = 10;

let proportional = 0.0;

const min_bit_size = 1 * (1 + proportional);
const max_bit_size = 50 * (1 + proportional);
const min_bot_size = 20 * (1 + proportional);
const max_bot_size = 100 * (1 + proportional);

let isGameOver = false;


for(let iii = 0; iii < max_bots; ++iii)
   bots.push(new Bot(new Circle({
      size: rng(min_bot_size, max_bot_size),
      rgb: getRandomRGB(),
      }).getRandCoord(), rng(-2, 2), rng(-2, 2)));

for(let iii = 0; iii < max_bits; ++iii){
   bits.push(new Circle({
         size: rng(min_bit_size, max_bit_size), 
         rgb: getRandomRGB()}).getRandCoord())
   }

let flags = {
   left: false,
   right: false,
   up: false,
   down: false,
   shift: false
};

function move(){
   const speed = (flags.shift && me.stamina > 0 ? (moveSpeed * 2 * (1 - me.shape.size /  (canvas.width)))  : moveSpeed) * (1 - me.shape.size /  (canvas.width));

   if(flags.up && me.shape.size / 2 - me.shape.y < 0)
      me.shape.y -= speed;
   if(flags.down && me.shape.size / 2 + me.shape.y < canvas.height)
      me.shape.y += speed;
   if(flags.left && me.shape.size / 2 - me.shape.x < 0)
      me.shape.x -= speed;
   if(flags.right && me.shape.size / 2 + me.shape.x < canvas.width)
      me.shape.x += speed;

   if((flags.up || flags.down || flags.left || flags.right) && flags.shift && me.stamina > 0)
      --me.stamina;
   else if(!flags.shift && me.stamina < me.max_stamina)
      ++me.stamina;
}

window.addEventListener("keydown", (event) => {
   switch(event.key){
      case "ArrowDown": { flags.down = true; break; }
      case "ArrowUp": { flags.up = true; break; }
      case "ArrowLeft": { flags.left = true; break; }
      case "ArrowRight": { flags.right  = true; break; }
      case "Shift": { flags.shift  = true; break; }
   }
});

window.addEventListener("keyup", (event) => {
   switch(event.key){
      case "ArrowDown": { flags.down = false; break; }
      case "ArrowUp": { flags.up = false; break; }
      case "ArrowLeft": { flags.left = false; break; }
      case "ArrowRight": { flags.right  = false; break; }
      case "Shift": { flags.shift  = false; break; }
   }
});

function repeatString(str: string, repeat: number){
   let acc = "";
   for(let iii = 0; iii < repeat; ++iii)
      acc += str;
   return acc;
}

function UI(){
   if(me.stamina == 100){
      staminaGauge.classList.remove("red");
      staminaGauge.classList.add("green");
   }
   else if(me.stamina == 0){
      staminaGauge.classList.remove("green");
      staminaGauge.classList.add("red");
   }
   else
      staminaGauge.classList.remove("red", "green");

   staminaGauge.textContent = `${me.stamina}/${me.max_stamina}`;
   scoreDisplay.textContent = `${me.score}`;
}

function triggerGameOver(){
   staminaGauge.textContent = "GAME OVER!";
   ctx.textAlign = "center";
   ctx.font = "100px bold";
   ctx.fillStyle = "red";
   ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
   retryBtn.classList.remove("hidden");
}

function triggerWinning(){
   scoreDisplay.textContent = "∞";
   scoreDisplay.classList.add("green");
   ctx.textAlign = "center";
   ctx.font = "100px bold";
   ctx.fillStyle = "green";
   ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
   retryBtn.classList.remove("hidden");
}

function init(){
   move();

   for(const bot of bots)
      bot.move(canvas);

   ctx.clearRect(0, 0, canvas.width, canvas.height);
   
   // bits being consumed
   for(const bit of bits){
      for(const bot of bots){
         if(Circle.isCollide(bit, bot.shape) && Math.ceil(bot.shape.size / 1.5) >= bit.size){
            bit.getRandCoord();
            bit.size = rng(min_bit_size, max_bit_size);

            bot.enlarge(bit.size / bot.shape.size);
         }
      }

      if(Circle.isCollide(me.shape, bit) && Math.ceil(me.shape.size / 1.5) >= bit.size){
         bit.getRandCoord();
         bit.size = rng(min_bit_size, max_bit_size);
         me.enlarge(bit.size / me.shape.size);
         me.addScore(bit.size);
      } 
   }

   // me and bot consume
   for(const bot of bots){
      // bot consuming another bot
      for(const bot2 of bots){
         // skip same bot
         if(bot.shape.x === bot2.shape.x && bot.shape.y === bot2.shape.y) continue;

         if(Circle.isCollide(bot.shape, bot2.shape)){
            // if bot2 wins
            if(Math.ceil(bot2.shape.size / 1.5) >= bot.shape.size){
               bot.generateRandomBot(min_bot_size, max_bot_size);
               bot2.enlarge(bot.shape.size / bot2.shape.size);
            }
            else if(Math.ceil(bot.shape.size / 1.5) >= bot2.shape.size){
               bot2.generateRandomBot(min_bot_size, max_bot_size);
               bot.enlarge(bot2.shape.size / bot.shape.size);
            }
         }
      }

      if(Circle.isCollide(bot.shape, me.shape)){
         // if me wins
         if(Math.ceil(me.shape.size / 1.5) >= bot.shape.size){
            bot.generateRandomBot(min_bot_size, max_bot_size);
            me.enlarge(bot.shape.size / me.shape.size);
         }
         // if me lose
         else if(Math.ceil(bot.shape.size / 1.5) >= me.shape.size){
            isGameOver = true;
         }
      }
   }

   for(const bit of bits)
      bit.draw(ctx);

   for(const bot of bots)
      bot.draw(ctx);

   me.draw(ctx);

   UI();

   if(!isGameOver && me.score < 1000000)
      requestAnimationFrame(init);   
   else if(isGameOver)
      triggerGameOver();
   else 
      triggerWinning();
}

function retry(){
   me.reset();

   // empties bots and bits
   while(bots.length > 0)
      bots.pop();
   while(bits.length > 0)
      bits.pop();

   isGameOver = false;

   for(let iii = 0; iii < max_bots; ++iii)
      bots.push(new Bot(new Circle({
         size: rng(min_bot_size, max_bot_size),
         rgb: getRandomRGB(),
         }).getRandCoord(), rng(-2, 2), rng(-2, 2)));

   for(let iii = 0; iii < max_bits; ++iii){
      bits.push(new Circle({
            size: rng(min_bit_size, max_bit_size), 
            rgb: getRandomRGB()}).getRandCoord())
      }

   flags = {
      left: false,
      right: false,
      up: false,
      down: false,
      shift: false
   };

   init();
}

init();