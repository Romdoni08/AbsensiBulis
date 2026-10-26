
const STORAGE = {
  petugas: "piket_malam_petugas_v1",
  absensi: "piket_malam_absensi_v1"
};

const ASRAMA = [
  "Al Bahir 1",
  "Al Bahir 2",
  "Al Bahir 3",
  "Al Izza 1",
  "Al Izza 2",
  "Al Izza 3"
];

const STATUS = ["Hadir", "Tidak Hadir", "Izin"];

function loadData(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let petugas = loadData(STORAGE.petugas);
let absensi = loadData(STORAGE.absensi);
let toastTimer;

const $ = id => document.getElementById(id);

function savePetugas() {
  localStorage.setItem(STORAGE.petugas, JSON.stringify(petugas));
}

function saveAbsensi() {
  localStorage.setItem(STORAGE.absensi, JSON.stringify(absensi));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentMonth() {
  return todayLocal().slice(0, 7);
}

function monthOptions() {
  const names = [
    "Januari", "Februari", "Maret", "April",
    "Mei", "Juni", "Juli", "Agustus",
    "September", "Oktober", "November", "Desember"
  ];

  const months = [];
  for (let year = 2026; year <= 2027; year++) {
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      if (key >= "2026-09" && key <= "2027-06") {
        months.push({
          value: key,
          label: `${names[month - 1]} ${year}`
        });
      }
    }
  }
  return months;
}

function populateMonthSelect(id) {
  const select = $(id);
  select.innerHTML = monthOptions().map(month =>
    `<option value="${month.value}">${month.label}</option>`
  ).join("");
  select.value = currentMonth();
}

function populateAsramaSelect(id) {
  const select = $(id);
  const previous = select.value;

  select.innerHTML =
    '<option value="">Semua asrama</option>' +
    ASRAMA.map(name =>
      `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
    ).join("");

  if (ASRAMA.includes(previous)) select.value = previous;
}

function monthLabel(monthKey) {
  const item = monthOptions().find(month => month.value === monthKey);
  return item ? item.label : monthKey;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function makeEmptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}" class="table-empty">${escapeHTML(message)}</td></tr>`;
}

function statusBadge(status) {
  const classes = {
    "Hadir": "status-hadir",
    "Tidak Hadir": "status-tidak-hadir",
    "Izin": "status-izin"
  };

  if (!status) {
    return '<span class="status-badge status-belum">Belum diisi</span>';
  }

  return `<span class="status-badge ${classes[status] || "status-belum"}">${escapeHTML(status)}</span>`;
}

function sortPetugas(list) {
  return [...list].sort((a, b) =>
    a.asrama.localeCompare(b.asrama, "id") ||
    a.nama.localeCompare(b.nama, "id")
  );
}

function getAttendance(petugasId, tanggal) {
  return absensi.find(item =>
    item.petugasId === petugasId && item.tanggal === tanggal
  );
}

function getMonthAttendance(month) {
  return absensi.filter(item =>
    item.tanggal.startsWith(month) &&
    STATUS.includes(item.status)
  );
}

function getVisiblePetugas(searchId, asramaId) {
  const keyword = $(searchId).value.trim().toLowerCase();
  const asrama = $(asramaId).value;

  return sortPetugas(petugas.filter(item =>
    (!asrama || item.asrama === asrama) &&
    (!keyword ||
      item.nama.toLowerCase().includes(keyword) ||
      item.asrama.toLowerCase().includes(keyword))
  ));
}

/* Navigasi */

const pageNames = {
  dashboard: "Dashboard",
  absensi: "Absensi Petugas",
  petugas: "Data Petugas",
  rekap: "Rekap Kehadiran"
};

function navigate(page) {
  if (!pageNames[page]) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== `page-${page}`);
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("pageTitle").textContent = pageNames[page];
  $("sidebar").classList.remove("open");

  if (page === "dashboard") renderDashboard();
  if (page === "petugas") renderPetugas();
  if (page === "absensi") renderAbsensi();
  if (page === "rekap") renderRekap();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

$("menuToggle").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* Data petugas */

function openPetugasModal(item = null) {
  $("petugasForm").reset();
  $("editPetugasId").value = item ? item.id : "";
  $("modalTitle").textContent = item ? "Edit Petugas" : "Tambah Petugas";
  $("namaPetugas").value = item ? item.nama : "";
  $("asramaPetugas").value = item ? item.asrama : ASRAMA[0];
  $("petugasModal").classList.remove("hidden");
  $("namaPetugas").focus();
}

function closePetugasModal() {
  $("petugasModal").classList.add("hidden");
}

$("btnTambahPetugas").addEventListener("click", () => openPetugasModal());
$("closeModal").addEventListener("click", closePetugasModal);
$("batalModal").addEventListener("click", closePetugasModal);

$("petugasModal").addEventListener("click", event => {
  if (event.target === $("petugasModal")) closePetugasModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePetugasModal();
});

$("petugasForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("editPetugasId").value;
  const nama = $("namaPetugas").value.trim();
  const asrama = $("asramaPetugas").value;

  if (!nama) {
    showToast("Nama petugas wajib diisi.");
    return;
  }

  const duplicate = petugas.some(item =>
    item.nama.trim().toLowerCase() === nama.toLowerCase() &&
    item.asrama === asrama &&
    item.id !== id
  );

  if (duplicate) {
    showToast("Nama dan asrama tersebut sudah terdaftar.");
    return;
  }

  if (id) {
    const item = petugas.find(person => person.id === id);
    if (item) {
      item.nama = nama;
      item.asrama = asrama;
    }
    showToast("Data petugas berhasil diperbarui.");
  } else {
    petugas.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      nama,
      asrama,
      dibuat: todayLocal()
    });
    showToast("Petugas berhasil ditambahkan.");
  }

  savePetugas();
  closePetugasModal();
  refreshAll();
});

