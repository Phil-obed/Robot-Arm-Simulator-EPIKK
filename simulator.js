
// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════

// ROBOT LIBRARY-------------------
const ROBOT_LIB = [
  {
    id: 'edu2',
    name: '2-Axis Edu Arm',
    category: 'Educational',
    description: 'Simple 2-joint planar arm for learning FK basics.',
    dof: 2,
    links: [200, 160],
    limits: [[-170,170],[-150,150]],
    types: ['R','R'],
    baseHeight: 40,
    eeType: 'open-gripper',
    mass: '0.8 kg',
    payload: '0.2 kg',
    repeatability: '±2.0 mm',
    reach: '360 mm',
    color: '#a0c4ff',
  },
  {
    id: 'scara4',
    name: 'SCARA 4-DOF',
    category: 'Industrial',
    description: 'Selective compliance arm for pick-and-place tasks.',
    dof: 4,
    links: [225, 175, 0, 130],
    limits: [[-170,170],[-145,145],[-180,180],[-360,360]],
    types: ['R','R','P','R'],
    baseHeight: 60,
    eeType: 'suction-cup',
    mass: '24 kg',
    payload: '5 kg',
    repeatability: '±0.02 mm',
    reach: '400 mm',
    color: '#ffd6a5',
  },
  {
    id: 'hobby5',
    name: '5-Axis Hobby Arm',
    category: 'Hobby',
    description: 'Servo-driven desktop arm, ideal for prototyping.',
    dof: 5,
    links: [120, 110, 90, 70, 50],
    limits: [[-180,180],[-90,90],[-120,120],[-180,180],[-90,90]],
    types: ['R','R','R','R','R'],
    baseHeight: 50,
    eeType: 'claw-gripper',
    mass: '1.2 kg',
    payload: '0.5 kg',
    repeatability: '±1.0 mm',
    reach: '440 mm',
    color: '#caffbf',
  },
  {
    id: 'cobot6',
    name: '6-DOF Cobot',
    category: 'Collaborative',
    description: 'Safe human-robot collaborative arm with torque sensing.',
    dof: 6,
    links: [180, 220, 170, 120, 90, 60],
    limits: [[-170,170],[-90,90],[-135,135],[-170,170],[-120,120],[-360,360]],
    types: ['R','R','R','R','R','R'],
    baseHeight: 80,
    eeType: 'two-finger-gripper',
    mass: '33.5 kg',
    payload: '10 kg',
    repeatability: '±0.03 mm',
    reach: '840 mm',
    color: '#ffadad',
  },
  {
    id: 'delta3',
    name: '3-Axis Delta',
    category: 'Industrial',
    description: 'High-speed parallel robot for packaging lines.',
    dof: 3,
    links: [180, 160, 140],
    limits: [[-60,60],[-60,60],[-60,60]],
    types: ['R','R','R'],
    baseHeight: 200,
    eeType: 'suction-cup',
    mass: '15 kg',
    payload: '2 kg',
    repeatability: '±0.1 mm',
    reach: '480 mm',
    color: '#bdb2ff',
  },
  {
    id: 'welding6',
    name: '6-DOF Welding Arm',
    category: 'Industrial',
    description: 'Heavy-duty arm optimised for arc welding paths.',
    dof: 6,
    links: [280, 260, 200, 140, 110, 70],
    limits: [[-185,185],[-95,155],[-180,75],[-400,400],[-120,120],[-400,400]],
    types: ['R','R','R','R','R','R'],
    baseHeight: 100,
    eeType: 'welding-torch',
    mass: '250 kg',
    payload: '30 kg',
    repeatability: '±0.06 mm',
    reach: '1060 mm',
    color: '#f4a261',
  },
];

// EE type icon map (unicode / text fallback)
const EE_ICONS = {
  'open-gripper':     '⟂',
  'suction-cup':      '◎',
  'claw-gripper':     '⌥',
  'two-finger-gripper':'⊓',
  'welding-torch':    '⌁',
};
// ROBOT LIBRARY  end -------------------

const DEF = {
  dof:6,
  links:[180,220,170,120,90,60],
  limits:[[-170,170],[-90,90],[-135,135],[-170,170],[-120,120],[-360,360]],
  types:['R','R','R','R','R','R']
};
const T = {
  dof:6,
  links:[...DEF.links],
  limits:DEF.limits.map(l=>[...l]),
  types:[...DEF.types],
  angles:[0,0,0,0,0,0],
  home:[0,0,0,0,0,0],
  ee:{x:0,y:0,z:0},
  pts3:[],
};
const S = {
  grid:true, gridSize:500, wire:false, transp:false,
  marks:true, eef:true, sphere:false, torque:true,
  trail:false, snap:false, smooth:true
};

let poses = [];
let selectedJoint = -1;
let trailPts = [];
let targetMode = false;
let target3D = null;
let isDark = true;

// ═══════════════════════════════════════════════
// PANELS
// ═══════════════════════════════════════════════
const PO={L:true,R:true,B:true,Sett:false};
function togP(k){PO[k]=!PO[k];applyP(k)}
function closeP(k){PO[k]=false;applyP(k)}
function applyP(k){
  const id={L:'pL',R:'pR',B:'pB'}[k];
  const tid={L:'tL',R:'tR',B:'tB'}[k];
  if(id)document.getElementById(id).classList.toggle('off',!PO[k]);
  if(tid)document.getElementById(tid).classList.toggle('on',PO[k]);
}
function toggleS(){
  PO.Sett=!PO.Sett;
  document.getElementById('pS').classList.toggle('off',!PO.Sett);
  document.getElementById('sbtn').classList.toggle('on',PO.Sett);
  if(PO.Sett&&PO.R)closeP('R');
}
function toggleTheme(){
  isDark=!isDark;
  document.body.classList.toggle('light',!isDark);
}

