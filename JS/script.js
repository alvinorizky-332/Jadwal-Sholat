document.addEventListener('DOMContentLoaded', () => {
    const lokasi = document.getElementById('lokasi');
    const tanggal = document.getElementById('tanggal-hari-ini');
    const jamLive = document.getElementById('live-clock');
    const subuhEl = document.getElementById('subuh');
    const dzuhurEl = document.getElementById('dzuhur');
    const asharEl = document.getElementById('ashar');
    const maghribEl = document.getElementById('maghrib');
    const isyaEl = document.getElementById('isya');
    const nextPrayerName = document.getElementById('next-prayer-name');
    const countdownTimer = document.getElementById('countdown-timer');
    const input = document.getElementById('search-input');
    const btnCari = document.getElementById('search-button');
    const btnLokasi = document.getElementById('detect-location-button');

    let prayerTimes = {};
    let nextPrayerIndex = -1;

    // Tampilkan jam real-time
    setInterval(() => {
        const now = new Date();
        jamLive.textContent = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\./g, ':');
        updateCountdown();
        highlightCurrentPrayer(); // Highlight sholat yang sedang tiba waktunya
    }, 1000);

    // Tanggal hari ini
    tanggal.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Ambil waktu sholat berdasarkan kota
    async function getWaktuSholat(city) {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Indonesia&method=20`);
            const data = await res.json();
            const t = data.data.timings;
            subuhEl.textContent = t.Fajr;
            dzuhurEl.textContent = t.Dhuhr;
            asharEl.textContent = t.Asr;
            maghribEl.textContent = t.Maghrib;
            isyaEl.textContent = t.Isha;
            lokasi.textContent = city;
            prayerTimes = {
                Subuh: t.Fajr,
                Dzuhur: t.Dhuhr,
                Ashar: t.Asr,
                Maghrib: t.Maghrib,
                Isya: t.Isha
            };
            updateNextPrayer();
        } catch (e) {
            lokasi.textContent = "Gagal memuat waktu sholat";
            console.log(e);
        }
    }

    // Lokasi otomatis
    function getLokasiOtomatis() {
        if (!navigator.geolocation) {
            lokasi.textContent = "Lokasi tidak didukung";
            return;
        }
        navigator.geolocation.getCurrentPosition(async pos => {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.state;
            getWaktuSholat(city);
        }, () => lokasi.textContent = "Izin lokasi ditolak");
    }

    // Tombol Cari kota
    btnCari.addEventListener('click', async () => {
        const nama = input.value.trim();
        if (!nama) return;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${nama}&limit=1&countrycodes=id`);
        const hasil = await res.json();
        if (hasil.length > 0) {
            const kota = hasil[0].display_name.split(',')[0];
            getWaktuSholat(kota);
        } else {
            lokasi.textContent = "Kota tidak ditemukan";
        }
    });

    // Tombol Lokasi otomatis
    btnLokasi.addEventListener('click', getLokasiOtomatis);

    // Tentukan sholat berikutnya
    function updateNextPrayer() {
        const now = new Date();
        const totalNow = now.getHours() * 60 + now.getMinutes();
        const names = Object.keys(prayerTimes);
        const times = Object.values(prayerTimes).map(t => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        });
        nextPrayerIndex = times.findIndex(t => t > totalNow);
        if (nextPrayerIndex === -1) nextPrayerIndex = 0;
        nextPrayerName.textContent = names[nextPrayerIndex];
    }

    // Hitung mundur ke waktu sholat berikutnya
    function updateCountdown() {
        if (!Object.keys(prayerTimes).length) return;
        const now = new Date();
        const [h, m] = Object.values(prayerTimes)[nextPrayerIndex].split(':').map(Number);
        const nextTime = new Date(now);
        nextTime.setHours(h, m, 0, 0);
        let diff = (nextTime - now) / 1000;
        if (diff < 0) diff += 24 * 3600;
        const hh = Math.floor(diff / 3600);
        const mm = Math.floor((diff % 3600) / 60);
        const ss = Math.floor(diff % 60);
        countdownTimer.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }

    // Highlight kartu sholat yang sedang tiba waktunya
    function highlightCurrentPrayer() {
        // Hapus highlight lama
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('next-prayer-highlight');
        });

        if (!Object.keys(prayerTimes).length) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const prayerMap = {
            'Subuh': subuhEl,
            'Dzuhur': dzuhurEl,
            'Ashar': asharEl,
            'Maghrib': maghribEl,
            'Isya': isyaEl
        };

        for (const [name, el] of Object.entries(prayerMap)) {
            if (el.textContent === currentTime) {
                const card = document.querySelector(`.card[data-prayer="${name}"]`);
                if (card) card.classList.add('next-prayer-highlight');
                break;
            }
        }
    }

    // Jalankan otomatis
    getLokasiOtomatis();
});