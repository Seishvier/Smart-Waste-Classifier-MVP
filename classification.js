/* Klasifikasi demo berbasis aturan. Ini BUKAN model AI / computer vision. */
(() => {
  const RULES = [
    { terms: ["battery", "baterai", "aki"], object: "Baterai", category: "Hazardous Waste", material: "Baterai / komponen kimia", bin: "Red", recyclable: false, confidence: 64, safety: "Jangan dibongkar, ditusuk, atau dibakar. Simpan terpisah dengan aman dan serahkan ke titik pengumpulan baterai atau limbah B3." },
    { terms: ["food", "apple", "banana", "fruit", "vegetable", "sayur", "buah", "sisa-makan"], object: "Sisa makanan", category: "Organic Waste", material: "Bahan organik", bin: "Green", recyclable: true, confidence: 68 },
    { terms: ["cardboard", "paper", "kardus", "kertas", "book"], object: "Kertas atau kardus", category: "Paper & Cardboard", material: "Serat kertas / kardus", bin: "Blue", recyclable: true, confidence: 67 },
    { terms: ["bottle", "plastic", "plastik", "wrapper", "kemasan"], object: "Kemasan plastik", category: "Plastic", material: "Plastik (jenis resin belum terverifikasi)", bin: "Yellow", recyclable: true, confidence: 58 },
    { terms: ["can", "aluminum", "metal", "kaleng", "logam"], object: "Kaleng atau benda logam", category: "Metal", material: "Logam (jenis belum terverifikasi)", bin: "Yellow", recyclable: true, confidence: 62 },
    { terms: ["glass", "jar", "kaca"], object: "Wadah kaca", category: "Glass", material: "Kaca", bin: "Yellow", recyclable: true, confidence: 61 },
    { terms: ["phone", "charger", "cable", "electronic", "hp", "kabel", "elektronik"], object: "Perangkat atau aksesori elektronik", category: "E-Waste", material: "Komponen elektronik campuran", bin: "Red", recyclable: false, confidence: 55, safety: "Jangan membongkar perangkat atau baterainya. Cari titik pengumpulan e-waste resmi." },
    { terms: ["shirt", "cloth", "fabric", "baju", "kain"], object: "Kain atau tekstil", category: "Textile", material: "Serat tekstil (belum terverifikasi)", bin: "Grey", recyclable: false, confidence: 52 },
    { terms: ["mask", "syringe", "medical", "medis", "jarum"], object: "Benda medis atau tajam", category: "Medical Waste", material: "Material medis / tajam", bin: "Red", recyclable: false, confidence: 51, safety: "Jangan menyentuh bagian tajam secara langsung atau memasukkannya ke daur ulang rumah tangga. Ikuti panduan fasilitas kesehatan atau layanan limbah setempat." }
  ];

  const TIPS = {
    Green: ["Pisahkan dari plastik dan bahan nonorganik.", "Tiriskan cairan berlebih bila aman.", "Ikuti aturan kompos atau pengumpulan organik di daerahmu."],
    Blue: ["Pastikan kertas atau kardus tetap kering.", "Lepaskan sisa isi dan kotoran yang mudah dibersihkan.", "Lipat kardus agar hemat ruang."],
    Yellow: ["Kosongkan isi kemasan bila aman.", "Bilas ringan jika perlu, lalu keringkan.", "Pisahkan komponen berbeda jika mudah dilepas."],
    Red: ["Jangan membongkar, membakar, atau merusak benda.", "Simpan terpisah dari sampah rumah tangga lain.", "Cari titik pengumpulan khusus yang resmi."],
    Grey: ["Pisahkan bagian yang bisa dikenali bila aman.", "Jangan mencampur bahan berbahaya dengan residu biasa.", "Periksa panduan fasilitas pengelolaan sampah setempat."]
  };

  const FACTS = {
    Green: "Sisa organik tertentu dapat diolah menjadi kompos dalam kondisi yang sesuai.",
    Blue: "Serat kertas dapat didaur ulang, tetapi kualitasnya bisa menurun setelah beberapa siklus.",
    Yellow: "Kemasan yang dapat didaur ulang bergantung pada jenis material dan fasilitas lokal.",
    Red: "Pengumpulan terpisah membantu mencegah bahan berbahaya mencemari aliran sampah biasa.",
    Grey: "Mengurangi barang sekali pakai sejak awal sering kali lebih efektif daripada mengolah residunya."
  };

  const IDEAS = {
    Green: ["Kompos rumah tangga — hanya untuk sisa organik yang sesuai.", "Mulai wadah sisa sayur — pisahkan dari kemasan dan bahan berbahaya.", "Rencanakan porsi makan — kurangi sisa makanan yang belum terpakai."],
    Blue: ["Label penyimpanan — gunakan kardus bersih dan kering.", "Pembatas laci — potong kardus dengan alat yang sesuai dan pengawasan bila perlu.", "Kertas catatan — gunakan sisi kosong kertas yang masih layak."],
    Yellow: ["Wadah alat tulis — hanya gunakan kemasan yang bersih dan tidak tajam.", "Pot tanaman dekoratif — gunakan wadah yang aman dan tidak menampung air berbahaya.", "Sortir kemasan — pisahkan tutup atau bagian berbeda jika aturan lokal memintanya."],
    Red: ["Jangan di-upcycle — pilih pengumpulan khusus.", "Cari drop-off resmi — cek fasilitas limbah B3 atau e-waste setempat.", "Kurangi sumbernya — pilih produk isi ulang yang aman bila tersedia."],
    Grey: ["Gunakan kembali bila masih aman — hanya untuk fungsi nonberbahaya.", "Pisahkan komponen — cek apakah ada bagian yang dapat diterima fasilitas daur ulang.", "Kurangi residu — pilih produk dengan kemasan lebih sederhana."]
  };

  function classifyByFilename(filename) {
    const name = (filename || "").toLowerCase();
    const match = RULES.find(rule => rule.terms.some(term => name.includes(term)));
    const rule = match || {
      object: "Objek belum teridentifikasi", category: "Residual/Other",
      material: "Material belum dapat dipastikan dari simulasi ini", bin: "Grey",
      recyclable: false, confidence: 25
    };
    return buildResult(rule);
  }

  function classifyManual(category) {
    const map = {
      "Organic Waste": ["Sampah organik", "Bahan organik", "Green", true],
      "Paper & Cardboard": ["Kertas atau kardus", "Serat kertas / kardus", "Blue", true],
      "Plastic": ["Benda plastik", "Plastik (jenis belum terverifikasi)", "Yellow", true],
      "Glass": ["Benda kaca", "Kaca", "Yellow", true],
      "Metal": ["Benda logam", "Logam (jenis belum terverifikasi)", "Yellow", true],
      "E-Waste": ["Limbah elektronik", "Komponen elektronik campuran", "Red", false],
      "Hazardous Waste": ["Limbah berbahaya", "Material berbahaya (belum terverifikasi)", "Red", false],
      "Textile": ["Benda tekstil", "Serat tekstil", "Grey", false],
      "Rubber": ["Benda karet", "Karet (jenis belum terverifikasi)", "Grey", false],
      "Composite/Mixed": ["Material campuran", "Material komposit / campuran", "Grey", false],
      "Medical Waste": ["Limbah medis", "Material medis", "Red", false],
      "Residual/Other": ["Sampah residu", "Material belum terverifikasi", "Grey", false]
    };
    const [object, material, bin, recyclable] = map[category] || map["Residual/Other"];
    return buildResult({ object, category, material, bin, recyclable, confidence: 60 });
  }

  function buildResult(rule) {
    const bin = rule.bin;
    return {
      object_name: rule.object,
      confidence: Math.max(0, Math.min(100, Math.round(rule.confidence))),
      category: rule.category,
      bin_color: bin,
      material: rule.material,
      is_recyclable: Boolean(rule.recyclable),
      preparation_tips: [...TIPS[bin]],
      fun_fact: FACTS[bin],
      recycling_ideas: [...IDEAS[bin]],
      safety_note: rule.safety || null,
      demo_mode: true
    };
  }

  window.SWCClassification = { classifyByFilename, classifyManual };
})();