// ═══════════════════════════════════════════════
// BUILD UI
// ═══════════════════════════════════════════════
function buildLinks(){
  const el=document.getElementById('linkF');el.innerHTML='';
  for(let i=0;i<T.dof;i++){
    const d=document.createElement('div');d.className='frow';
    d.setAttribute('data-tip',`Length of link ${i+1} in mm`);
    d.innerHTML=`<span class="flbl">L${i+1}</span>
    <input class="inp inp-sm" type="number" min="10" max="600" value="${T.links[i]||100}"
      oninput="T.links[${i}]=parseFloat(this.value)||100">
    <span style="font-size:10px;color:var(--faint);margin-left:2px">mm</span>`;
    el.appendChild(d);
  }
}

function buildJTypes(){
  const el=document.getElementById('jtypeF');el.innerHTML='';
  for(let i=0;i<T.dof;i++){
    const l=T.limits[i];
    const d=document.createElement('div');d.style.marginBottom='10px';
    d.innerHTML=`<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span class="flbl" style="min-width:26px">J${i+1}</span>
      <select class="inp" style="width:106px" onchange="T.types[${i}]=this.value">
        <option value="R"${T.types[i]==='R'?' selected':''}>Revolute</option>
        <option value="P"${T.types[i]==='P'?' selected':''}>Prismatic</option>
      </select>
      <button class="sb" onclick="setA(${i},0)" data-tip="Zero J${i+1}" style="margin-left:auto">0</button>
    </div>
    <div class="inp2">
      <input class="inp" type="number" value="${l[0]}" placeholder="Min°" data-tip="Minimum angle limit"
        oninput="T.limits[${i}][0]=parseFloat(this.value)">
      <input class="inp" type="number" value="${l[1]}" placeholder="Max°" data-tip="Maximum angle limit"
        oninput="T.limits[${i}][1]=parseFloat(this.value)">
    </div>`;
    el.appendChild(d);
  }
}

function buildSliders(){
  const el=document.getElementById('jsliders');el.innerHTML='';
  for(let i=0;i<T.dof;i++){
    const l=T.limits[i],a=T.angles[i];
    const near=Math.abs(a)>Math.abs(l[1])*.85;
    const sel=selectedJoint===i;
    const d=document.createElement('div');
    d.className=`jrow${sel?' selected':''}`;d.id=`jr${i}`;
    d.onclick=()=>selectJoint(i);
    d.innerHTML=`<div class="jtop">
      <span class="jname"><span class="jdot"></span>J${i+1} · ${T.types[i]==='R'?'Revolute':'Prismatic'}</span>
      <span class="jval${near?' lim':''}" id="jv${i}">${a.toFixed(1)}°</span>
    </div>
    <div class="jsw">
      <div class="spair">
        <button class="sb" onclick="event.stopPropagation();stepJ(${i},-1)" data-tip="-1°">−</button>
      </div>
      <input type="range" class="${near?'lim':''}${sel?' selected-range':''}" id="js${i}"
        min="${l[0]}" max="${l[1]}" step="0.5" value="${a}"
        oninput="setA(${i},parseFloat(this.value))">
      <div class="spair">
        <button class="sb" onclick="event.stopPropagation();stepJ(${i},1)" data-tip="+1°">+</button>
      </div>
      <input class="jnum" type="number" id="jn${i}" value="${a.toFixed(1)}"
        onchange="setA(${i},parseFloat(this.value))">
    </div>
    ${S.torque?`<div class="torque-row" id="tq${i}">
      <span class="torque-label">TORQUE</span>
      <div class="torque-wrap"><div class="torque-bar" id="tqb${i}" style="width:0%"></div></div>
      <span class="torque-val" id="tqv${i}">0 N·m</span>
    </div>`:''}`;
    el.appendChild(d);
  }
  buildPills();
}

function buildPills(){
  const el=document.getElementById('lpills');el.innerHTML='';
  for(let i=0;i<T.dof;i++){
    const a=T.angles[i],l=T.limits[i];
    const near=Math.abs(a)>Math.abs(l[1])*.85;
    const p=document.createElement('div');
    p.className=near?'lpill':'lpill ok';
    p.textContent=near?`J${i+1} near limit`:`J${i+1} OK`;
    el.appendChild(p);
  }
}

function buildPoseList(){
  const el=document.getElementById('poseList');el.innerHTML='';
  poses.forEach((p,i)=>{
    const d=document.createElement('div');d.className='pose-item';
    d.innerHTML=`<span class="pose-name">${p.name}</span>
    <div class="pose-btns">
      <button class="pose-btn" onclick="loadPoseIdx(${i})" data-tip="Load this pose">Load</button>
      <button class="pose-btn" onclick="deletePose(${i})" data-tip="Delete">✕</button>
    </div>`;
    el.appendChild(d);
  });
}


// ROBOT LIBRARY LOGIC -----------------------
let libOpen    = false;
let libFilter  = 'All';
let libSelected = null; // robot id

function toggleLib(){
  libOpen = !libOpen;
  document.getElementById('pLib').classList.toggle('off', !libOpen);
  document.getElementById('btnLib').classList.toggle('on',  libOpen);
  // Close left config panel to avoid overlap
  if(libOpen && PO.L){ closeP('L'); }
  if(libOpen) buildLibUI();
}

function closeLib(){
  libOpen = false;
  document.getElementById('pLib').classList.add('off');
  document.getElementById('btnLib').classList.remove('on');
}

function buildLibUI(){
  buildLibCats();
  buildLibCards();
}

