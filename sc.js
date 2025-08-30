"use strict"

const gameManager = {
    game: null,
    timerId: null,
    isPaused: false,
    isGameRunning: false,
    isResetting: false, // New property to "freeze" the game during animation
    gameLoop: null,
};

// --- Web Audio API Setup for Low-Latency Sound ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const soundBuffers = {};

function loadSound(url, name) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            soundBuffers[name] = audioBuffer;
        })
        .catch(e => console.error(`Error loading sound "${name}":`, e));
}

function playSound(name) {
    if (!soundPrizn || !soundBuffers[name] || audioCtx.state === 'suspended') {
        return;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffers[name];
    source.connect(audioCtx.destination);
    source.start(0);
}

// Pre-load all game sounds
loadSound('./sound/collect.mp3', 'collect');
loadSound('./sound/move.mp3', 'move');
loadSound('./sound/end.mp3', 'gameOver');
loadSound('./sound/broke-half.mp3', 'lifeDown');
loadSound('./sound/broke-full.mp3', 'eggBroke');
loadSound('./sound/chicken-reset.mp3', 'reset'); // New sound for the reset


const button = document.querySelectorAll('.button');
const palz = document.querySelectorAll('.palz-el');
const basket = document.querySelectorAll('.basket-el');

let palzPosition = 0 //положение волка
let soundPrizn = true

// This function can now be called by any sound button
function soundClik(){
   soundPrizn = !soundPrizn
}

button.forEach(element => {
   element.addEventListener("mousedown", buttonDown);
   element.addEventListener("mouseup", buttonUp);
});

function buttonDown(e) {
   e.stopPropagation();
   const n = +e.target.attributes.date.value
   e.target.classList.add('down')
   createWolf(n)
}

function buttonUp(e) {
   e.stopPropagation();
   e.target.classList.remove('down')
}

//определение положения волка
function createWolf(n) {
   delBasket(n)
   switch (n) {
      case 0:
      case 1:
         delWolf(0,1)
         break;
      case 2:
      case 3:
         delWolf(1,0)
         break;
      default:
         break;
   }
   palzPosition = n
}
//перерисовка корзины
function delBasket(n){
   basket[palzPosition].classList.remove('active')
   basket[n].classList.add('active')
}
//перерисовка волка
function delWolf(active, noActive){
    
   palz[active].classList.add('active')
   palz[noActive].classList.remove('active')
}

// яйцо
class Egg {
   block = `
   <pre class="egg">
 _  
(_)</pre>
   `;
}
// лоток с яйцами
class EggBlok {
   blok=[]
   classListy=""
   constructor(n, list){
      for (let index = 0; index < n; index++) {
         this.blok.push(new Egg()) ;
      }
      this.classListy = list;
   }
   
   creatEggBlok() {
      let bl = ''
      this.blok.forEach(element => {
         bl += element.block
      });
      const eggBlok = document.querySelector('.wrapper')
      const bloki = `<div class="egg_blok ${this.classListy}">
         ${bl}
      </div>`
      eggBlok.insertAdjacentHTML("beforeend", bloki);
   }
}
// поле из 4-х лотков
class Pole {
   pole = []
   constructor(){
      for (let index = 0; index < 4; index++) {
         this.pole.push(new EggBlok(5,`egg_blok_${index}` )) ;
      }
   }
   activatePole(){
      this.pole.forEach(element => {
        element.creatEggBlok()
      });
   }
}

class Game {
  // palzPosition = 0 //положение волка
   total = 0 // счетчик очков
   counter = 0 // счетчик тактов
   sped = 1000 // переодичность обновления кадра
   interval = 5 // интервал появления новых яиц
   maxEgg = 5 //максимальное количество яиц на лотках
   zeroingSped = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400, 6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 7600, 7700, 7800, 7900, 8000, 8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800, 8900, 9000, 9100, 9200, 9300, 9400, 9500, 9600, 9700, 9800, 9900, 9999]
   countZeroingSped = 0 // номер в массиве
   upSped = [5, 10, 15, 20, 0]
   countUpSped = 0 // номер в массиве upSped
   predNewEgg = 4 //номер лотка на котором было предыдущее яйцо
   eggTotal = 0 //колличество яиц на лотках
   brokenEgg = 0 // счетчик разбитых яиц
   gameStart = false // признак запущенной игры
   endGameSign = false //признак окончания игры
   trays = [] //массив описания расположения яиц на лотках
   bartInterval = 0 // временной интервал появления зайца
   timeHare = 0 //время до появления зайца
   priznHare = false // признак появления зайца
   
   upTotal(){
      ++this.total;

      // Check if the score is a reset milestone
      const scoreRemainder = this.total % 1000;
      // MODIFIED LINE
      if (this.total > 0 && (scoreRemainder === 200 || scoreRemainder === 500) && this.brokenEgg > 0) {
         this.playResetAnimation();
      }
   }
   upCounter(){
      ++this.counter
   }
   getTotal(){
      return this.total
   }
  
   //обнуление состояния лотков с яйцами
   traysNull() {
      this.trays = [
         [0,0,0,0,0,0],
         [0,0,0,0,0,0],
         [0,0,0,0,0,0],
         [0,0,0,0,0,0],
      ]
      this.eggTotal = 0
   }
   //расчет интервала до появления зайца
   calcHareInterval(){
      this.bartInterval = Math.floor(Math.random()*25 + 5)*1000
   }
   //таймер до появления зайца
   calcTimeHare(){
      this.timeHare += this.sped
   }

   startGame(n,l){
      this.total = 0
      this.eggBrokenDel() // удаления индикации разбитых яиц
      this.traysNull() // обнуление состояния лотков с яйцами
      createWolf(n) // отрисовка положения волка
      this.newTrays(l) // добавление яйца 
      this.gameStart = true
      this.endGameSign = false
   }

   async gameA() {
      score.rendering(this.getTotal());
      this.rendering();
      
      const restartOccurred = await this.checkTrays();
      
      // If a soft restart happened, report it and exit this function.
      if (restartOccurred) {
         return true; 
      }

      this.offsetTrays();
      this.upCounter();
      this.dvigSound();
      this.calcTimeHare();
      this.checkingAppearanceHare();
      
      return false; // Report that a normal frame occurred.
   }
   //проверка появления зайца
   checkingAppearanceHare(){
      if (this.bartInterval <= this.timeHare){
         this.priznHare = true
         let blok= document.querySelector(`.bart`)
         blok.classList.add('active')
         this.timeHare = 0
         //время на которое появляется заяц
         const tim = Math.floor(Math.random()*5 + 3)*1000
         this.calcHareInterval()
         setTimeout(()=>{
            this.priznHare = false
            let blok= document.querySelector(`.bart`)
            blok.classList.remove('active')
            this.timeHare = 0
         },tim)
      }
   }

   //проверка на окончание игры. проверка колличества разбитых яиц
   endGame(){
      if (this.brokenEgg >= 3) { 
         this.endGameSound()
         this.endGameSign = true
         this.gameStart = false
         }
   }
   //новое яйцо
   newTrays(lot){
      this.trays[lot][0] = 1
      ++this.eggTotal
   }

   //смещение яиц на лотках
   offsetTrays(){
      for (let index = 0; index < 4; index++) {
         this.trays[index].pop()
         this.trays[index].unshift(0)
      }
   }

   async checkTrays(){
      let restartOccurred = false; // Flag to report a restart

      for (let index = 0; index < 4; index++) {
         if (this.trays[index][5] === 1) { // An egg reaches the end
            if ( +palzPosition === +index){
               this.upTotal();
               this.upSound();
               score.rendering(this.getTotal());
            } else { 
               this.eggBroken(); 
               if (this.priznHare) {
                  await this.eggFallen(+index);
               } else {
                  // This uses the eggBrokeSound and showStaticBrokenEgg from your file
                  this.eggBrokeSound();
                  await this.showStaticBrokenEgg(+index);
               }

               if (this.brokenEgg >= 3) {
                  this.endGame(); 
                  return false; // Game Over, not a restart
               }

               // Soft restart logic from your original design
               this.traysNull(); 
               const randomEggPos = Math.floor(Math.random() * 4);
               this.newTrays(randomEggPos);
               this.rendering();
               restartOccurred = true; // Set flag
            }
            --this.eggTotal;
         }
      }
      return restartOccurred; // Return the status
   }

   // отрисовка количества разбитых яиц
   eggBroken(){
      let blok= document.querySelector(`.egg_broken_blok`)
      let n = Math.floor(this.brokenEgg)
         if (this.priznHare) {
            if(blok.children[n].classList.contains('anime')){
               blok.children[n].classList.remove('anime')
               blok.children[n].classList.add('active')
            } else {
               blok.children[n].classList.add('anime')
            }
            this.brokenEgg += 0.5
         }else{
            if(blok.children[n].classList.contains('anime')){
               blok.children[n].classList.remove('anime')
               blok.children[n].classList.add('active')
               if ((n+1)<3){blok.children[n+1].classList.add('anime')}
            } else {
               blok.children[n].classList.add('active')
            }
            ++this.brokenEgg
         }
   }
    // удаление количества разбитых яиц
   eggBrokenDel(){
      let blok= document.querySelectorAll(`.egg_broken`)
      for (let i = 0; i< blok.length; i++) {
         blok[i].classList.remove('active')
         blok[i].classList.remove('anime')
         blok[i].style.display = ''; // Reset display style for animation
      }
      this.brokenEgg = 0
   }

   //SOUNDS
   upSound() {
      playSound('collect');
   }
   dvigSound() {
      playSound('move');
   }
   endGameSound() {
      playSound('gameOver');
   }
   animeChickenSound() {
      playSound('lifeDown');
   }

   // проверка счетчика, добавление нового яйца или изменение состояния
   controlCounter(){
	  if (this.endGameSign) return;
	   
      if (this.counter % this.interval === 0 && this.eggTotal < this.maxEgg){
         let n = 0
         let quantity = true
         do {
            n = Math.floor(Math.random() * 4)
            if (n === this.predNewEgg) {continue}
            quantity = this.trays[n].some((element) => element === 1)
            if (!quantity) {
               let r = 0
               for (let i = 0; i < this.trays.length; i++){
                  if (this.trays[i].some((element) => element === 1)) { r++}
               }
               if (r > 2) {quantity = true }
            } else {quantity = false}
         } while ( quantity );
         this.predNewEgg = n
         this.newTrays(n)
      }
      if (this.total === this.upSped[this.countUpSped]) {
         --this.interval 
         ++this.countUpSped
         
      } else if (this.total > this.upSped[this.countUpSped]) {
         if ( this.sped > 500)  { this.sped -= 5}
      }
      if (this.total === this.zeroingSped[this.countZeroingSped]) {
         ++this.countZeroingSped
         this.sped = 1000
      }
   }
   // проверка счетчика, добавление нового яйца или изменение состояния
   controlCounterB(){
	  if (this.endGameSign) return;
	   
      if (this.counter % this.interval === 0 && this.eggTotal < this.maxEgg){
         let n = 0
         do {
            n = Math.floor(Math.random() * 4)
         } while (n === this.predNewEgg);
         this.predNewEgg = n
         this.newTrays(n)
      }
      if (this.total === this.upSped[this.countUpSped]) {
         --this.interval 
         ++this.countUpSped
      }else if (this.total > this.upSped[this.countUpSped]) {
         if ( this.sped > 400)  { this.sped -= 10}
      }
      if (this.total === this.zeroingSped[this.countZeroingSped]) {
         ++this.countZeroingSped
         this.sped = 1000
      }
   }

   // отрисовка яиц на лотках
   rendering(){
      for (let er = 0; er < 4; er++){
         let egg_blok= document.querySelector(`.egg_blok_${er}`)
         for (let i = 0; i < 5; i++){
            if (this.trays[er][i] === 1) {
               egg_blok.children[i].classList.add('active')
            } else {
               egg_blok.children[i].classList.remove('active')
            }
         }
      }
   }

   // выбор анимации в случае падения яйца
   async eggFallen(n){
      
      switch (n) {
         case 0:
         case 1:
            await this.eggFallenAnime ('.chicken_blok_left')
         break;
         case 2:
         case 3:
            await this.eggFallenAnime ('.chicken_blok_right')
         break;
         
         default:
            break;
      }
      
   }
   //анимация в случае падения яйца
   async eggFallenAnime (elem) {
      this.animeChickenSound()
      const blok = document.querySelector(elem);
      let rr=0
      let result = true
      let promise = new Promise((resolve, reject) =>
         setTimeout(function eggRend() {
            if (rr<5) {
               blok.children[rr].classList.add('active')
            }
            if (rr>0) {
               blok.children[rr-1].classList.remove('active') 
            }
            rr++
            if (rr===6) {
               return resolve(false)
            }
            setTimeout(eggRend, 500);
         }, 100)
      ) 
      result = await promise; 
   }

   //отрисовка игра А или игра Б
   gameVisible(n){
      const blok = document.querySelector('.game_blok');
      if (n==="a") {
         blok.children[0].classList.add('active')
         blok.children[1].classList.remove('active')
      } else if (n==="b") {
         blok.children[1].classList.add('active')
         blok.children[0].classList.remove('active')
      }
   }
   
   eggBrokeSound() {
      playSound('eggBroke');
   }

   async showStaticBrokenEgg(n) {
      // Determine which side the egg fell on (left or right)
      const side = (n < 2) ? '.chicken_blok_left' : '.chicken_blok_right';
      // Select the static broken egg sprite, which is the first child div
      const brokenEggSprite = document.querySelector(`${side}>div:nth-child(1)`);

      if (brokenEggSprite) {
         brokenEggSprite.classList.add('active');

         // Return a promise that resolves after the sprite has been shown for 1 second
         return new Promise(resolve => {
            setTimeout(() => {
               brokenEggSprite.classList.remove('active');
               resolve();
            }, 1000); // Display time: 1000ms = 1 second
         });
      }
   }   
   
   // A helper function to create a delay
   async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   // A function to play the new sound
   resetSound() {
      playSound('reset');
   }

// In sc.js, inside the Game class, REPLACE this entire function

   async playResetAnimation() {
      // 1. Signal the game to freeze
      gameManager.isResetting = true; 
      this.resetSound();

      const brokenEggs = document.querySelectorAll('.egg_broken.active, .egg_broken.anime');
      const beepInterval = 550; // You can adjust this value to match your sound

      // 2. Perform the blinking animation using a series of delays
      for (let i = 1; i <= 5; i++) {
         if (i % 2 === 1) { // On beeps 1, 3, 5 -> hide chickens
            brokenEggs.forEach(egg => egg.style.display = 'none');
         } else { // On beeps 2, 4 -> show chickens
            brokenEggs.forEach(egg => egg.style.display = 'block');
         }
         // This 'await' forces the code to actually wait here before continuing
         await this.delay(beepInterval); 
      }

      // 3. Clean up and signal the game to unfreeze
      this.eggBrokenDel(); 
      gameManager.isResetting = false; 
   }
}
// цифры для счета
class Scoreboard {
   numbers = {
      0: [1,1,1,0,1,1,1],
      1: [0,0,1,0,0,1,0],
      2: [0,1,1,1,1,0,1],
      3: [0,1,1,1,0,1,1],
      4: [1,0,1,1,0,1,0],
      5: [1,1,0,1,0,1,1],
      6: [1,1,0,1,1,1,1],
      7: [0,1,1,0,0,1,0],
      8: [1,1,1,1,1,1,1],
      9: [1,1,1,1,0,1,1],
      10: [0,0,0,0,0,0,0]
   }
   // отрисовка счета
   rendering(n) {
      let arir = []
      if (n==0) {
         arir = [10,10,10,0]
      } else {
         let str = n.toString()
         arir = str.split('')
      }
      
      const score = document.querySelectorAll('.blok-z');
      let sch = arir.length - 1
      for (let i = 0; i < arir.length; i++){
         for (let index = 0; index < 7; index++) {
            if (this.numbers[arir[i]][index] == 1) {
               score[sch].children[index].classList.add('active')
            } else {
               score[sch].children[index].classList.remove('active')
            }
         }
         sch--
      }
   }
   // добавление элементов в дом
creatScoreBlok() {
    const asciiSegments = [
        '|', // Segment 1
        '_', // Segment 2
        '|', // Segment 3
        '_', // Segment 4
        '|', // Segment 5
        '|', // Segment 6
        '_'  // Segment 7
    ];

    let singleDigitHTML = '';
    asciiSegments.forEach((segment, index) => {
        // Create a <pre> tag for each segment with a unique class
        singleDigitHTML += `<pre class="z-el z-el-${index + 1}">${segment}</pre>`;
    });

    let fullScoreboardHTML = '<div class="blok-blok-z">';
    for (let i = 0; i < 4; i++) {
        // Create 4 digits
        fullScoreboardHTML += `<div class="blok-z">${singleDigitHTML}</div>`;
    }
    fullScoreboardHTML += '</div>';

    const blok = document.querySelector('.wrapper');
    blok.insertAdjacentHTML("beforeend", fullScoreboardHTML);
}
}