function deletePetugas(id) {
  const item = petugas.find(person => person.id === id);
  if (!item) return;

  const confirmed = confirm(
    `Hapus petugas "${item.nama}" dari daftar?\n\n` +
    "Riwayat absensinya juga akan dihapus."
  );

  if (!confirmed) return;

  petugas = petugas.filter(person => person.id !== id);
  absensi = absensi.filter(record => record.petugasId !== id);

  savePetugas();
  saveAbsensi();
  refreshAll();
  showToast("Data petugas dan riwayatnya telah dihapus.");
}

function renderPetugas() {
  const list = getVisiblePetugas("cariPetugas", "filterAsramaPetugas");
  const tbody = $("petugasTable");

  if (!list.length) {
    tbody.innerHTML = makeEmptyRow(
      5,
      petugas.length
        ? "Tidak ada petugas yang cocok dengan pencarian."
        : "Belum ada petugas. Klik Tambah Petugas untuk memulai."
    );
  } else {
    tbody.innerHTML = list.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(item.nama)}</strong></td>
        <td>${escapeHTML(item.asrama)}</td>
        <td>${escapeHTML(item.dibuat || "-")}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-edit="${escapeHTML(item.id)}">Edit</button>
            <button class="icon-btn delete" data-delete="${escapeHTML(item.id)}">Hapus</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  $("jumlahPetugas").textContent = `${petugas.length} petugas terdaftar`;

  tbody.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      const item = petugas.find(person => person.id === button.dataset.edit);
      if (item) openPetugasModal(item);
    });
  });

  tbody.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => deletePetugas(button.dataset.delete));
  });
}

$("cariPetugas").addEventListener("input", renderPetugas);
$("filterAsramaPetugas").addEventListener("change", renderPetugas);

/* Absensi */