function buildLibCats(){
  const cats = ['All', ...new Set(ROBOT_LIB.map(r=>r.category))];
  const el = document.getElementById('libCats');
  el.innerHTML = '';
  cats.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'cat-pill' + (libFilter===c?' on':'');
    b.textContent = c;
    b.onclick = ()=>{ libFilter=c; buildLibUI(); };
    el.appendChild(b);
  });
}

function buildLibCards(){
  const filtered = libFilter==='All'
    ? ROBOT_LIB
    : ROBOT_LIB.filter(r=>r.category===libFilter);

  const el = document.getElementById('libCards');
  el.innerHTML = '';
  filtered.forEach(r=>{
    const maxReach = r.links.reduce((a,b)=>a+b,0);
    const card = document.createElement('div');
    card.className = 'lib-card' + (libSelected===r.id?' selected':'');
    card.innerHTML = `
      <div class="lib-card-swatch" style="background:${r.color}18;color:${r.color}">
        ${EE_ICONS[r.eeType]||'◉'}
      </div>
      <div class="lib-card-info">
        <div class="lib-card-name">${r.name}</div>
        <div class="lib-card-sub">${r.category} · ${r.eeType.replace(/-/g,' ')}</div>
      </div>
      <div class="lib-card-dof">${r.dof}DOF</div>
    `;
    card.onclick = ()=> selectLibRobot(r.id);
    el.appendChild(card);
  });
}

function selectLibRobot(id){
  libSelected = id;
  buildLibCards(); // re-render to update selection highlight

  const r = ROBOT_LIB.find(x=>x.id===id);
  if(!r) return;

  // Show spec panel
  const spec = document.getElementById('libSpec');
  spec.style.display = 'block';

  document.getElementById('specName').textContent  = r.name;
  document.getElementById('specCat').textContent   = r.category + ' · ' + r.eeType.replace(/-/g,' ');
  document.getElementById('specDesc').textContent  = r.description;

  // Spec grid rows
  const rows = [
    ['DOF',           r.dof],
    ['Reach',         r.reach],
    ['Payload',       r.payload],
    ['Mass',          r.mass],
    ['Repeatability', r.repeatability],
    ['Base Height',   r.baseHeight + ' mm'],
    ['EE Type',       (EE_ICONS[r.eeType]||'') + ' ' + r.eeType.replace(/-/g,' ')],
    ['Links',         r.links.map(l=>l+'mm').join(' · ')],
  ];
  const grid = document.getElementById('specGrid');
  grid.innerHTML = '';
  rows.forEach(([k,v])=>{
    const d = document.createElement('div');
    d.className = 'spec-row';
    d.innerHTML = `<span class="spec-k">${k}</span><span class="spec-v">${v}</span>`;
    grid.appendChild(d);
  });

  // Draw mini preview
  drawLibPreview(r);
}

function loadLibRobot(){
  if(!libSelected) return;
  const r = ROBOT_LIB.find(x=>x.id===libSelected);
  if(!r) return;

  T.dof    = r.dof;
  T.links  = [...r.links];
  T.limits = r.limits.map(l=>[...l]);
  T.types  = [...r.types];
  T.angles = new Array(r.dof).fill(0);
  T.home   = new Array(r.dof).fill(0);

  document.getElementById('dofsel').value = r.dof;
  selectedJoint = -1;
  buildAll();
  toast(`Loaded: ${r.name}`);
  closeLib();
  // Re-open config panel so user can see what loaded
  PO.L = true; applyP('L');
}

// ── Mini canvas preview ─────────────────────────────────
function drawLibPreview(r){
  const cv = document.getElementById('libPreview');
  const g  = cv.getContext('2d');
  const W = 56, H = 56;
  g.clearRect(0,0,W,H);

  const maxLen = r.links.reduce((a,b)=>a+b,0);
  const scale  = (H * 0.72) / maxLen;
  const cx = W/2, cy = H - 8;

  // Faint grid
  g.strokeStyle = 'rgba(128,128,128,0.1)';
  g.lineWidth   = 0.5;
  for(let i=8;i<W;i+=8){ g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke() }
  for(let i=8;i<H;i+=8){ g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke() }

  // Draw links radiating upward in a gentle fan
  let px=cx, py=cy, angle = -Math.PI/2;
  const fanStep = r.dof > 1 ? (Math.PI * 0.55) / (r.dof - 1) : 0;
  const startAngle = -Math.PI/2 - (Math.PI*0.55)/2;

  g.lineCap = 'round';
  r.links.forEach((len, i)=>{
    const a   = startAngle + i * fanStep;
    const sl  = len * scale;
    const nx  = px + sl * Math.cos(a);
    const ny  = py + sl * Math.sin(a);
    const t   = i / Math.max(r.dof-1, 1);
    g.strokeStyle = r.color;
    g.globalAlpha = 0.45 + t * 0.45;
    g.lineWidth   = Math.max(1.5, 4 - i * 0.5);
    g.beginPath(); g.moveTo(px,py); g.lineTo(nx,ny); g.stroke();
    // Joint dot
    g.globalAlpha = 1;
    g.beginPath(); g.arc(px,py, 2, 0, Math.PI*2);
    g.fillStyle = isDark ? '#111213' : '#f0f0ee'; g.fill();
    g.strokeStyle = r.color; g.lineWidth = 1; g.stroke();
    px=nx; py=ny;
  });

  // EE dot
  g.beginPath(); g.arc(px,py, 3, 0, Math.PI*2);
  g.fillStyle = r.color;
  g.globalAlpha = 1;
  g.shadowColor = r.color; g.shadowBlur = 6;
  g.fill();
  g.shadowBlur = 0;
}

// ROBOT LIBRARY LOGIC end -----------------------


