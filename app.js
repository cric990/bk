// --- CONFIG (PASTE YOUR KEYS HERE) ---
const firebaseConfig = {
  apiKey: "AIzaSyA2iHrUt8_xxvB2m8-LftaE9sg_5JaiFk8",
  authDomain: "banty-live.firebaseapp.com",
  projectId: "banty-live",
  storageBucket: "banty-live.firebasestorage.app",
  messagingSenderId: "435477036444",
  appId: "1:435477036444:web:207931e07ea52ca3269c59",
  measurementId: "G-HXMVFK1E1C"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 1. SEARCH LOGIC (FIXED) ---
function toggleSearch() {
    const s = document.getElementById('search-ui');
    s.classList.toggle('active');
    if(s.classList.contains('active')) {
        document.getElementById('search-inp').value = "";
        document.getElementById('search-inp').focus();
        // Reset grid
        renderGrid(allData); 
    } else {
        renderGrid(allData); // Reset on close
    }
}

document.getElementById('search-inp').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allData.filter(d => d.title.toLowerCase().includes(val));
    renderGrid(filtered);
});

// --- 2. THEME ENGINE ---
function toggleTheme() {
    const b = document.body;
    const icon = document.getElementById('theme-icon');
    if(b.getAttribute('data-theme') === 'light') {
        b.removeAttribute('data-theme');
        icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    } else {
        b.setAttribute('data-theme', 'light');
        icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    }
}
if(localStorage.getItem('theme') === 'light') toggleTheme();

// --- 3. WHATSAPP TOAST (25 MIN LOOP) ---
const waSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
let userActive = false;
document.body.addEventListener('click', ()=>userActive=true, {once:true});

function showWa() {
    const t = document.getElementById('wa-popup');
    t.classList.add('show');
    if(userActive) waSound.play().catch(()=>{});
    setTimeout(() => t.classList.remove('show'), 5000);
}
setInterval(showWa, 1500000); // 25 Min
setTimeout(showWa, 8000);     // 8 Sec

// --- 4. DATA LOGIC ---
let allData = [];
let currentCat = 'All';

// Cats
db.collection("categories").onSnapshot(s => {
    const t = document.getElementById('cat-tabs');
    t.innerHTML = `<div class="tab-pill active" onclick="filterCat('All', this)">All Events</div>`;
    s.forEach(d => {
        const n = d.data().name;
        t.innerHTML += `<div class="tab-pill" onclick="filterCat('${n}', this)">${n}</div>`;
    });
});

function filterCat(c, btn) {
    currentCat = c;
    document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if(c === 'All') {
        renderGrid(allData);
    } else {
        const f = allData.filter(x => x.category === c);
        renderGrid(f);
    }
}

// Matches
db.collection("matches").orderBy("time", "desc").onSnapshot(s => {
    allData = [];
    s.forEach(d => allData.push(doc = d.data()));
    // If search is active, don't override search results instantly
    if(!document.getElementById('search-ui').classList.contains('active')) {
        renderGrid(allData);
    }
});

function renderGrid(data) {
    const g = document.getElementById('match-grid');
    g.innerHTML = "";
    
    if(data.length === 0) { g.innerHTML = '<p style="padding:20px; color:var(--text-sec);">No matches found.</p>'; return; }

    data.forEach(d => {
        const div = document.createElement('div');
        div.className = 'card';
        div.onclick = () => openPlayer(d);
        div.innerHTML = `
            <div class="poster-box">
                <img src="${d.poster}" class="poster-img" onerror="this.src='https://via.placeholder.com/300x160'">
            </div>
            <div class="card-info">
                <div class="card-title">${d.title}</div>
                <div class="card-ft">
                    <div class="live-tag"><div class="live-icon"></div> LIVE</div>
                    <div>${d.streams ? d.streams.length : 1} Source</div>
                </div>
            </div>
        `;
        g.appendChild(div);
    });
}

// Slider
const slider = document.getElementById('slider');
db.collection("slider").orderBy("time", "desc").onSnapshot(s => {
    slider.innerHTML = "";
    s.forEach(d => {
        const div = document.createElement('div');
        div.className = 'slide';
        div.style.backgroundImage = `url('${d.img}')`;
        if(d.link) div.onclick = () => openPlayer({title:d.title, streams:[{lbl:'HD', url:d.link}]});
        div.innerHTML = `
            <div class="slide-gradient">
                <span class="slide-badge">FEATURED</span>
                <div class="slide-title">${d.title}</div>
            </div>`;
        slider.appendChild(div);
    });
});

// --- 5. PLAYER ---
var player = videojs('v-player', { fluid: true, html5: { hls: { overrideNative: true } } });
let viewInt;

function openPlayer(d) {
    document.getElementById('player-ui').classList.add('active');
    document.getElementById('p-title').innerText = d.title;
    
    const qBox = document.getElementById('q-btns');
    qBox.innerHTML = "";
    if(d.streams && d.streams.length > 0) {
        playLink(d.streams[0].url);
        d.streams.forEach((s, i) => {
            let b = document.createElement('div');
            b.className = i===0 ? 'q-btn active' : 'q-btn';
            b.innerText = s.lbl;
            b.onclick = () => {
                document.querySelectorAll('.q-btn').forEach(x=>x.classList.remove('active'));
                b.classList.add('active');
                playLink(s.url);
            }
            qBox.appendChild(b);
        });
    }

    clearInterval(viewInt);
    const min = parseInt(d.minViews) || 1000;
    const max = parseInt(d.maxViews) || 2000;
    updateView(min, max);
    viewInt = setInterval(() => updateView(min, max), 3000);
}

function updateView(min, max) {
    const v = Math.floor(Math.random() * (max - min + 1) + min);
    document.getElementById('v-count').innerText = v.toLocaleString();
}

function playLink(url) {
    player.src({ src: url, type: 'application/x-mpegURL' });
    player.play().catch(()=>{});
}

function closePlayer() {
    player.pause();
    document.getElementById('player-ui').classList.remove('active');
    clearInterval(viewInt);
}

// --- 6. NOTIFICATIONS (1 Hour) ---
function toggleNotif() {
    document.getElementById('n-box').classList.toggle('active');
    document.getElementById('n-badge').style.display = 'none';
}

db.collection("notifications").orderBy("time", "desc").onSnapshot(s => {
    const list = document.getElementById('n-list');
    list.innerHTML = "";
    let count = 0;
    const now = Date.now();
    const limit = 3600000; // 1 Hour

    s.forEach(d => {
        const data = d.data();
        if(now - data.time < limit) {
            count++;
            const min = Math.floor((now - data.time)/60000);
            list.innerHTML += `
                <div class="nb-item">
                    <div class="nb-title">${data.title}</div>
                    <div class="nb-msg">${data.msg}</div>
                    <div style="font-size:10px; color:#666; margin-top:3px;">${min}m ago</div>
                </div>`;
        }
    });

    if(count === 0) list.innerHTML = '<div style="padding:15px; text-align:center; color:gray; font-size:11px;">No alerts</div>';
    if(count > 0) {
        const b = document.getElementById('n-badge');
        b.style.display = 'block';
    }
});