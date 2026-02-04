const API_KEY = ENV.API_KEY;

const dataArtisAwal = [
  {
    nama: "Tulus",
    foto: "https://i.scdn.co/image/ab6761610000e5eb53462891ab7799f2934b568e",
  },
  {
    nama: "Hindia",
    foto: "https://i.scdn.co/image/ab6761610000e5eb8022c4a018990cd93a9ddfe0",
  },
  {
    nama: "Nadin Amizah",
    foto: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84f495d990631544971b6b8e0d",
  },
  {
    nama: "Sheila on 7",
    foto: "https://i.scdn.co/image/ab67616d00001e025974be9bbf90d8f21af5515f",
  },
];

function init() {
  // 1. Muat Artis
  document.getElementById("artisGrid").innerHTML = dataArtisAwal
    .map(
      (a) => `
          <div class="kartu-artis" onclick="autoCari('${a.nama}')">
            <img src="${a.foto}" alt="${a.nama}">
            <strong>${a.nama}</strong>
          </div>
        `,
    )
    .join("");

  // 2. Muat Lagu Random dari API (Menggunakan chart populer)
  muatLaguAcak();
}

async function muatLaguAcak() {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${API_KEY}&format=json&limit=6`,
    );
    const data = await res.json();
    const tracks = data.tracks.track;
    console.log(tracks);
    

    document.getElementById("laguRandomGrid").innerHTML = tracks
      .map(
        (t) => `
            <div class="item-lagu" onclick="bukaModal('${t.name.replace(/'/g, "\\'")}', '${t.artist.name.replace(/'/g, "\\'")}', '${t.image[1]["#text"]}')">
              <img src="${t.image[1]["#text"] || "https://via.placeholder.com/50"}">
              <div class="info">
                <strong>${t.name}</strong>
                <small>${t.artist.name}</small>
              </div>
            </div>
          `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

// Implementasi DP: Levenshtein Distance (Forward Approach)
function hitungJarakDP(inputUser, namaLagu) {
  const m = inputUser.length;
  const n = namaLagu.length;

  // TAHAP 1: Inisialisasi Matriks (Memoization Table)
  // Membuat tabel untuk menyimpan solusi sub-masalah agar tidak dihitung berulang (DP Tabulation)
  let tabel = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Mengisi Base Case (Biaya menghapus/menambah karakter jika string kosong)
  for (let i = 0; i <= m; i++) tabel[i][0] = i;
  for (let j = 0; j <= n; j++) tabel[0][j] = j;

  // TAHAP 2: Iterasi Berdasarkan Karakter (Stages & States)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      
      // Jika karakter sama (State Optimal: Tidak ada biaya tambahan)
      if (inputUser[i - 1].toLowerCase() === namaLagu[j - 1].toLowerCase()) {
        tabel[i][j] = tabel[i - 1][j - 1];
      } 
      // Jika karakter beda (Mencari solusi optimal dari sub-masalah sebelumnya)
      else {
        tabel[i][j] = 1 + Math.min(
          tabel[i - 1][j],    // Operasi Hapus
          tabel[i][j - 1],    // Operasi Tambah
          tabel[i - 1][j - 1] // Operasi Ganti
        );
      }
    }
  }

  // Hasil akhir berada di pojok kanan bawah matriks (Solusi Optimal Global)
  return tabel[m][n];
}

function resetPencarian() {
  document.getElementById("kolomCari").value = "";
  kendaliTampilan();
}

function autoCari(kata) {
  document.getElementById("kolomCari").value = kata;
  kendaliTampilan();
}

function kendaliTampilan() {
  const input = document.getElementById("kolomCari").value;
  const btnBack = document.getElementById("btnKembali");
  const recSection = document.getElementById("sectionRekomendasi");
  const resSection = document.getElementById("sectionHasil");

  if (input.length > 0) {
    btnBack.style.display = "flex";
    recSection.classList.add("hidden");
    resSection.classList.remove("hidden");
    if (input.length >= 3) pencarianApi(input);
  } else {
    btnBack.style.display = "none";
    recSection.classList.remove("hidden");
    resSection.classList.add("hidden");
  }
}

async function pencarianApi(kataKunci) {
  const wadah = document.getElementById("daftarHasil");
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(kataKunci)}&api_key=${API_KEY}&format=json&limit=10`;
    const respon = await fetch(url);
    const data = await respon.json();
    const list = data.results.trackmatches.track;

    const hasil = list
      .map((lagu) => ({
        ...lagu,
        // Menghitung skor kemiripan menggunakan algoritma DP
        skor: hitungJarakDP(kataKunci, lagu.name),
        cover: lagu.image[1]["#text"] || "https://via.placeholder.com/50",
      }))
      // SORTING: Skor terkecil (paling mirip) muncul di atas
      .sort((a, b) => a.skor - b.skor);

    // Render ke HTML
    wadah.innerHTML = hasil.map((h) => `
      <div class="item-lagu" onclick="bukaModal('${h.name.replace(/'/g, "\\'")}', '${h.artist.replace(/'/g, "\\'")}', '${h.cover}')">
        <img src="${h.cover}">
        <div class="info">
          <strong>${h.name}</strong>
          <small>${h.artist}</small>
        </div>
        <div style="font-size: 0.75rem; color: #1db954; font-weight: bold;">
          DP Score: ${h.skor}
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error("Gagal memuat data API:", e);
  }
}

function bukaModal(judul, artis, img) {
  document.getElementById("modalTitle").innerText = judul;
  document.getElementById("modalArtist").innerText = artis;
  document.getElementById("modalImg").src =
    img || "https://via.placeholder.com/300";
  document.getElementById("modalDetail").style.display = "flex";
}

window.onload = init;