// ═══════════════════════════════════════════════
// FORWARD KINEMATICS
// ═══════════════════════════════════════════════
function fk(){
  let x=0,y=0,z=0,cA=0;
  T.pts3=[[0,0,0]];
  for(let i=0;i<T.dof;i++){
    const len=T.links[i]||100;
    cA+=(T.angles[i]||0)*Math.PI/180;
    if(T.types[i]==='P'){y+=len}
    else{x+=len*Math.cos(cA);y+=len*Math.abs(Math.sin(cA))*.68;z+=len*Math.sin(cA)*.3}
    T.pts3.push([x,y,z]);
  }
  T.ee={x,y,z};

  if(S.trail){
    trailPts.push([x,y,z]);
    if(trailPts.length>300)trailPts.shift();
  }

  document.getElementById('aX').textContent=x.toFixed(1);
  document.getElementById('aY').textContent=y.toFixed(1);
  document.getElementById('aZ').textContent=z.toFixed(1);
  document.getElementById('aR').textContent=((T.angles[T.dof-1]||0)).toFixed(1)+'°';
  document.getElementById('aP').textContent=((T.angles[Math.max(0,T.dof-2)]||0)*.4).toFixed(1)+'°';
  document.getElementById('aYw').textContent=((T.angles[0]||0)).toFixed(1)+'°';

  const maxR=T.links.slice(0,T.dof).reduce((a,b)=>a+b,0);
  const d=Math.sqrt(x*x+y*y+z*z);
  const pct=Math.min(100,d/maxR*100);
  const ok=d<=maxR;
  document.getElementById('rbar').style.width=pct+'%';
  document.getElementById('rbar').className='rb '+(ok?'ok':'warn');
  document.getElementById('rdot').className='rdot '+(ok?'ok':'warn');
  document.getElementById('rlbl').textContent=ok?'Reachable':'Out of Reach';
  document.getElementById('rnum').textContent=pct.toFixed(0)+'%';

  if(target3D){
    const td=Math.sqrt((x-target3D.x)**2+(y-target3D.y)**2+(z-target3D.z)**2);
    document.getElementById('targetDist').textContent=td.toFixed(1)+' mm';
    const tdEl=document.getElementById('targetDist');
    tdEl.style.color=td<30?'rgba(130,210,140,.85)':'var(--dim)';
  }

  if(S.torque){
    for(let i=0;i<T.dof;i++){
      const remainLen=T.links.slice(i,T.dof).reduce((a,b)=>a+b,0);
      const angAbs=Math.abs(T.angles[i]||0);
      const torqueEst=remainLen*0.018*(1+angAbs/90)*0.6;
      const torqueMax=T.links[0]*0.018*T.dof;
      const torquePct=Math.min(100,(torqueEst/torqueMax)*100);
      const b=document.getElementById(`tqb${i}`);
      const v=document.getElementById(`tqv${i}`);
      if(b){
        b.style.width=torquePct+'%';
        const tc=torquePct>75?'rgba(255,175,70,.8)':torquePct>50?'rgba(255,200,100,.6)':'rgba(160,200,160,.6)';
        b.style.background=tc;
      }
      if(v)v.textContent=torqueEst.toFixed(1)+' N·m';
    }
  }
  buildMtx();
}

function buildMtx(){
  const el=document.getElementById('mwrap');
  const a0=(T.angles[0]||0)*Math.PI/180,a1=(T.angles[1]||0)*Math.PI/180;
  const c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  const m=[
    [+(c0*c1).toFixed(2),+(-s0).toFixed(2),+(c0*s1).toFixed(2),+(T.ee.x/100).toFixed(2)],
    [+(s0*c1).toFixed(2),+(c0).toFixed(2),+(s0*s1).toFixed(2),+(T.ee.y/100).toFixed(2)],
    [+(-s1).toFixed(2),0,+(c1).toFixed(2),+(T.ee.z/100).toFixed(2)],
    [0,0,0,1]
  ];
  el.innerHTML='';
  m.forEach((row,ri)=>row.forEach((v,ci)=>{
    const c=document.createElement('div');
    c.className='mc'+(ci===3?' t':ri===ci?' d':'');
    c.textContent=v;el.appendChild(c);
  }));
}

// ═══════════════════════════════════════════════
// JOINT CONTROL
// ═══════════════════════════════════════════════
function setA(i,val){
  const l=T.limits[i];
  val=Math.max(l[0],Math.min(l[1],val));
  T.angles[i]=val;
  const near=Math.abs(val)>Math.abs(l[1])*.85;
  const jv=document.getElementById(`jv${i}`);
  const js=document.getElementById(`js${i}`);
  const jn=document.getElementById(`jn${i}`);
  if(jv){jv.textContent=val.toFixed(1)+'°';jv.className='jval'+(near?' lim':'')}
  if(js){js.value=val;js.className=(near?'lim':'')+(selectedJoint===i?' selected-range':'')}
  if(jn)jn.value=val.toFixed(1);
  fk();buildPills();
}
function stepJ(i,d){setA(i,(T.angles[i]||0)+d)}
function selectJoint(i){
  const prev=selectedJoint;
  selectedJoint=selectedJoint===i?-1:i;
  [prev,selectedJoint].forEach(j=>{
    if(j<0)return;
    const row=document.getElementById(`jr${j}`);
    const sl=document.getElementById(`js${j}`);
    if(row)row.classList.toggle('selected',j===selectedJoint);
    if(sl)sl.className=(Math.abs(T.angles[j]||0)>Math.abs(T.limits[j][1])*.85?'lim':'')+(j===selectedJoint?' selected-range':'');
  });
}
function goHome(){T.home.forEach((v,i)=>setA(i,v));toast('Returned to home')}
function saveHome(){T.home=[...T.angles];toast('Home position saved')}

