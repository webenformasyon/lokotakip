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

### Font Büyütme ve WhatsApp Paylaşım
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:**
  - `src/Home.jsx` - Ana sayfa yeniden tasarlandı
  - `src/AddLoco.jsx` - Font boyutları artırıldı (1.2rem+)
  - `src/LocoDetail.jsx` - Font boyutları artırıldı (1.2rem+)

**Yeni Özellikler:**
1. **Türkçe Tarih Gösterimi**
   - En üstte turuncu banner: "📅 Pazar, 28 Aralık 2025"
   - Gün adı, ay adı ve yıl Türkçe olarak gösteriliyor

2. **Büyük Yazı Tipleri**
   - Tüm fontlar mobilde daha okunabilir (1.1rem - 1.8rem arası)
   - Input ve butonlar daha büyük padding ile
   - Border kalınlıkları artırıldı (2px)

3. **İşlemler Görünümü**
   - Her lokomotif kartında son 3 işlem gösteriliyor
   - İşlemler mavi kenarlı kutularda
   - Başlık ve açıklama ayrı satırlarda

4. **WhatsApp Paylaşım Butonu**
   - Yeşil buton (#25D366) tüm lokoları paylaşmak için
   - Format: Lokomotif adı + Durum + İşlem listesi
   - Türkçe tarih ile başlıyor
   - WhatsApp'a direkt mesaj olarak gönderiyor

### İşlem Sistemi Basitleştirme
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:**
  - `src/Home.jsx` - Son 1 işlem gösterimi
  - `src/LocoDetail.jsx` - Tek input form

**Değişiklikler:**
1. **İşlem Formu Basitleştirildi**
   - Başlık + Açıklama → Sadece tek textarea
   - Placeholder: "İşlem açıklaması (örn: Yağ değişimi yapıldı, frenler kontrol edildi)"
   - Daha hızlı işlem girişi

2. **İşlem Gösterimi**
   - Her loko için son 1 işlem gösteriliyor (önceden 3)
   - Sadece işlem metni (description kaldırıldı)
   - Tarih Türkçe format: "28 Aralık 2025 15:07"

3. **WhatsApp Paylaşım Formatı**
   - Sadece son işlem paylaşılıyor
   - Format: "Son İşlem: [işlem metni]"

4. **Lokomotif Numarası - Font Rengi Düzeltmesi**
   - **Sorun:** Beyaz font kullanıldığı için numaralar görünmüyordu
   - **Çözüm:** Font rengi siyaha çevrildi (#000)
   - Format: "🚂 [loko adı]"
   - **Sonuç:** Artık loko numaraları hem mobilde hem desktop'ta net görünüyor

### Durum Değiştirme Özelliği
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Yeni Özellik:**
1. **Durum Dropdown'u**
   - Her lokomotif kartında durum değiştirme dropdown'u
   - 3 seçenek: 🟢 Faal, 🟠 Cari Tamir, 🔴 Gayri Faal
   - Renkli border ile vurgulama (duruma göre)
   - Anında Supabase'e kaydediliyor

2. **Kullanıcı Deneyimi**
   - Sadece loko adına tıklayınca detay sayfasına gidiyor
   - Dropdown'a tıklayınca durum değiştiriliyor
   - Görsel olarak net ve kullanımı kolay
   - Mobil ve desktop'ta mükemmel çalışıyor

3. **Teknik Detaylar**
   - `changeStatus()` fonksiyonu eklendi
   - Realtime güncelleme mevcut
   - `stopPropagation()` ile olay yayılması engellendi

### Android Mobil İçin Font Büyütme
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `src/AddLoco.jsx`, `src/LocoDetail.jsx`

**Değişiklikler:**
1. **Ana Sayfa (Home.jsx)**
   - Başlık: 2rem (kalın)
   - Loko adı: 1.8rem (kalın)
   - Durum label: 1.3rem
   - Dropdown: 1.2rem, 3px border, 180px genişlik
   - İşlem başlığı: 1.2rem
   - İşlem metni: 1.2rem, line-height 1.5
   - WhatsApp butonu: 1.4rem, 18px padding

2. **Loko Ekleme (AddLoco.jsx)**
   - Başlık: 2rem
   - Geri butonu: 1.4rem
   - Input: 1.4rem, 18px padding, 3px border
   - Select: 1.4rem, emoji eklendi
   - Kaydet butonu: 1.5rem, ✅ emoji

3. **Loko Detay (LocoDetail.jsx)**
   - Başlık: 2rem
   - İşlem geçmişi: 1.6rem
   - Yeni işlem butonu: 1.4rem, ➕ emoji
   - Textarea: 1.3rem, line-height 1.5
   - Kaydet/İptal: 1.4rem, ✅❌ emoji
   - İşlem kartları: 1.3rem, 📅 emoji

**Sonuç:**
- Tüm yazılar Android telefonlarda çok daha net okunuyor
- Border kalınlıkları artırıldı (3px)
- Padding değerleri büyütüldü (18-20px)
- Emoji'ler kullanıcı deneyimini iyileştirdi