function renderAbsensi() {
  const tanggal = $("tanggalAbsensi").value;
  const list = getVisiblePetugas("cariAbsensi", "filterAsramaAbsensi");
  const tbody = $("absensiTable");

  if (!tanggal) {
    tbody.innerHTML = makeEmptyRow(4, "Silakan pilih tanggal piket.");
    $("absensiCount").textContent = "0 petugas";
    return;
  }

  if (!list.length) {
    tbody.innerHTML = makeEmptyRow(
      4,
      petugas.length
        ? "Tidak ada petugas yang cocok dengan filter."
        : "Daftar petugas masih kosong. Tambahkan petugas terlebih dahulu."
    );
    $("absensiCount").textContent = "0 petugas";
    return;
  }

  tbody.innerHTML = list.map((person, index) => {
    const record = getAttendance(person.id, tanggal);
    const status = record ? record.status : "";

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(person.nama)}</strong></td>
        <td>${escapeHTML(person.asrama)}</td>
        <td>
          <select
            class="table-select"
            data-attendance="${escapeHTML(person.id)}"
            aria-label="Status ${escapeHTML(person.nama)}"
          >
            <option value="" ${!status ? "selected" : ""}>Pilih status</option>
            ${STATUS.map(option =>
              `<option value="${option}" ${status === option ? "selected" : ""}>${option}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-attendance]").forEach(select => {
    select.addEventListener("change", () => {
      setAttendance(
        select.dataset.attendance,
        tanggal,
        select.value
      );
    });
  });

  $("absensiCount").textContent =
    `${list.length} petugas ditampilkan`;
}

function setAttendance(petugasId, tanggal, status) {
  const person = petugas.find(item => item.id === petugasId);
  if (!person) return;

  const index = absensi.findIndex(item =>
    item.petugasId === petugasId && item.tanggal === tanggal
  );

  if (!STATUS.includes(status)) {
    if (index !== -1) absensi.splice(index, 1);
  } else if (index === -1) {
    absensi.push({
      petugasId,
      nama: person.nama,
      asrama: person.asrama,
      tanggal,
      status,
      diperbarui: new Date().toISOString()
    });
  } else {
    absensi[index].nama = person.nama;
    absensi[index].asrama = person.asrama;
    absensi[index].status = status;
    absensi[index].diperbarui = new Date().toISOString();
  }

  saveAbsensi();
  renderAbsensi();
  renderDashboard();
  renderRekap();
  showToast("Status absensi tersimpan.");
}

$("buatAbsensi").addEventListener("click", () => {
  if (!petugas.length) {
    showToast("Tambahkan data petugas terlebih dahulu.");
    navigate("petugas");
    return;
  }

  renderAbsensi();
  showToast("Daftar petugas ditampilkan untuk tanggal terpilih.");
});

$("tanggalAbsensi").value = todayLocal();
$("tanggalAbsensi").addEventListener("change", renderAbsensi);
$("filterAsramaAbsensi").addEventListener("change", renderAbsensi);
$("cariAbsensi").addEventListener("input", renderAbsensi);

/* Dashboard */

function countStatuses(records) {
  return {
    Hadir: records.filter(item => item.status === "Hadir").length,
    "Tidak Hadir": records.filter(item => item.status === "Tidak Hadir").length,
    Izin: records.filter(item => item.status === "Izin").length
  };
}

function renderDashboard() {
  const month = $("dashboardBulan").value || currentMonth();
  const records = getMonthAttendance(month);
  const counts = countStatuses(records);

  $("statPetugas").textContent = petugas.length;
  $("statHadir").textContent = counts.Hadir;
  $("statTidak").textContent = counts["Tidak Hadir"];
  $("statIzin").textContent = counts.Izin;

  $("labelHadir").textContent = monthLabel(month);
  $("labelTidak").textContent = monthLabel(month);
  $("labelIzin").textContent = monthLabel(month);

  renderChart(counts);
  renderRecent();
}

function renderChart(counts) {
  const values = [
    { key: "Hadir", value: counts.Hadir, className: "hadir" },
    { key: "Tidak Hadir", value: counts["Tidak Hadir"], className: "tidak" },
    { key: "Izin", value: counts.Izin, className: "izin" }
  ];

  const max = Math.max(1, ...values.map(item => item.value));

  $("summaryChart").innerHTML = values.map(item => {
    const height = Math.max(3, item.value / max * 145);

    return `
      <div class="chart-column" title="${escapeHTML(item.key)}: ${item.value}">
        <div
          class="chart-bar ${item.className}"
          style="height:${height}px"
          aria-label="${escapeHTML(item.key)} ${item.value}"
        ></div>
      </div>
    `;
  }).join("");
}

function renderRecent() {
  const recent = [...absensi]
    .filter(item => STATUS.includes(item.status))
    .sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal) ||
      (b.diperbarui || "").localeCompare(a.diperbarui || "")
    )
    .slice(0, 6);

  $("recentTable").innerHTML = recent.length
    ? recent.map(item => `
        <tr>
          <td>${escapeHTML(item.tanggal)}</td>
          <td>${escapeHTML(item.nama || getPersonName(item.petugasId))}</td>
          <td>${escapeHTML(item.asrama || getPersonDorm(item.petugasId))}</td>
          <td>${statusBadge(item.status)}</td>
        </tr>
      `).join("")
    : makeEmptyRow(4, "Belum ada catatan absensi.");
}

function getPersonName(id) {
  return petugas.find(item => item.id === id)?.nama || "Petugas dihapus";
}

function getPersonDorm(id) {
  return petugas.find(item => item.id === id)?.asrama || "-";
}

$("dashboardBulan").addEventListener("change", renderDashboard);

/* Rekap per petugas dan asrama */

function renderRekap() {
  const month = $("rekapBulan").value || currentMonth();
  const filterAsrama = $("rekapAsrama").value;
  const keyword = $("cariRekap").value.trim().toLowerCase();

  const records = getMonthAttendance(month);
  const counts = countStatuses(records);

  $("rekapTotal").textContent = records.length;
  $("rekapHadir").textContent = counts.Hadir;
  $("rekapTidak").textContent = counts["Tidak Hadir"];
  $("rekapIzin").textContent = counts.Izin;

  const list = sortPetugas(petugas.filter(person =>
    (!filterAsrama || person.asrama === filterAsrama) &&
    (!keyword ||
      person.nama.toLowerCase().includes(keyword) ||
      person.asrama.toLowerCase().includes(keyword))
  ));

  const tbody = $("rekapTable");

  if (!list.length) {
    tbody.innerHTML = makeEmptyRow(7, "Belum ada data petugas.");
  } else {
    tbody.innerHTML = list.map((person, index) => {
      const ownRecords = records.filter(record =>
        record.petugasId === person.id
      );

      const ownCounts = countStatuses(ownRecords);

      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHTML(person.nama)}</strong></td>
          <td>${escapeHTML(person.asrama)}</td>
          <td>${ownCounts.Hadir}</td>
          <td>${ownCounts["Tidak Hadir"]}</td>
          <td>${ownCounts.Izin}</td>
          <td>${ownRecords.length}</td>
        </tr>
      `;
    }).join("");
  }

  renderRekapAsrama(records, filterAsrama);
}

