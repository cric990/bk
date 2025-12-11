// CONFIG (Paste Your Keys)
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

// --- 1. PLAYER ENGINE (FIXED) ---
var player = videojs('v-player', {
    fluid: true,
    html5: {
        vhs: { 
            overrideNative: true, // Forces HLS.js on Chrome
            withCredentials: false 
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
    }
});

// Error Handling
player.on('error', function() {
    const err = player.error();
    console.log("Player Error:", err);
    document.getElementById('player-error').style.display = 'flex';
});

// --- 2. OPEN PLAYER LOGIC ---
let viewInt;

function openPlayer(d) {
    document.getElementById('player-ui').classList.add('active');
    document.getElementById('p-title').innerText = d.title;
    document.getElementById('player-error').style.display = 'none'; // Hide prev errors
    
    const qBox = document.getElementById('q-btns');
    qBox.innerHTML = "";

    if(d.streams && d.streams.length > 0) {
        // Auto Play First Stream
        playSource(d.streams[0]);

        // Create Buttons
        d.streams.forEach((s, i) => {
            let b = document.createElement('div');
            b.className = i===0 ? 'btn-q active' : 'btn-q';
            b.innerText = s.lbl;
            b.onclick = () => {
                document.querySelectorAll('.btn-q').forEach(x=>x.classList.remove('active'));
                b.classList.add('active');
                playSource(s);
            }
            qBox.appendChild(b);
        });
    }

    // Fake Views
    clearInterval(viewInt);
    const min = parseInt(d.minViews) || 1000;
    const max = parseInt(d.maxViews) || 2000;
    updateView(min, max);
    viewInt = setInterval(() => updateView(min, max), 3000);
}

// --- 3. SOURCE SWITCHING (M3U8 vs EMBED) ---
function playSource(s) {
    const vjsTech = document.querySelector('.video-js');
    const iframe = document.getElementById('web-player');
    const errBox = document.getElementById('player-error');

    // Reset UI
    errBox.style.display = 'none';
    player.pause();
    iframe.src = "";

    if (s.type === 'embed') {
        // Handle Iframe
        vjsTech.style.display = 'none';
        iframe.style.display = 'block';
        iframe.src = s.url;
    } else {
        // Handle M3U8
        iframe.style.display = 'none';
        vjsTech.style.display = 'block';
        
        // HTTP Check warning (Only for Vercel/Https sites)
        if (window.location.protocol === 'https:' && s.url.startsWith('http://')) {
            alert("Warning: You are trying to play an HTTP (Insecure) link on an HTTPS site. This might fail.");
        }

        player.src({
            src: s.url,
            type: 'application/x-mpegURL' // Strict Mime Type
        });
        player.play().catch(e => console.log("Auto-play prevented by browser"));
    }
}

function updateView(min, max) {
    const v = Math.floor(Math.random() * (max - min + 1) + min);
    document.getElementById('view-cnt').innerText = v.toLocaleString();
}

function closePlayer() {
    player.pause();
    document.getElementById('web-player').src = "";
    document.getElementById('player-ui').classList.remove('active');
    clearInterval(viewInt);
}

// --- 4. REST OF THE APP LOGIC (Search, Grid, Slider etc.) ---
// ... (Purana code jo sahi chal raha tha wo niche rakhen) ...

// SEARCH
function toggleSearch() {
    const s = document.getElementById('search-ui');
    s.classList.toggle('active');
    if(s.classList.contains('active')) document.getElementById('search-inp').focus();
    else renderGrid(allData);
}
document.getElementById('search-inp').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allData.filter(d => d.title.toLowerCase().includes(val));
    renderGrid(filtered);
});

// DATA FETCH
let allData = [];
let curCat = 'All';

db.collection("categories").onSnapshot(s => {
    const t = document.getElementById('cat-tabs');
    t.innerHTML = `<div class="tab active" onclick="filter('All', this)">All Events</div>`;
    s.forEach(d => t.innerHTML += `<div class="tab" onclick="filter('${d.data().name}', this)">${d.data().name}</div>`);
});

function filter(c, btn) {
    curCat = c;
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(c === 'All' ? allData : allData.filter(d => d.category === c));
}

db.collection("matches").orderBy("time", "desc").onSnapshot(s => {
    allData = [];
    s.forEach(doc => allData.push(doc.data()));
    if(!document.getElementById('search-ui').classList.contains('active')) renderGrid(allData);
});

function renderGrid(data) {
    const g = document.getElementById('grid');
    g.innerHTML = "";
    if(data.length === 0) { g.innerHTML = '<p style="padding:20px;color:gray;text-align:center;">No matches found.</p>'; return; }
    
    data.forEach(d => {
        const div = document.createElement('div');
        div.className = 'card';
        div.onclick = () => openPlayer(d);
        div.innerHTML = `
            <img src="${d.poster}" class="poster" onerror="this.src='https://via.placeholder.com/300x160'">
            <div class="c-content">
                <div class="c-title">${d.title}</div>
                <div class="c-ft"><span class="live-txt">● LIVE</span><span>${d.streams?d.streams.length:1} Src</span></div>
            </div>`;
        g.appendChild(div);
    });
}

// Slider & Notif Logic (Same as before)
// ... Copy from previous App.js for Slider/Notif ...