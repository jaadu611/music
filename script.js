let play = document.getElementById("play");
let playImg = play.querySelector("img");
let currentTrackName = "";
let currentsong = new Audio();
let songs = [];
let folderCards;
let prev = document.getElementById("prev");
let next = document.getElementById("next");

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function getsongs(folder = "fun") {
    let fetch_song = await fetch(`http://127.0.0.1:3000/songs/${folder}`);
    let response = await fetch_song.text();
    let div = document.createElement('div');
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songlist = [];

    for (let index = 0; index < as.length; index++) {
        let element = as[index];
        if (element.href.endsWith(".mp3")) {
            let filename = element.href.split("/songs/")[1];
            filename = decodeURIComponent(filename).replace('.mp3', '');
            songlist.push(filename);
        }
    }
    return songlist;
}

const playmusic = (track, pause = false) => {
    if (currentTrackName === track && !currentsong.paused) {
        currentsong.pause();
        playImg.src = "/images/play.svg";
        document.querySelector(".songinfo").innerHTML = 'Paused';
        return;
    }

    currentsong.src = `/songs/${track.split("/").map(encodeURIComponent).join("/")}.mp3`;
    currentsong.play();
    currentTrackName = track;

    playImg.src = "/images/pause.svg";
    const songNameOnly = track.split("/").pop();
    document.querySelector(".songinfo").innerHTML = `${songNameOnly} <img src="Nt6v.gif" alt="Animation" width="120" height="50" style="position: relative; left:-30px;">`;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
    document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
});

document.querySelector('.seekbar').addEventListener("click", e => {
    const seekbar = e.target.getBoundingClientRect();
    const offsetX = e.clientX - seekbar.left;
    const percent = (offsetX / seekbar.width) * 100;
    document.querySelector(".circle").style.left = `${percent}%`;
    currentsong.currentTime = (currentsong.duration * percent) / 100;
});

play.addEventListener("click", () => {
    if (currentsong.src) {
        if (currentsong.paused) {
            currentsong.play();
            playImg.src = "/images/pause.svg";
            const songNameOnly = currentTrackName.split("/").pop();
            document.querySelector(".songinfo").innerHTML = `${songNameOnly} <img src="Nt6v.gif" alt="Animation" width="120" height="50" style="position: relative; left:-30px; bottom:-20px">`;
        } else {
            currentsong.pause();
            playImg.src = "/images/play.svg";
            document.querySelector(".songinfo").innerHTML = 'Paused';
        }
    }
});

async function getfolders() {
    let fetch_folder = await fetch("http://127.0.0.1:3000/songs");
    let foldersHtml = await fetch_folder.text();

    let div = document.createElement('div');
    div.innerHTML = foldersHtml;

    let as = div.getElementsByTagName("a");
    let folderList = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.innerText === "../") continue;
        if (!element.innerText.match(/\.[a-zA-Z0-9]+$/)) {
            let folderName = element.innerText.replace("/", "");
            folderList.push(folderName);
        }
    }

    const mainDiv = document.querySelector(".main");
    mainDiv.querySelectorAll(".folders").forEach(el => el.remove());

    for (const folder of folderList) {
        const songCount = await getsongs(folder);
        const folderContainer = document.createElement("div");
        folderContainer.classList.add("folders");

        folderContainer.innerHTML = `
            <img src="http://127.0.0.1:3000/songs/${folder}/thumbnail.jpg" onerror="this.src='default-thumbnail.jpg'" />
            <span>${folder}</span>
            <div class="song-count">${songCount.length} song${songCount.length !== 1 ? 's' : ''}</div>
        `;
        mainDiv.appendChild(folderContainer);
    }

    attachFolderClickEvents();
}

function attachFolderClickEvents() {
    folderCards = document.querySelectorAll(".folders");
    folderCards.forEach(foldercard => {
        foldercard.addEventListener("click", () => {
            const folder = foldercard.querySelector("span").textContent.trim();
            loadSongsFromFolder(folder);
            highlightActiveFolder(foldercard);
        });
    });
}

function highlightActiveFolder(activeCard) {
    document.querySelectorAll(".folders").forEach(card => card.classList.remove("active"));
    activeCard.classList.add("active");
}

async function loadSongsFromFolder(folder) {
    songs = await getsongs(folder);
    let songUl = document.querySelector('.songlist ul');
    songUl.innerHTML = "";

    for (const song of songs) {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <span class="song-name" data-fullname="${song}">${song.split("/").pop().replaceAll("%20", " ")}</span>
            <div class="playnow">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12L3 18.9671C3 21.2763 5.53435 22.736 7.59662 21.6145L10.7996 19.8727M3 8L3 5.0329C3 2.72368 5.53435 1.26402 7.59661 2.38548L20.4086 9.35258C22.5305 10.5065 22.5305 13.4935 20.4086 14.6474L14.0026 18.131" stroke="#0e8131" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>
        `;
        listItem.addEventListener("click", () => {
            const trackName = listItem.querySelector(".song-name").dataset.fullname;
            playmusic(trackName);
            highlightActiveSong(trackName);
        });
        songUl.appendChild(listItem);
    }
}

prev.addEventListener("click", () => {
    let path = decodeURIComponent(currentsong.src.split("/songs/")[1]).replace(".mp3", "");
    let index = songs.indexOf(path);
    let prevIndex = index - 1 < 0 ? songs.length - 1 : index - 1;
    let prevSong = songs[prevIndex];
    playmusic(prevSong);
    highlightActiveSong(prevSong);
});

next.addEventListener("click", () => {
    let path = decodeURIComponent(currentsong.src.split("/songs/")[1]).replace(".mp3", "");
    let index = songs.indexOf(path);
    let nextIndex = (index + 1) % songs.length;
    let nextSong = songs[nextIndex];
    playmusic(nextSong);
    highlightActiveSong(nextSong);
});

document.getElementById("search-bar").addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const listItems = document.querySelectorAll(".songlist ul li");

    listItems.forEach(item => {
        const name = item.querySelector(".song-name").innerText.toLowerCase();
        item.style.display = name.includes(query) ? "" : "none";
    });
});

function highlightActiveSong(trackName) {
    document.querySelectorAll(".songlist ul li").forEach(li => {
        const name = li.querySelector(".song-name").dataset.fullname;
        if (name === trackName) {
            li.classList.add("active");
        } else {
            li.classList.remove("active");
        }
    });
}

currentsong.addEventListener("ended", () => {
    let index = songs.indexOf(currentTrackName);
    let nextIndex = (index + 1) % songs.length;
    const nextTrack = songs[nextIndex];
    setTimeout(() => {
        playmusic(nextTrack);
        highlightActiveSong(nextTrack);
    }, 2000);
});

async function main() {
    await getfolders();

    let activeCard = document.querySelector(".folders.active") || document.querySelector(".folders");
    if (activeCard) {
        const folder = activeCard.querySelector("span").textContent.trim();
        await loadSongsFromFolder(folder);
        highlightActiveFolder(activeCard);
    }
}

document.querySelector(".hamburger").addEventListener("click", () => {
  const leftEl = document.querySelector(".left");
  const hamburger = document.querySelector(".hamburger");
  
  leftEl.classList.toggle("active");

  if (leftEl.classList.contains("active")) {
    hamburger.style.transform = "rotate(90deg)";
  } else {
    hamburger.style.transform = "rotate(0deg)";
  }
});


main();