function renderRekapAsrama(records, filterAsrama) {
  const asramaDitampilkan = filterAsrama ? [filterAsrama] : ASRAMA;

  $("rekapAsramaTable").innerHTML = asramaDitampilkan.map(asrama => {
    const own = records.filter(record => {
      const person = petugas.find(item => item.id === record.petugasId);
      return (person?.asrama || record.asrama) === asrama;
    });

    const counts = countStatuses(own);

    return `
      <tr>
        <td><strong>${escapeHTML(asrama)}</strong></td>
        <td>${counts.Hadir}</td>
        <td>${counts["Tidak Hadir"]}</td>
        <td>${counts.Izin}</td>
        <td>${own.length}</td>
      </tr>
    `;
  }).join("");
}

$("rekapBulan").addEventListener("change", renderRekap);
$("rekapAsrama").addEventListener("change", renderRekap);
$("cariRekap").addEventListener("input", renderRekap);

/* Ekspor CSV */

function downloadCSV(filename, headers, rows) {
  const content = [headers, ...rows]
    .map(row => row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

$("exportPetugas").addEventListener("click", () => {
  const list = getVisiblePetugas("cariPetugas", "filterAsramaPetugas");

  downloadCSV(
    "data-petugas.csv",
    ["Nama Petugas", "Asrama", "Tanggal Terdaftar"],
    list.map(item => [item.nama, item.asrama, item.dibuat || ""])
  );
});

$("exportAbsensi").addEventListener("click", () => {
  const tanggal = $("tanggalAbsensi").value;
  if (!tanggal) {
    showToast("Pilih tanggal absensi terlebih dahulu.");
    return;
  }

  const list = getVisiblePetugas("cariAbsensi", "filterAsramaAbsensi");

  downloadCSV(
    `absensi-${tanggal}.csv`,
    ["Tanggal", "Nama Petugas", "Asrama", "Status"],
    list.map(person => {
      const record = getAttendance(person.id, tanggal);
      return [
        tanggal,
        person.nama,
        person.asrama,
        record?.status || "Belum diisi"
      ];
    })
  );
});

$("exportRekap").addEventListener("click", () => {
  const month = $("rekapBulan").value || currentMonth();
  const filterAsrama = $("rekapAsrama").value;
  const keyword = $("cariRekap").value.trim().toLowerCase();

  const list = sortPetugas(petugas.filter(person =>
    (!filterAsrama || person.asrama === filterAsrama) &&
    (!keyword ||
      person.nama.toLowerCase().includes(keyword) ||
      person.asrama.toLowerCase().includes(keyword))
  ));

  const records = getMonthAttendance(month);

  downloadCSV(
    `rekap-piket-${month}.csv`,
    ["Nama Petugas", "Asrama", "Hadir", "Tidak Hadir", "Izin", "Total"],
    list.map(person => {
      const own = records.filter(item => item.petugasId === person.id);
      const counts = countStatuses(own);

      return [
        person.nama,
        person.asrama,
        counts.Hadir,
        counts["Tidak Hadir"],
        counts.Izin,
        own.length
      ];
    })
  );
});

/* Perbarui tampilan setelah perubahan data */

function refreshAll() {
  populateAsramaSelect("filterAsramaPetugas");
  populateAsramaSelect("filterAsramaAbsensi");
  populateAsramaSelect("rekapAsrama");

  renderPetugas();
  renderAbsensi();
  renderDashboard();
  renderRekap();
}

/* Inisialisasi */

populateMonthSelect("dashboardBulan");
populateMonthSelect("rekapBulan");

refreshAll();