const blokEgg = new Pole()
blokEgg.activatePole()

const score = new Scoreboard()
score.creatScoreBlok()

class ControlButtons {
    constructor() {
        this.buttons = [
            // Game Mode Buttons (Right Side)
            { text: '(GAME A)', date: 0, block: 'gamemode' },
            { text: '(GAME B)', date: 1, block: 'gamemode' },
            { text: '(MENU)  ', date: 5, block: 'gamemode' },
            // Control Buttons (Left Side)
            { text: '(PAUSE) ', date: 2, block: 'control' },
            { text: '(SOUND) ', date: 3, block: 'control' },
            { text: '(SHARE) ', date: 4, block: 'control' },
        ];
    }

    create() {
        const container = document.querySelector('.wrapper');
        
        const gameModeBlock = document.createElement('div');
        gameModeBlock.className = 'gamemode-button-blok';
        
        const controlBlock = document.createElement('div');
        controlBlock.className = 'control-button-blok';

        this.buttons.forEach(btnData => {
            const btnElement = document.createElement('pre');
            btnElement.className = 'ascii-button';
            btnElement.setAttribute('date', btnData.date);
            btnElement.textContent = btnData.text;
            
            btnElement.addEventListener("mousedown", this.buttonDown.bind(this));
            btnElement.addEventListener("mouseup", this.buttonUp);

            if (btnData.block === 'gamemode') {
                gameModeBlock.appendChild(btnElement);
            } else {
                controlBlock.appendChild(btnElement);
            }
        });

        container.appendChild(gameModeBlock);
        container.appendChild(controlBlock);
    }

// In sc.js, inside the ControlButtons class, REPLACE this entire method:

    buttonDown(e) {
        e.stopPropagation();
        const n = e.target.getAttribute('date');
        const targetButton = e.target;
        targetButton.classList.add('down');

        switch (n) {
            case '0': // Game A
            case '1': // Game B
                if (gameManager.isGameRunning) return;

                const startGameLogic = () => {
                    gameManager.isGameRunning = true;
                    gameManager.isPaused = false;
                    gameManager.game = new Game();
                    
                    const randomWolfPos = Math.floor(Math.random() * 4);
                    const randomEggPos = Math.floor(Math.random() * 4);
                    
                    gameManager.game.startGame(randomWolfPos, randomEggPos);
                    gameManager.game.gameVisible(n === '0' ? 'a' : 'b');

                    // --- FINAL, STABLE GAME LOOP ---
                    let lastUpdateTime = 0;
                    let accumulatedTime = 0;

                    gameManager.gameLoop = async (timestamp) => {
                        if (!gameManager.isGameRunning) return;

                        if (!lastUpdateTime) {
                            lastUpdateTime = timestamp;
                        }

                        const deltaTime = timestamp - lastUpdateTime;
                        lastUpdateTime = timestamp;
                        accumulatedTime += deltaTime;

						if (accumulatedTime >= gameManager.game.sped) {
							// MODIFIED LINE
							if (!gameManager.isPaused && !gameManager.isResetting) {
								const restartOccurred = await gameManager.game.gameA();
								if (!restartOccurred) {
									if (n === '0') {
										gameManager.game.controlCounter();
									} else {
										gameManager.game.controlCounterB();
									}
								}
							}
							// This reset prevents all "catch-up" and "fast move" bugs.
							accumulatedTime = 0;
						}

                        if (gameManager.game.endGameSign) {
                            gameManager.isGameRunning = false;
                            document.querySelector('.ascii-button[date="2"]').textContent = '(PAUSE) ';
                            return;
                        }
                        
                        gameManager.timerId = requestAnimationFrame(gameManager.gameLoop);
                    };
                    
                    document.querySelector('.ascii-button[date="2"]').textContent = '(PAUSE) ';
                    gameManager.timerId = requestAnimationFrame(gameManager.gameLoop);
                };

                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().then(() => {
                        console.log("AudioContext resumed successfully.");
                        startGameLogic();
                    });
                } else {
                    startGameLogic();
                }
                break;
            
            case '2': // Pause
                if (!gameManager.isGameRunning) return;
                gameManager.isPaused = !gameManager.isPaused;
                targetButton.textContent = gameManager.isPaused ? '(RESUME)' : '(PAUSE) ';
                break;
            
            case '3': // Sound
                soundClik();
                targetButton.textContent = soundPrizn ? '(SOUND) ' : '(MUTE)';
                break;

			case '4': // Share
				if (shareModal.style.display === 'block') {
					closeShareModal();
				} else {
					openShareModal();
				}
				break;
            
            case '5': // Menu
                if (menuModal.style.display === 'block') {
                    closeMenuModal();
                } else {
                    openMenuModal();
                }
                break;
        }
    }

    buttonUp(e) {
        e.stopPropagation();
        e.target.classList.remove('down');
    }
}