// ═══════════════════════════════════════════════
// TRAIL
// ═══════════════════════════════════════════════
function toggleTrail(){
  S.trail=!S.trail;
  document.getElementById('btnTrail').classList.toggle('on',S.trail);
  const chk=document.querySelector('#trailToggle input');
  if(chk)chk.checked=S.trail;
  if(!S.trail)trailPts=[];
  toast(S.trail?'Trail enabled':'Trail cleared');
}
function clearTrail(){trailPts=[];toast('Trail cleared')}

// ═══════════════════════════════════════════════
// TARGET MARKER
// ═══════════════════════════════════════════════
function activateTarget(){
  targetMode=!targetMode;
  document.getElementById('btnTarget').classList.toggle('on',targetMode);
  const hint=document.getElementById('target-hint');
  hint.classList.toggle('show',targetMode);
  if(!targetMode&&target3D==null)document.getElementById('targetDist').textContent='—';
}

// ═══════════════════════════════════════════════
// POSES
// ═══════════════════════════════════════════════
function savePose(){
  const name=`Pose ${poses.length+1}`;
  poses.push({name,angles:[...T.angles]});
  buildPoseList();toast(`Saved "${name}"`);
}
function loadPoseIdx(i){
  if(!poses[i])return;
  poses[i].angles.forEach((v,j)=>setA(j,v));
  toast(`Loaded "${poses[i].name}"`);
}
function deletePose(i){
  const name=poses[i]?.name;
  poses.splice(i,1);buildPoseList();
  if(name)toast(`Deleted "${name}"`);
}

// ═══════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════
function loadPreset(v){
  const P={
    '6dof':{dof:6,links:[180,220,170,120,90,60],limits:[[-170,170],[-90,90],[-135,135],[-170,170],[-120,120],[-360,360]],types:['R','R','R','R','R','R']},
    'scara':{dof:4,links:[200,200,0,150],limits:[[-170,170],[-150,150],[-200,200],[-360,360]],types:['R','R','P','R']},
    '3dof':{dof:3,links:[250,200,160],limits:[[-170,170],[-135,135],[-170,170]],types:['R','R','R']},
    '2dof':{dof:2,links:[300,250],limits:[[-170,170],[-170,170]],types:['R','R']},
    '5dof':{dof:5,links:[160,200,160,100,80],limits:[[-170,170],[-120,120],[-130,130],[-170,170],[-120,120]],types:['R','R','R','R','R']},
  };
  const p=P[v];if(!p)return;
  T.dof=p.dof;T.links=[...p.links];T.limits=p.limits.map(l=>[...l]);T.types=[...p.types];
  T.angles=new Array(p.dof).fill(0);T.home=new Array(p.dof).fill(0);
  document.getElementById('dofsel').value=p.dof;
  selectedJoint=-1;buildAll();toast(`Loaded preset: ${v}`);
}
function updateDOF(n){
  T.dof=n;
  while(T.angles.length<n)T.angles.push(0);
  while(T.home.length<n)T.home.push(0);
  while(T.links.length<n)T.links.push(100);
  while(T.limits.length<n)T.limits.push([-180,180]);
  while(T.types.length<n)T.types.push('R');
  buildAll();
}
function applyConfig(){buildAll();toast('Config applied')}
function resetConfig(){
  T.dof=DEF.dof;T.links=[...DEF.links];T.limits=DEF.limits.map(l=>[...l]);T.types=[...DEF.types];
  T.angles=new Array(6).fill(0);T.home=new Array(6).fill(0);
  document.getElementById('dofsel').value=6;
  selectedJoint=-1;buildAll();toast('Config reset');
}
function buildAll(){buildLinks();buildJTypes();buildSliders();buildPoseList();fk()}

// ═══════════════════════════════════════════════
// JSON EXPORT / IMPORT
// ═══════════════════════════════════════════════
function exportJSON(){
  const data={dof:T.dof,links:T.links,limits:T.limits,types:T.types,angles:T.angles,home:T.home,poses};
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(JSON.stringify(data,null,2));
  a.download='robot-config.json';a.click();toast('Config exported');
}
function importJSON(input){
  const f=input.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      T.dof=d.dof||6;T.links=d.links||[...DEF.links];
      T.limits=(d.limits||DEF.limits).map(l=>[...l]);
      T.types=d.types||[...DEF.types];
      T.angles=d.angles||new Array(T.dof).fill(0);
      T.home=d.home||new Array(T.dof).fill(0);
      poses=d.poses||[];
      document.getElementById('dofsel').value=T.dof;
      selectedJoint=-1;buildAll();toast('Config imported');
    }catch(err){toast('Import failed: invalid JSON')}
  };
  r.readAsText(f);input.value='';
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
let toastTimer;
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),2000);
}

// ═══════════════════════════════════════════════
// CANVAS + RENDERER
// ═══════════════════════════════════════════════
const mc=document.getElementById('mc');
const ctx=mc.getContext('2d');
let cam={yaw:.42,pitch:.28,dist:820,tx:0,ty:0};
let drag={on:false,btn:-1,sx:0,sy:0,cy:0,cp:0,ctx:0,cty:0};
let isDraggingTarget=false;

function resize(){mc.width=window.innerWidth;mc.height=window.innerHeight}

const proj=(x,y,z)=>{
  const W=mc.width,H=mc.height;
  const ox=W/2+cam.tx,oy=H*.52+cam.ty;
  const rx=x*Math.cos(cam.yaw)+z*Math.sin(cam.yaw);
  const rz=-x*Math.sin(cam.yaw)+z*Math.cos(cam.yaw);
  const sc=cam.dist/750;
  return[ox+rx*sc,oy-y*sc+rz*Math.sin(cam.pitch)*sc*.55];
};

