# Değişiklik Geçmişi

## 28 Aralık 2025

### Paket Yüklemeleri
- **Eklenen Dosya:** `package.json`
- **Değişiklik:** `@supabase/supabase-js` paketi projeye eklendi
- **Detay:** Supabase client kütüphanesi yüklendi ve bağımlılıklara eklendi

### Build İşlemi
- **Sonuç:** Production build başarıyla oluşturuldu (`dist/` klasörü)
- **Dosyalar:** 
  - `dist/index.html` (0.46 kB)
  - `dist/assets/index-DQ3P1g1z.css` (0.91 kB)
  - `dist/assets/index-Cc_Hinlg.js` (363.49 kB)
- **Not:** Node.js versiyon uyarısı mevcut (20.11.1 kullanılıyor, 20.19+ öneriliyor)
- **Çözülen Sorun:** node_modules eksikliği giderildi (`npm install` ile)

### İkonlar ve PWA Varlıkları
- **Eklenen Klasör:** `public/icons/`
- **Oluşturulan Dosyalar:**
  - `public/icons/icon.svg` (1.2 KB) - Kaynak lokomotif ikonu
  - `public/icons/icon-192.png` (9.7 KB) - 192x192 PWA ikonu
  - `public/icons/icon-512.png` (17 KB) - 512x512 PWA ikonu
- **Tasarım:** Turuncu arka plan üzerine siyah lokomotif, duman efekti ile

### Git Yapılandırması
- **Oluşturulan Dosya:** `.gitignore`
- **Git'ten Çıkarılan Dosyalar:**
  - `node_modules/` klasörü (4862 dosya, ~1.2M satır kod)
  - `dist/` klasörü (build çıktıları, 4 dosya)
  - `.DS_Store` (macOS sistem dosyası)
- **Toplam:** 4867 dosya git takibinden çıkarıldı
- **Sonuç:** Repository boyutu önemli ölçüde küçültüldü

### UI İyileştirmeleri
- **Düzenlenen Dosya:** `src/AddLoco.jsx`
- **Eklenen Özellik:** "← Geri" butonu eklendi
- **Amaç:** Kullanıcıların yeni lokomotif ekleme sayfasından ana listeye kolayca dönebilmesi
- **Test Edildi:** Dev server'da (localhost:5173) tam çalışır durumda

### Responsive Tasarım ve PWA
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:**
  - `src/index.css` - Body layout düzeltildi
  - `src/App.css` - Responsive container eklendi
  - `src/Home.jsx` - Mobil uyumlu, responsive kartlar ve tipografi (clamp kullanımı)
  - `src/AddLoco.jsx` - Mobil uyumlu form, responsive inputlar
  - `src/LocoDetail.jsx` - **prompt() kaldırıldı**, modern form UI eklendi, mobil uyumlu
  - `src/App.jsx` - FAB (Floating Action Button) geliştirildi, hover efektleri
  - `index.html` - PWA meta tags, theme-color, mobil viewport ayarları
  - `public/manifest.json` - PWA manifest dosyası oluşturuldu

### İşlem Ekleme Düzeltmesi  
- **Sorun:** "Yeni İşlem Ekle" butonu `prompt()` kullandığı için mobilde çalışmıyordu
- **Çözüm:** Modern form UI eklendi (input + textarea + Kaydet/İptal butonları)
- **Özellikler:**
  - Açık mavi arka plan ile vurgulu form
  - İşlem başlığı ve açıklama alanları
  - Kaydet (yeşil) ve İptal (kırmızı) butonları
  - Form state yönetimi ile kontrol
- **Sonuç:** Mobil ve desktop'ta sorunsuz çalışıyor

