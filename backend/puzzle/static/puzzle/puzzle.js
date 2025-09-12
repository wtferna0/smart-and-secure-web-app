const boardEl=document.getElementById('board');
const gridSel=document.getElementById('grid');
const startBtn=document.getElementById('startBtn');
const timerEl=document.getElementById('timer');
const movesEl=document.getElementById('moves');
const emailEl=document.getElementById('email');
const msgEl=document.getElementById('message');
const rewardEl=document.getElementById('reward');
let grid=3,tiles=[],emptyIndex=0,moves=0,timer=null,startTs=0,sessionId=null;
function pad(n){return n<10?'0'+n:''+n}function fmt(ms){const s=Math.floor(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60)}
function updateTimer(){const now=performance.now();timerEl.textContent=fmt(now-startTs)}
function setGrid(size){grid=size;boardEl.style.gridTemplateColumns=`repeat(${grid},1fr)`;boardEl.style.gridTemplateRows=`repeat(${grid},1fr)`}
function indexToRC(i){return [Math.floor(i/grid),i%grid]}function rcToIndex(r,c){return r*grid+c}
function isSolvable(arr){const seq=arr.filter(v=>v!==0);let inv=0;for(let i=0;i<seq.length;i++){for(let j=i+1;j<seq.length;j++){if(seq[i]>seq[j])inv++}}if(grid%2===1){return inv%2===0}else{const blankRowFromBottom=grid-Math.floor(arr.indexOf(0)/grid);if(blankRowFromBottom%2===0){return inv%2===1}else{return inv%2===0}}}
function shuffled(){const n=grid*grid;let arr=[...Array(n-1)].map((_,i)=>i+1);arr.push(0);do{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}}while(!isSolvable(arr)||isSolved(arr));return arr}
function isSolved(arr){for(let i=0;i<arr.length-2;i++){if(arr[i]!==i+1)return false}return arr[arr.length-1]===0}
function render(){boardEl.innerHTML='';tiles.forEach((v,idx)=>{const div=document.createElement('div');div.className='tile'+(v===0?' empty':'');if(v!==0)div.textContent=v;div.addEventListener('click',()=>move(idx));boardEl.appendChild(div)});movesEl.textContent=`Moves: ${moves}`}
function move(idx){const [er,ec]=indexToRC(emptyIndex);const [tr,tc]=indexToRC(idx);const isAdj=(er===tr&&Math.abs(ec-tc)===1)||(ec===tc&&Math.abs(er-tr)===1);if(!isAdj)return;[tiles[emptyIndex],tiles[idx]]=[tiles[idx],tiles[emptyIndex]];emptyIndex=idx;moves++;render();if(isSolved(tiles)){finish()}}
async function finish(){clearInterval(timer);const elapsed=performance.now()-startTs;msgEl.textContent='Solved!';try{const res=await fetch('/api/puzzle/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId,moves,time_ms:Math.round(elapsed)})});const data=await res.json();let out='';if(data.awarded_points&&data.awarded_points>0){out+=`You earned ${data.awarded_points} loyalty points.`}if(data.promo_code){out+=(out?' ':'')+`Promo code: ${data.promo_code}`}rewardEl.textContent=out||'Nice work!'}catch(e){rewardEl.textContent='Solved, but could not contact server.'}}
async function start(){rewardEl.textContent='';msgEl.textContent='';moves=0;setGrid(parseInt(gridSel.value,10));try{const res=await fetch('/api/puzzle/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:emailEl.value.trim()||null,grid_size:grid})});const data=await res.json();sessionId=data.session_id}catch(e){sessionId=null}
tiles=shuffled();emptyIndex=tiles.indexOf(0);render();startTs=performance.now();clearInterval(timer);timer=setInterval(updateTimer,250)}
startBtn.addEventListener('click',start);setGrid(3);