const unproj=(sx,sy)=>{
  const W=mc.width,H=mc.height;
  const ox=W/2+cam.tx,oy=H*.52+cam.ty;
  const sc=cam.dist/750;
  const eeY=T.ee.y||100;
  const dx=(sx-ox)/sc;
  const x3=dx*Math.cos(cam.yaw);
  const z3=dx*Math.sin(cam.yaw);
  return{x:x3,y:eeY,z:z3};
};

const hitTest=(sx,sy)=>{
  let bestIdx=-1,bestDist=30;
  T.pts3.forEach(([x,y,z],i)=>{
    if(i===T.pts3.length-1)return;
    const[px,py]=proj(x,y,z);
    const d=Math.hypot(sx-px,sy-py);
    if(d<bestDist){bestDist=d;bestIdx=i}
  });
  return bestIdx;
};

// ═══════════════════════════════════════════════
// 3D REACH SPHERE
// Projects a latitude/longitude wireframe sphere
// through the same proj() function used for the
// arm, so it rotates and tilts with the camera.
// Back-facing lines are drawn dimmer to give
// depth cue without a true z-sort.
// ═══════════════════════════════════════════════
function drawReachSphere3D(radius){
  if(!radius||radius<=0)return;

  const SEG = 72; // segments per ring — smooth at any zoom

  // Latitude bands: every 30° from -75 to +75
  const LAT_LINES = [-75,-60,-45,-30,-15,0,15,30,45,60,75];
  // Longitude meridians: 12 evenly spaced (every 30°)
  const LON_COUNT = 12;

  ctx.save();
  ctx.lineWidth = 0.6;

  // Approximate view direction in world space so we can
  // determine front-facing vs back-facing geometry.
  // The camera orbits around origin: view vector points
  // toward origin, so "toward viewer" direction in world is:
  const vx =  Math.sin(cam.yaw);  // right in screen = +x in world (approx)
  const vy = -Math.sin(cam.pitch); // up in screen = +y in world (approx)
  const vz =  Math.cos(cam.yaw);

  // ── Helper: stroke a polyline of 3D points ─────────────
  const strokePoly = (pts3, alpha, dashed) => {
    if(pts3.length < 2) return;
    if(dashed) ctx.setLineDash([3,8]);
    else ctx.setLineDash([]);
    ctx.strokeStyle = isDark
      ? `rgba(255,255,255,${alpha})`
      : `rgba(0,0,0,${alpha})`;
    const p0 = proj(...pts3[0]);
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    for(let i=1; i<pts3.length; i++){
      const p = proj(...pts3[i]);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  };

  // ── LATITUDE RINGS ──────────────────────────────────────
  // Each ring lives in a horizontal plane at y = R·sin(lat).
  // Its "outward normal" direction in the xz-plane is ambiguous
  // (it's a full ring), but we can shade by latitude:
  // rings near top/bottom are foreshortened; equator is most prominent.
  for(const latDeg of LAT_LINES){
    const lat  = latDeg * Math.PI / 180;
    const cosL = Math.cos(lat);
    const sinL = Math.sin(lat);

    const pts = [];
    for(let s=0; s<=SEG; s++){
      const lon = (s / SEG) * Math.PI * 2;
      pts.push([
        radius * cosL * Math.sin(lon),  // x
        radius * sinL,                   // y
        radius * cosL * Math.cos(lon)   // z
      ]);
    }

    // Face the viewer: dot of ring normal (0,sinL,0 approximate) with view
    // gives latitude-based shading — top/bottom rings face away more
    const facingDot = sinL * vy; // positive = facing away
    const isFront   = facingDot <= 0;
    const alpha      = isFront ? 0.22 : 0.07;

    strokePoly(pts, alpha, !isFront);
  }

  // ── LONGITUDE MERIDIANS ─────────────────────────────────
  // Each meridian arc runs from south pole to north pole at a
  // given longitude. Its outward normal at the equator is
  // (sin(lon), 0, cos(lon)) in world space.
  for(let li=0; li<LON_COUNT; li++){
    const lon    = (li / LON_COUNT) * Math.PI * 2;
    const sinLon = Math.sin(lon);
    const cosLon = Math.cos(lon);

    const pts = [];
    for(let s=0; s<=SEG; s++){
      const lat = ((s / SEG) * 2 - 1) * (Math.PI / 2); // -90° → +90°
      pts.push([
        radius * Math.cos(lat) * sinLon,
        radius * Math.sin(lat),
        radius * Math.cos(lat) * cosLon
      ]);
    }

    // Dot of this meridian's equatorial outward normal with view direction
    const dot      = sinLon * vx + cosLon * vz;
    const isFront  = dot >= 0;
    const alpha     = isFront ? 0.20 : 0.06;

    strokePoly(pts, alpha, !isFront);
  }

  // ── EQUATOR (highlighted) ───────────────────────────────
  {
    const pts = [];
    for(let s=0; s<=SEG; s++){
      const lon = (s / SEG) * Math.PI * 2;
      pts.push([radius * Math.sin(lon), 0, radius * Math.cos(lon)]);
    }
    strokePoly(pts, 0.30, false);
  }

  ctx.setLineDash([]);
  ctx.restore();
}

// ═══════════════════════════════════════════════
// DRAW
// ═══════════════════════════════════════════════
function draw(){
  const W=mc.width,H=mc.height;
  ctx.clearRect(0,0,W,H);

  const g=ctx.createRadialGradient(W/2,H*.45,0,W/2,H*.45,Math.max(W,H)*.7);
  if(isDark){g.addColorStop(0,'#141618');g.addColorStop(1,'#0c0d0e')}
  else{g.addColorStop(0,'#f2f1ef');g.addColorStop(1,'#e8e7e5')}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  if(S.grid){
    const gs=S.gridSize,step=S.gridSize/10;
    ctx.strokeStyle=isDark?'rgba(255,255,255,.045)':'rgba(0,0,0,.045)';ctx.lineWidth=.5;
    for(let g2=-gs;g2<=gs;g2+=step){
      const[ax,ay]=proj(g2,0,-gs);const[bx,by]=proj(g2,0,gs);
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      const[cx2,cy2]=proj(-gs,0,g2);const[dx2,dy2]=proj(gs,0,g2);
      ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(dx2,dy2);ctx.stroke();
    }
    ctx.strokeStyle=isDark?'rgba(255,255,255,.09)':'rgba(0,0,0,.09)';ctx.lineWidth=.8;
    const[la,lb]=proj(-gs,0,0);const[lc,ld]=proj(gs,0,0);
    ctx.beginPath();ctx.moveTo(la,lb);ctx.lineTo(lc,ld);ctx.stroke();
    const[le,lf]=proj(0,0,-gs);const[lg,lh]=proj(0,0,gs);
    ctx.beginPath();ctx.moveTo(le,lf);ctx.lineTo(lg,lh);ctx.stroke();
  }

  if(trailPts.length>1){
    ctx.save();
    for(let i=1;i<trailPts.length;i++){
      const[ax,ay]=proj(...trailPts[i-1]);
      const[bx,by]=proj(...trailPts[i]);
      const alpha=(i/trailPts.length)*.5;
      ctx.strokeStyle=isDark?`rgba(200,200,200,${alpha})`:`rgba(80,80,80,${alpha})`;
      ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    }
    ctx.restore();
  }

  // ── 3D REACH SPHERE ──────────────────────────────────────
  if(S.sphere){
    const maxR=T.links.slice(0,T.dof).reduce((a,b)=>a+b,0);
    drawReachSphere3D(maxR);
  }

  if(target3D){
    const[tx,ty]=proj(target3D.x,target3D.y,target3D.z);
    const isClose=Math.hypot(T.ee.x-target3D.x,T.ee.y-target3D.y,T.ee.z-target3D.z)<30;
    ctx.save();
    const cr=10;
    ctx.strokeStyle=isClose?'rgba(130,210,140,.8)':'rgba(200,180,120,.7)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(tx-cr,ty);ctx.lineTo(tx+cr,ty);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx,ty-cr);ctx.lineTo(tx,ty+cr);ctx.stroke();
    ctx.beginPath();ctx.arc(tx,ty,cr*.7,0,Math.PI*2);
    ctx.strokeStyle=isClose?'rgba(130,210,140,.6)':'rgba(200,180,120,.5)';
    ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(tx,ty,2,0,Math.PI*2);
    ctx.fillStyle=isClose?'rgba(130,210,140,.9)':'rgba(220,200,140,.9)';ctx.fill();
    ctx.restore();
  }

  const pts2=T.pts3.map(([x,y,z])=>proj(x,y,z));
  const getLinkColor=(i)=>{
    const near=Math.abs(T.angles[i]||0)>Math.abs(T.limits[i]?.[1]||180)*.85;
    if(near)return isDark?'rgba(255,175,70,.75)':'rgba(200,130,40,.75)';
    if(i===selectedJoint)return isDark?'rgba(255,255,255,.88)':'rgba(30,30,30,.8)';
    const base=S.transp?.28:.7-i*.05;
    return isDark?`rgba(255,255,255,${base})`:`rgba(40,40,40,${base})`;
  };

  for(let i=0;i<pts2.length-1;i++){
    const[ax,ay]=pts2[i];const[bx,by]=pts2[i+1];
    const lw=S.wire?1.5:Math.max(2.5,7-i*.8);
    ctx.save();
    ctx.strokeStyle=getLinkColor(i);
    ctx.lineWidth=lw;ctx.lineCap='round';
    if(!S.wire&&!S.transp){ctx.shadowColor=isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)';ctx.shadowBlur=5}
    ctx.globalAlpha=S.transp?.55:1;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    ctx.restore();
  }

  if(S.marks){
    pts2.slice(0,-1).forEach(([jx,jy],i)=>{
      const sel=i===selectedJoint;
      ctx.beginPath();ctx.arc(jx,jy,sel?6:5,0,Math.PI*2);
      ctx.fillStyle=isDark?'#111213':'#f0f0ee';ctx.fill();
      ctx.strokeStyle=sel?(isDark?'rgba(255,255,255,.75)':'rgba(0,0,0,.6)'):
        (isDark?'rgba(255,255,255,.35)':'rgba(0,0,0,.28)');
      ctx.lineWidth=sel?1.8:1.2;ctx.stroke();
      if(sel){
        ctx.beginPath();ctx.arc(jx,jy,9,0,Math.PI*2);
        ctx.strokeStyle=isDark?'rgba(255,255,255,.15)':'rgba(0,0,0,.1)';
        ctx.lineWidth=1;ctx.stroke();
      }
    });
  }

  const[bx2,by2]=pts2[0];
  ctx.save();
  ctx.beginPath();ctx.ellipse(bx2,by2+5,22,6.5,0,0,Math.PI*2);
  ctx.fillStyle=isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)';ctx.fill();
  ctx.strokeStyle=isDark?'rgba(255,255,255,.2)':'rgba(0,0,0,.18)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.ellipse(bx2,by2,22,6.5,0,0,Math.PI*2);
  ctx.fillStyle=isDark?'#111213':'#f0f0ee';ctx.fill();
  ctx.strokeStyle=isDark?'rgba(255,255,255,.26)':'rgba(0,0,0,.22)';ctx.stroke();
  ctx.restore();

  const[ex,ey]=pts2[pts2.length-1];
  const maxR2=T.links.slice(0,T.dof).reduce((a,b)=>a+b,0);
  const eeD=Math.sqrt(T.ee.x**2+T.ee.y**2+T.ee.z**2);
  const eeOk=eeD<=maxR2;
  ctx.save();
  ctx.beginPath();ctx.arc(ex,ey,7,0,Math.PI*2);
  ctx.fillStyle=isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)';ctx.fill();
  ctx.strokeStyle=eeOk?(isDark?'rgba(255,255,255,.55)':'rgba(0,0,0,.45)'):'rgba(255,175,70,.7)';
  ctx.lineWidth=1.3;ctx.stroke();
  ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);
  ctx.fillStyle=eeOk?(isDark?'rgba(255,255,255,.9)':'rgba(20,20,20,.85)'):'rgba(255,175,70,.9)';
  ctx.shadowColor=eeOk?'rgba(255,255,255,.4)':'rgba(255,175,70,.4)';ctx.shadowBlur=8;
  ctx.fill();ctx.restore();

  if(S.eef){
    const totA=T.angles.slice(0,T.dof).reduce((a,v)=>a+v,0)*Math.PI/180-Math.PI/2;
    const fl=24;
    ctx.save();ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+fl*Math.cos(totA),ey+fl*Math.sin(totA));
    ctx.strokeStyle='rgba(220,90,80,.85)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+fl*Math.cos(totA+Math.PI/2),ey+fl*Math.sin(totA+Math.PI/2));
    ctx.strokeStyle='rgba(90,200,110,.85)';ctx.stroke();
    ctx.restore();
  }
}