const controlButtons = new ControlButtons();

// --- MODAL LOGIC ---
const shareModal = document.getElementById('share-modal');
const closeModalButton = document.getElementById('close-modal-button');
const saveConfirmationMessage = document.getElementById('save-confirmation');

function openShareModal() {
    if (shareModal) {
        shareModal.style.display = 'block';
    }
}

function closeShareModal() {
    if (shareModal) {
        shareModal.style.display = 'none';
    }
}

async function handleShare(platform) {
    const score = gameManager.game ? gameManager.game.total : 0;
    const line1 = `I just scored ${score} in PalMoji Game!`;
    const line2 = 'Can you beat it?';
    const shareText = `${line1}\n${line2}`;
    const shareUrl = window.location.href;
    const gameWrapper = document.querySelector('.wrapper');
    
    let cloneForScreenshot = null; // Define here to access in the finally block

    if (saveConfirmationMessage) {
        saveConfirmationMessage.style.display = 'none';
    }

    if (navigator.share && platform === undefined) {
        try {
            shareModal.style.visibility = 'hidden';

            // --- Start of new cloning logic ---
            cloneForScreenshot = gameWrapper.cloneNode(true);
            cloneForScreenshot.classList.add('screenshot-mode');
            cloneForScreenshot.style.position = 'absolute';
            cloneForScreenshot.style.left = '0px';
            cloneForScreenshot.style.top = '-9999px'; // Position the clone off-screen
            cloneForScreenshot.style.transform = 'none'; // Set the clone to its native size
            document.body.appendChild(cloneForScreenshot);
            // --- End of new cloning logic ---

            const canvas = await html2canvas(cloneForScreenshot, { scale: 2, useCORS: true, backgroundColor: null });
            
            shareModal.style.visibility = 'visible'; // Show modal again after screenshot

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'palmoji-game-score.png', { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'PalMoji Game',
                    text: `${shareText}\n\n${shareUrl}`,
                    files: [file],
                });
                closeShareModal();
            }
        } catch (err) {
            shareModal.style.visibility = 'visible';
            console.error("Web Share with file failed.", err);
        } finally {
            // --- Cleanup: Always remove the cloned node ---
            if (cloneForScreenshot) {
                cloneForScreenshot.remove();
            }
        }
        return;
    }

    // Fallback logic doesn't need cloning
    const fallbackFullText = `${shareText}\n\n${shareUrl}`;
    const encodedFallbackText = encodeURIComponent(fallbackFullText);
    let fallbackUrl = '';

    switch (platform) {
        case 'x':
            fallbackUrl = `https://x.com/intent/post?text=${encodedFallbackText}`;
            break;
        case 'farcaster':
            fallbackUrl = `https://warpcast.com/~/compose?text=${encodedFallbackText}`;
            break;
        case 'telegram':
            fallbackUrl = `https://t.me/share/url?text=${encodedFallbackText}`;
            break;
        case 'copy':
            try {
                await navigator.clipboard.writeText(fallbackFullText);
                if (saveConfirmationMessage) {
                    saveConfirmationMessage.textContent = 'Copied to clipboard!';
                    saveConfirmationMessage.style.display = 'block';
                    setTimeout(() => { saveConfirmationMessage.style.display = 'none'; }, 4000);
                } else {
                    alert('Copied to clipboard!');
                }
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                alert('Could not copy to clipboard.');
            }
            return;
    }

    if (fallbackUrl) {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        closeShareModal();
    }
}