// GIZMO
function drawGizmo(){
  const c=document.getElementById('gizmo');
  const g=c.getContext('2d');
  g.clearRect(0,0,52,52);
  const cx=26,cy=26,L=17;
  [{lbl:'X',col:'rgba(220,90,80,.85)',dx:Math.cos(cam.yaw),dy:-Math.sin(cam.yaw)*Math.sin(cam.pitch)},
   {lbl:'Y',col:'rgba(90,200,110,.85)',dx:0,dy:-1},
   {lbl:'Z',col:'rgba(90,140,220,.85)',dx:Math.sin(cam.yaw),dy:Math.cos(cam.yaw)*Math.sin(cam.pitch)*.5}
  ].forEach(a=>{
    g.save();
    g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+a.dx*L,cy+a.dy*L);
    g.strokeStyle=a.col;g.lineWidth=1.5;g.stroke();
    g.fillStyle=a.col;g.font='8px DM Mono';g.textAlign='center';
    g.fillText(a.lbl,cx+a.dx*(L+8),cy+a.dy*(L+8)+3);
    g.restore();
  });
}

// ═══════════════════════════════════════════════
// MOUSE / INTERACTION
// ═══════════════════════════════════════════════
mc.addEventListener('mousedown',e=>{
  if(targetMode){
    const pos=unproj(e.clientX,e.clientY);
    if(S.snap){pos.x=Math.round(pos.x/50)*50;pos.z=Math.round(pos.z/50)*50}
    target3D=pos;fk();
    if(e.button===0)isDraggingTarget=true;
    return;
  }
  if(e.button===0){
    const hit=hitTest(e.clientX,e.clientY);
    if(hit>=0){
      selectJoint(hit);
      if(!PO.R){PO.R=true;applyP('R')}
      const row=document.getElementById(`jr${hit}`);
      if(row)row.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;
    }
  }
  drag.on=true;drag.btn=e.button;
  drag.sx=e.clientX;drag.sy=e.clientY;
  drag.cy=cam.yaw;drag.cp=cam.pitch;
  drag.ctx=cam.tx;drag.cty=cam.ty;
});

window.addEventListener('mousemove',e=>{
  if(isDraggingTarget&&target3D){
    const pos=unproj(e.clientX,e.clientY);
    if(S.snap){pos.x=Math.round(pos.x/50)*50;pos.z=Math.round(pos.z/50)*50}
    target3D=pos;fk();return;
  }
  if(!drag.on)return;
  const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
  if(drag.btn===0){
    cam.yaw=drag.cy+dx*.0055;
    cam.pitch=Math.max(.04,Math.min(Math.PI/2.1,drag.cp+dy*.0055));
  }else if(drag.btn===2){cam.tx=drag.ctx+dx;cam.ty=drag.cty+dy}
});

window.addEventListener('mouseup',()=>{
  drag.on=false;
  isDraggingTarget=false;
  if(targetMode){targetMode=false;document.getElementById('btnTarget').classList.remove('on');document.getElementById('target-hint').classList.remove('show')}
});

mc.addEventListener('wheel',e=>{
  e.preventDefault();
  cam.dist=Math.max(280,Math.min(2200,cam.dist+e.deltaY*.45));
},{passive:false});

mc.addEventListener('contextmenu',e=>e.preventDefault());

// ═══════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  const step=e.shiftKey?5:1;
  switch(e.key){
    case'q':case'Q':stepJ(0,-step);break;
    case'e':case'E':stepJ(0,step);break;
    case'a':case'A':stepJ(1,-step);break;
    case'd':case'D':stepJ(1,step);break;
    case'z':case'Z':stepJ(2,-step);break;
    case'c':case'C':stepJ(2,step);break;
    case'r':case'R':goHome();break;
    case't':case'T':toggleTrail();break;
    case'g':case'G':S.grid=!S.grid;break;
    case'Escape':if(targetMode)activateTarget();break;
  }
});

// ═══════════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════════
function loop(){draw();drawGizmo();requestAnimationFrame(loop)}

window.addEventListener('load',()=>{
  resize();
  window.addEventListener('resize',resize);
  buildAll();
  loop();
});