async function handleSave() {
    const gameWrapper = document.querySelector('.wrapper');
    const score = gameManager.game ? gameManager.game.total : 0;

    let cloneForScreenshot = null; // Define here for access in the finally block

    if (saveConfirmationMessage) {
        saveConfirmationMessage.style.display = 'none';
    }

    try {
        shareModal.style.visibility = 'hidden';

        // --- Start of new cloning logic ---
        cloneForScreenshot = gameWrapper.cloneNode(true);
        cloneForScreenshot.classList.add('screenshot-mode');
        cloneForScreenshot.style.position = 'absolute';
        cloneForScreenshot.style.left = '0px';
        cloneForScreenshot.style.top = '-9999px'; // Position the clone off-screen
        cloneForScreenshot.style.transform = 'none'; // Set the clone to its native size
        document.body.appendChild(cloneForScreenshot);
        // --- End of new cloning logic ---

        const canvas = await html2canvas(cloneForScreenshot, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
        });

        shareModal.style.visibility = 'visible';

        const link = document.createElement('a');
        link.download = `palmoji-game-score-${score}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (saveConfirmationMessage) {
            saveConfirmationMessage.textContent = 'Score image saved!';
            saveConfirmationMessage.style.display = 'block';

            setTimeout(() => {
                saveConfirmationMessage.style.display = 'none';
            }, 5000);
        } else {
            alert('Score image saved!');
        }

    } catch (err) {
        console.error('Failed to save image:', err);
        alert('Could not save the score image.');
    } finally {
        // --- Cleanup: Always remove the cloned node from the DOM ---
        if (cloneForScreenshot) {
            cloneForScreenshot.remove();
        }
    }
}


// --- Event Listeners for Share Modal ---
closeModalButton.addEventListener('click', closeShareModal);

document.getElementById('share-generic').addEventListener('click', (e) => {
    e.preventDefault();
    handleShare();
});
document.getElementById('share-x').addEventListener('click', (e) => {
    e.preventDefault();
    handleShare('x');
});
document.getElementById('share-farcaster').addEventListener('click', (e) => {
    e.preventDefault();
    handleShare('farcaster');
});
document.getElementById('share-telegram').addEventListener('click', (e) => {
    e.preventDefault();
    handleShare('telegram');
});
document.getElementById('share-copy').addEventListener('click', (e) => {
    e.preventDefault();
    handleShare('copy');
});
document.getElementById('save-score').addEventListener('click', (e) => {
    e.preventDefault();
    handleSave();
});

// --- NEW MENU MODAL LOGIC ---
const menuModal = document.getElementById('menu-modal');
const closeMenuModalButton = document.getElementById('close-menu-modal-button');
const exitGameButton = document.getElementById('exit-game-button');

function openMenuModal() {
    if (menuModal) {
        menuModal.style.display = 'block';
    }
}

function closeMenuModal() {
    if (menuModal) {
        menuModal.style.display = 'none';
    }
}

function exitGame() {
    window.location.reload();
}

closeMenuModalButton.addEventListener('click', closeMenuModal);
exitGameButton.addEventListener('click', exitGame);

// The event listener for 'openShareFromMenuButton' is now gone.

// Replace the accordion logic in your sc.js file with this:

const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const item = header.parentElement;

        if (item.classList.contains('active')) {
            // Closing the accordion
            content.style.maxHeight = null;
            item.classList.remove('active');
        } else {
            // Close all other accordions first
            document.querySelectorAll('.accordion-item.active').forEach(activeItem => {
                activeItem.classList.remove('active');
                activeItem.querySelector('.accordion-content').style.maxHeight = null;
            });

            // Open this accordion
            item.classList.add('active');
            
            // Force a reflow to ensure proper measurement
            content.style.maxHeight = 'none';
            const height = content.scrollHeight;
            content.style.maxHeight = null;
            
            // Use requestAnimationFrame to ensure the measurement is accurate
            requestAnimationFrame(() => {
                content.style.maxHeight = height + "px";
            });
        }
    });
});


controlButtons.create();


// --- Keyboard Controls ---
window.addEventListener('keydown', (e) => {
    e.preventDefault();

    const key = e.key.toLowerCase();
    let newPosition = -1;

    const absoluteKeyMap = {
        'q': 0,
        's': 1,
        'p': 2,
        'l': 3
    };

    if (absoluteKeyMap.hasOwnProperty(key)) {
        newPosition = absoluteKeyMap[key];
    } else {
        const directionalMoveMap = {
            'arrowleft': [[2, 0], [3, 1]],
            'arrowright': [[0, 2], [1, 3]],
            'arrowup': [[1, 0], [3, 2]],
            'arrowdown': [[0, 1], [2, 3]]
        };

        if (directionalMoveMap[key]) {
            const move = directionalMoveMap[key].find(m => m[0] === palzPosition);
            if (move) {
                newPosition = move[1];
            }
        }
    }

    if (newPosition !== -1) {
        createWolf(newPosition);

        const targetButton = document.querySelector(`.button[date="${newPosition}"]`);
        if (targetButton) {
            targetButton.classList.add('down');
        }
    }
});

window.addEventListener('keyup', (e) => {
    button.forEach(btn => {
        btn.classList.remove('down');
    });
});

createWolf(Math.floor(Math.random() * 4));

// --- Responsive Resizing Logic ---

function handleResize() {
  const wrapper = document.querySelector('.wrapper');
  
  const baseWidth = 912;
  const baseHeight = 442;

  const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

  const scaleX = windowWidth / baseWidth;
  const scaleY = windowHeight / baseHeight;

  let scale = Math.min(scaleX, scaleY)
  scale = Math.min(scale, 1);

  wrapper.style.transform = `scale(${scale})`;
  
  wrapper.style.left = `${(windowWidth - (baseWidth * scale)) / 2}px`;
  wrapper.style.top = `${(windowHeight - (baseHeight * scale)) / 2}px`;
  wrapper.style.opacity = '1';
}

window.addEventListener('resize', handleResize);
window.addEventListener('load', handleResize);