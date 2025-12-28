# Değişiklik Geçmişi

## 28 Aralık 2025

### Faal Alt Durumları Güncellendi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `src/AddLoco.jsx`, `database.md`

**Değişiklikler:**
- "Devam Ediyor" ve "Hazır" yerine 3 yeni durum eklendi:
  - **Bakımsız** (varsayılan)
  - **Bakılıyor**
  - **Hazır**
- Text çakışma sorunu çözüldü
- Database constraint güncellendi: `('bakimsiz', 'bakiliyor', 'hazir')`
- Tüm referanslar güncellendi (Home.jsx, AddLoco.jsx, database.md)

**Fonksiyonellik:**
- Yeni lokomotif eklerken varsayılan durum: "Bakımsız"
- Faal durumuna geçerken varsayılan: "Bakımsız"
- Modal popup'ta 3 seçenek gösteriliyor
- WhatsApp paylaşımında doğru durumlar gösteriliyor

---

### UI/UX İyileştirmeleri - Modal Popup'lar ve WhatsApp Önizleme
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklikler:**

1. **WhatsApp Paylaşım İyileştirmesi:**
   - Açıklama yoksa "Not kaydı yok" yazılmıyor
   - Paylaş butonuna basınca önce textarea'da mesaj gösteriliyor
   - Mesaj düzenlenebilir
   - "Devam Et" butonuna basınca WhatsApp'a yönlendiriliyor

2. **KB ve Faal Popup'ları Modal Yapıldı:**
   - KB1, KB2, KB3 seçenekleri tam ekran modal popup olarak açılıyor
   - Faal alt durumları (Devam Ediyor, Hazır) tam ekran modal popup olarak açılıyor
   - Daha büyük butonlar ve daha iyi görünüm

3. **Lokomotif Numarası Büyütüldü:**
   - Lokomotif numarası font boyutu 0.8rem'den 1.1rem'e çıkarıldı
   - Daha okunabilir hale geldi

4. **Action Sheet Popup:**
   - Sil ve Depodan Gitmiş butonları tek bir "⋯" butonuna birleştirildi
   - Butona basınca action sheet tarzı popup açılıyor (alttan yukarı)
   - Daha modern ve kullanıcı dostu arayüz

**Tasarım:**
- Modal popup'lar: Tam ekran overlay, merkezi konumlandırma
- Action sheet: Alttan yukarı animasyon, yuvarlatılmış köşeler
- WhatsApp preview: Düzenlenebilir textarea, "Devam Et" butonu

---

### Depodan Gitmiş Özelliği
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `database.md`

**Özellik:**
- "Depodan Gitmiş" butonu eklendi (Sil butonunun soluna)
- Lokomotifler depodan gitmiş olarak işaretlenebilir
- `gone` column eklendi (boolean, default: false)
- `gone = true` olan lokomotifler listeden kaldırılır (ama DB'de korunur)

**Fonksiyonellik:**
- Butona tıklandığında onay mesajı gösterilir
- Onaylandığında `gone = true` olarak güncellenir
- Lokomotif listeden kaybolur ama veritabanında durumu korunur
- `loadLocos` fonksiyonu sadece `gone = false` olanları gösterir

**Tasarım:**
- Buton: Turuncu arka plan (#FF9800), beyaz yazı
- Sil butonunun solunda konumlandırıldı
- İkon: 📦 Depodan Gitmiş

**Veritabanı:**
```sql
gone boolean not null default false
```

---

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

### Yeni Lokomotif Ekleme - Faal Durumu Düzeltildi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/AddLoco.jsx`

**Sorun:**
- Yeni lokomotif eklerken faal durumunda ekleme yapmıyordu
- `faal_sub_status` eksikti

**Çözüm:**
- `faalSubStatus` state eklendi (varsayılan: "devam_ediyor")
- Faal durumu seçildiğinde dropdown gösteriliyor (Devam Ediyor / Hazır)
- Save işleminde `faal_sub_status` kaydediliyor

**Tasarım:**
- Faal dropdown: Yeşil border, açık yeşil arka plan
- Bakımda dropdown: Mavi border, açık mavi arka plan
- Her ikisi de aynı stil ve boyutta

---

### Faal Durumuna Popup Eklendi - Devam Ediyor/Hazır
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `database.md`

**Yeni Özellik:**
- "Faal" durumuna da "Bakımda" gibi popup eklendi
- Popup'ta 2 seçenek: "Devam Ediyor" ve "Hazır"
- Seçilen durum "Faal" butonunun sağ altına yazılıyor: "Faal (Devam Ediyor)" veya "Faal (Hazır)"
- Ana sayfadaki "Hazır" butonu kaldırıldı

**Veritabanı:**
- `faal_sub_status` kolonu eklendi: 'devam_ediyor' | 'hazir'
- Trigger güncellendi: Faal değilse faal_sub_status null olur

**⚠️ Veritabanı Migration Gerekli:**

Supabase SQL Editor'da:

```sql
-- faal_sub_status kolonunu ekle
ALTER TABLE locomotives ADD COLUMN IF NOT EXISTS faal_sub_status text;

-- Constraint ekle
ALTER TABLE locomotives DROP CONSTRAINT IF EXISTS locomotives_faal_sub_status_check;
ALTER TABLE locomotives ADD CONSTRAINT locomotives_faal_sub_status_check 
  CHECK (faal_sub_status IN ('devam_ediyor', 'hazir') OR faal_sub_status IS NULL);

-- Trigger'ı güncelle (check_status_constraints fonksiyonu database.md'de)
DROP TRIGGER IF EXISTS enforce_status_constraints ON locomotives;
CREATE TRIGGER enforce_status_constraints
BEFORE INSERT OR UPDATE ON locomotives
FOR EACH ROW
EXECUTE PROCEDURE check_status_constraints();
```

**Davranış:**
1. "Faal" butonuna tıkla → Popup açılır (Devam Ediyor, Hazır)
2. Bir seçenek seç → Popup kapanır, seçilen durum butonun sağ altına yazılır
3. Zaten faal ise → "Faal" butonuna tıklayınca popup açılır/kapanır

**Tasarım:**
- Popup: Butonun hemen altında, beyaz arka plan, yeşil border
- Butonlar: Dikey sıralı, seçili olan vurgulu (koyu yeşil)
- Durum gösterimi: Butonun sağ alt köşesinde küçük text "(Devam Ediyor)" veya "(Hazır)"
- z-index: 1000

---

### KB Seçimi Popup/Dropdown Olarak Değiştirildi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Büyük Değişiklik:**
- KB1, KB2, KB3 butonları artık direkt görünmüyor
- "Bakımda" butonuna tıklandığında popup/dropdown açılıyor
- Seçilen KB, "Bakımda" butonunun sağ altına yazılıyor: "Bakımda (KB1)"

**Davranış:**
1. "Bakımda" butonuna tıkla → Popup açılır (KB1, KB2, KB3)
2. Bir KB seç → Popup kapanır, seçilen KB butonun sağ altına yazılır
3. Zaten bakımda ise → "Bakımda" butonuna tıklayınca popup açılır/kapanır

**Tasarım:**
- Popup: Butonun hemen altında, beyaz arka plan, mavi border
- KB butonları: Dikey sıralı, seçili olan vurgulu
- KB gösterimi: Butonun sağ alt köşesinde küçük text "(KB1)"
- z-index: 1000 (diğer elementlerin üstünde)
- Overflow: Parent container'da overflow: visible (KB3'ün görünmesi için)

**Avantajlar:**
- ✅ Daha temiz görünüm (KB butonları her zaman görünmüyor)
- ✅ Daha az yer kaplıyor
- ✅ Modern dropdown/popup tasarımı
- ✅ Seçilen KB görünüyor

---

### Özel Durum Butonları Popup'a Taşındı
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklik:**
- "Hazır" butonu ana sayfada kaldı
- "Soğuk Sevk", "KB Yaklaşıyor", "Malzeme Bekler" butonları popup'a taşındı
- Bu butonlar textarea'nın altında, Kaydet butonunun üstünde
- Butonlara tıklandığında textarea'ya otomatik metin ekleniyor

**Davranış:**
- Textarea boşsa → Sadece buton metni eklenir: "Soğuk Sevk"
- Textarea doluysa → Mevcut metne eklenir: "Mevcut metin Soğuk Sevk"
- Her buton tıklamasında metin sonuna eklenir

**Tasarım:**
- Popup içinde textarea'nın altında
- 3 buton yan yana (flex, wrap)
- Aynı renkler ve stil (mavi, turuncu, mor)
- Küçük boyut (0.7rem, padding: 6px 12px)

---

### Özel Durum Butonları (Dikdörtgen, Resimsiz)
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Yeni Özellik:**
Lokomotif numarasının sağına 4 özel durum butonu eklendi (dikdörtgen, sadece text):

1. **Hazır** - Yeşil dikdörtgen buton (#4CAF50)
   - Lokomotif hazır durumda

2. **Soğuk Sevk** - Mavi dikdörtgen buton (#2196F3)
   - Soğuk sevk durumu

3. **KB Yaklaşıyor** - Turuncu dikdörtgen buton (#FF9800)
   - Bakım yaklaşıyor uyarısı

4. **Malzeme Bekler** - Mor dikdörtgen buton (#9C27B0)
   - Malzeme bekleniyor

**Tasarım:**
- Dikdörtgen butonlar (padding: 4px 10px)
- Sadece text, resim/ikon yok
- Text: 0.65rem, beyaz, font-weight: 600
- Renkli arka plan + koyu border (1px)
- border-radius: 4px (yuvarlatılmış köşeler)
- Gölge efekti (box-shadow)
- whiteSpace: nowrap (text kırılmaz)
- Hover efekti için cursor: pointer
- Tooltip (title) ile açıklama
- flexWrap: wrap ile responsive

**Konum:**
- Lokomotif numarası ile Sil butonu arasında
- Yatay sıralı, 6px gap ile
- Her buton: sadece text içeriyor

**Not:** Şu an sadece görsel olarak eklendi, tıklama fonksiyonları henüz eklenmedi.

---

### Otomatik Tarih Ekleme Özelliği Kaldırıldı
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklik:**
- Notlara otomatik tarih ekleme özelliği tamamen kaldırıldı
- Artık sadece kullanıcının yazdığı metin kaydediliyor
- `formatLogDate()` fonksiyonu kaldırıldı (artık kullanılmıyor)

**Davranış:**
- Kullanıcı "Yağ değişimi" yazarsa → Sadece "Yağ değişimi" kaydedilir
- Tarih eklenmez, kullanıcı isterse manuel yazabilir
- Boş bırakılırsa → Boş string kaydedilir

---

### Font Boyutları 3'te 1 Azaltıldı
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklik:**
Tüm yazı boyutları %33 azaltıldı (3'te 1)

**Önceki → Yeni:**
- Başlık: 2rem → 1.35rem
- Loko adı: 1.8rem → 1.2rem
- Tarih banner: 1.1rem → 0.75rem
- Durum butonları: 1.1rem → 0.75rem
- KB butonları: 1rem → 0.7rem
- Not içeriği: 1.2rem → 0.8rem
- Popup başlık: 1.5rem → 1.0rem
- Popup butonlar: 1.3rem → 0.9rem
- Sil butonu: 1.1rem → 0.75rem

**Sonuç:**
- ✅ Daha kompakt görünüm
- ✅ Daha fazla içerik sığıyor
- ✅ Mobilde daha iyi okunuyor
- ✅ Modern ve profesyonel görünüm

---

### Veritabanı Yapısı Basitleştirildi - Notlar Tek Column
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `database.md`

**BÜYÜK DEĞİŞİKLİK: locomotive_logs Tablosu Kaldırıldı!**

**ESKİ YAPI (Karmaşık):**
```
locomotives tablosu
locomotive_logs tablosu (ayrı tablo)
  - Her işlem ayrı satır
  - loco_id ile ilişkili
  - Join gerekli
```

**YENİ YAPI (Basit):**
```
locomotives tablosu
  - notes kolonu eklendi (text)
  - Tüm notlar tek bir alanda
  - Join yok, daha hızlı
```

**Avantajları:**
✅ **Çok daha basit** - Tek tablo, tek alan
✅ **Daha hızlı** - Join yok, direkt erişim
✅ **Kolay yedekleme** - Tüm veri tek tabloda
✅ **Az karmaşık** - İlişkisel tablo yok

**Veritabanı Migration:**

Supabase SQL Editor'da:

```sql
-- 1. notes kolonunu ekle
ALTER TABLE locomotives ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- 2. Eski verileri migrate et (opsiyonel)
-- Eğer locomotive_logs tablosunda veri varsa:
UPDATE locomotives l
SET notes = (
  SELECT title 
  FROM locomotive_logs 
  WHERE loco_id = l.id 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM locomotive_logs WHERE loco_id = l.id
);

-- 3. Eski tabloyu kaldır (dikkatli!)
DROP TABLE IF EXISTS locomotive_logs;
```

**Kod Değişiklikleri:**
- `logsMap` state kaldırıldı → `loco.notes` direkt kullanılıyor
- `loadAllLogs()` fonksiyonu kaldırıldı
- `locomotive_logs` subscription kaldırıldı
- `saveLog()` → `saveNotes()` (locomotives tablosunu güncelliyor)
- "İşlem" → "Notlar" terminolojisi

**Kullanım:**
- Not alanına tıkla
- Text yaz veya düzenle
- Kaydet → Tarih otomatik eklenir
- Boş bırak → Tamamen boş kaydedilir

---

### İşlem Düzenleme Davranışı Düzeltildi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklikler:**
1. **ESKİ**: İşlem düzenlerken her zaman eski text'in sonuna ekliyordu
   **YENİ**: Kullanıcı text'i tamamen kontrol ediyor

2. **"İşlem metni boş olamaz" uyarısı kaldırıldı**
   - Artık boş işlem eklenebilir
   - Boş bırakılırsa **tamamen boş** kaydedilir (tarih bile eklenmez)
   - Text varsa tarih eklenir: `"Yağ değişimi (28 Aralık 20:15)"`
   - Text boşsa: `""` (boş string)

**Kullanım:**
- Popup açılınca mevcut text gösterilir
- Text'i **tutup sonuna ekleyebilirsiniz** (manuel olarak)
- Text'i **tamamen silip yeni yazabilirsiniz**
- Sadece textarea'daki metin + tarih kaydedilir

**Örnek:**
```
Mevcut: "Yağ değişimi (28 Aralık 10:00)"
Popup açılır → "Yağ değişimi (28 Aralık 10:00)" görünür

Seçenek 1 - Sonuna ekle:
Yazarsınız: "Yağ değişimi (28 Aralık 10:00) Fren kontrolü"
Kaydedilir: "Yağ değişimi (28 Aralık 10:00) Fren kontrolü (28 Aralık 14:00)"

Seçenek 2 - Tamamen değiştir:
Silersiniz ve yazarsınız: "Motor bakımı"
Kaydedilir: "Motor bakımı (28 Aralık 14:00)"
```

---

### Veritabanı Yapısı Normalize Edildi - kb_type Ayrı Column
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `src/AddLoco.jsx`, `database.md`

**ÖNEMLİ: Veritabanı Yapısı Değişti!**

**ESKİ YAPI (Yanlış):**
```
status: 'faal', 'cari_tamir', 'bakimda_kb1', 'bakimda_kb2', 'bakimda_kb3', 'gayri_faal'
```

**YENİ YAPI (Doğru - Normalize):**
```
status: 'faal', 'cari_tamir', 'bakimda', 'gayri_faal'
kb_type: 'kb1', 'kb2', 'kb3' (sadece status='bakimda' olduğunda)
```

**1. Veritabanı Değişiklikleri**

**locomotives tablosu:**
- `status` - 4 değer: 'faal', 'cari_tamir', 'bakimda', 'gayri_faal'
- `kb_type` - **YENİ COLUMN**: 'kb1', 'kb2', 'kb3' (nullable)
- Trigger eklendi: Bakımda değilse kb_type otomatik null olur

**locomotive_logs tablosu:**
- `status_after` - 4 değer
- `kb_type_after` - **YENİ COLUMN**: KB durumunu loglar

**2. Kod Güncellemeleri**

**Home.jsx:**
- `statusText(status, kbType)` - artık 2 parametre alıyor
- `isBakimda(status)` - sadece status kontrolü yapıyor
- `changeStatus(locoId, newStatus, kbType)` - kb_type parametresi eklendi
- KB butonları `loco.kb_type` ile kontrol ediliyor

**AddLoco.jsx:**
- `kbType` state eklendi
- Bakımda seçildiğinde KB dropdown gösteriliyor
- Save işleminde hem status hem kb_type kaydediliyor

**3. Kullanım**

Ana Sayfada:
1. "🔵 Bakımda" butonuna tıkla → status='bakimda', kb_type='kb1' olur
2. KB1, KB2, KB3 butonları görünür
3. İstediğin KB'ye tıkla → sadece kb_type güncellenir, status='bakimda' kalır
4. Başka duruma geç (Faal, Cari Tamir, Gayri Faal) → kb_type otomatik null olur

Yeni Loko Eklerken:
1. Durum olarak "Bakımda" seç
2. KB dropdown çıkar
3. KB1/KB2/KB3 seç
4. Kaydet

**⚠️ ÇOK ÖNEMLİ - Veritabanı Migration Gerekli:**

Supabase SQL Editor'da bu SQL'i çalıştırın:

```sql
-- 1. YENİ COLUMN'LARI EKLE
ALTER TABLE locomotives ADD COLUMN IF NOT EXISTS kb_type text;
ALTER TABLE locomotive_logs ADD COLUMN IF NOT EXISTS kb_type_after text;

-- 2. CONSTRAINTS EKLE
ALTER TABLE locomotives DROP CONSTRAINT IF EXISTS locomotives_status_check;
ALTER TABLE locomotives ADD CONSTRAINT locomotives_status_check 
  CHECK (status IN ('faal', 'cari_tamir', 'bakimda', 'gayri_faal'));

ALTER TABLE locomotives DROP CONSTRAINT IF EXISTS locomotives_kb_type_check;
ALTER TABLE locomotives ADD CONSTRAINT locomotives_kb_type_check 
  CHECK (kb_type IN ('kb1', 'kb2', 'kb3') OR kb_type IS NULL);

ALTER TABLE locomotive_logs DROP CONSTRAINT IF EXISTS locomotive_logs_status_after_check;
ALTER TABLE locomotive_logs ADD CONSTRAINT locomotive_logs_status_after_check 
  CHECK (status_after IN ('faal', 'cari_tamir', 'bakimda', 'gayri_faal'));

ALTER TABLE locomotive_logs DROP CONSTRAINT IF EXISTS locomotive_logs_kb_type_after_check;
ALTER TABLE locomotive_logs ADD CONSTRAINT locomotive_logs_kb_type_after_check 
  CHECK (kb_type_after IN ('kb1', 'kb2', 'kb3') OR kb_type_after IS NULL);

-- 3. TRIGGER EKLE (kb_type otomatik yönetimi)
CREATE OR REPLACE FUNCTION check_kb_type_constraint()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'bakimda' AND NEW.kb_type IS NULL THEN
    RAISE EXCEPTION 'kb_type must be set when status is bakimda';
  END IF;
  IF NEW.status != 'bakimda' AND NEW.kb_type IS NOT NULL THEN
    NEW.kb_type := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_kb_type ON locomotives;
CREATE TRIGGER enforce_kb_type
BEFORE INSERT OR UPDATE ON locomotives
FOR EACH ROW
EXECUTE PROCEDURE check_kb_type_constraint();

-- 4. ESKİ VERILERI MIGRATE ET (eğer varsa)
-- Eski bakimda_kb1, bakimda_kb2, bakimda_kb3 statusları varsa:
UPDATE locomotives SET status = 'bakimda', kb_type = 'kb1' WHERE status = 'bakimda_kb1';
UPDATE locomotives SET status = 'bakimda', kb_type = 'kb2' WHERE status = 'bakimda_kb2';
UPDATE locomotives SET status = 'bakimda', kb_type = 'kb3' WHERE status = 'bakimda_kb3';

UPDATE locomotive_logs SET status_after = 'bakimda', kb_type_after = 'kb1' WHERE status_after = 'bakimda_kb1';
UPDATE locomotive_logs SET status_after = 'bakimda', kb_type_after = 'kb2' WHERE status_after = 'bakimda_kb2';
UPDATE locomotive_logs SET status_after = 'bakimda', kb_type_after = 'kb3' WHERE status_after = 'bakimda_kb3';
```

**Avantajları:**
✅ Daha temiz veritabanı yapısı
✅ Normalize edilmiş data
✅ KB tipi kolayca değiştirilebilir
✅ Status ve KB birbirinden bağımsız yönetilebilir

---

### Durum Butonu Güncellendi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Değişiklik:**
- Tab butonu "🟠 Tamir" → "🟠 Cari Tamir" olarak güncellendi
- Artık tam isim gösteriliyor: **Faal / Cari Tamir / Gayri Faal**

---

### Tarih Otomatik Text'e Ekleniyor
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**BÜYÜK DEĞİŞİKLİK - Tarih Artık Text İçinde:**

1. **Yeni İşlem Eklerken**
   - Kullanıcı sadece işlem metnini yazar: "Yağ değişimi yapıldı"
   - Sistem otomatik tarih ekler: "Yağ değişimi yapıldı (28 Aralık 20:10)"
   - Bu tam metin veritabanına `title` olarak kaydedilir

2. **Mevcut İşlemi Düzenlerken**
   - Kullanıcı popup'ta sadece mevcut metni görür
   - Yeni bir ekleme yazdığında: "Fren kontrolü yapıldı"
   - Sistem eskiyi korur ve sona ekler: "Yağ değişimi yapıldı (28 Aralık 20:10) Fren kontrolü yapıldı (28 Aralık 21:15)"
   - Tüm işlem geçmişi tek metinde birikir

3. **Görüntüleme**
   - Veritabanındaki tam metin olduğu gibi gösterilir
   - Tarih ayrı bir eleman değil, metnin parçası
   - Tüm geçmiş işlemler ve tarihleri tek satırda

4. **WhatsApp Paylaşımı**
   - Tam metin (tüm işlemler + tarihler) paylaşılır

**Teknik Detaylar:**
- `saveLog()` fonksiyonu güncellendi
- Yeni işlem: `${editLogText} ${dateStamp}`
- Düzenleme: `${editingLog.title} ${editLogText} ${dateStamp}`
- `formatLogDate()` şimdiki zamanı formatlar
- Tarih format: `(28 Aralık 20:10)`

**Örnek Akış:**
```
İlk ekleme:    "Yağ değişimi" → "Yağ değişimi (28 Aralık 10:00)"
Düzenleme:     "Fren kontrolü" → "Yağ değişimi (28 Aralık 10:00) Fren kontrolü (28 Aralık 14:30)"
Tekrar düzenleme: "Motor bakımı" → "Yağ değişimi (28 Aralık 10:00) Fren kontrolü (28 Aralık 14:30) Motor bakımı (28 Aralık 18:00)"
```

---

### İşlem Yönetimi Basitleştirildi
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosyalar:** `src/Home.jsx`, `src/App.jsx`

**Değişiklikler:**

1. **Detay Sayfası Kaldırıldı**
   - `LocoDetail.jsx` artık kullanılmıyor
   - Tüm işlemler ana sayfada yapılıyor
   - Daha hızlı ve kolay kullanım

2. **Tek Popup ile Hem Ekleme Hem Düzenleme**
   - İşlem varsa: Mevcut işlem gösteriliyor, tıklayınca düzenleme popup'ı
   - İşlem yoksa: "+ İşlemler için tıklayın" mesajı
   - Her iki durumda da aynı popup kullanılıyor
   - Popup'ta: Textarea, Kaydet, Sil (sadece düzenlemede), Kapat butonları

3. **"Yeni İşlem Ekle" Butonu Kaldırıldı**
   - Artık işlem alanına direkt tıklanıyor
   - Daha sezgisel kullanım

4. **Metin Değişikliği**
   - "İşlem eklemek için tıklayın" → "İşlemler için tıklayın"

**Teknik Detaylar:**
- `openAddLog()` fonksiyonu eklendi
- `saveLog()` fonksiyonu hem ekleme hem güncelleme yapıyor
- `closeLogPopup()` fonksiyonu tüm popup state'lerini temizliyor
- `editingLocoId` state'i yeni işlem için loko id'yi tutuyor
- `App.jsx`'den `onSelect` props'u kaldırıldı

---

### Büyük UI Değişiklikleri
- **Tarih:** 28 Aralık 2025
- **Güncellenen Dosya:** `src/Home.jsx`

**Yeni Özellikler:**

1. **Tab/Switch Durum Seçici**
   - Dropdown kaldırıldı
   - 3 tab butonu: 🟢 Faal, 🟠 Tamir, 🔴 Gayri Faal
   - Seçili tab kalın border (3px) ve renkli arka plan
   - Seçili olmayan tab ince border (2px) ve beyaz
   - Her tab tıklanabilir ve anında güncelleniyor

2. **Lokomotif Silme**
   - Her lokoda 🗑️ Sil butonu (kırmızı)
   - Onay dialogu ile silme
   - `is_active = false` yapıyor (soft delete)
   - Silinen lokolar listeden kalkıyor

3. **İşlem Yönetimi Yenilendi**
   - "Son İşlem:" başlığı kaldırıldı
   - İşlem metni direkt gösteriliyor (mavi kutu)
   - İşleme tıklayınca popup açılıyor
   - İşlem yoksa: "+ İşlem eklemek için tıklayın"

4. **İşlem Düzenleme Popup**
   - Tam ekran modal overlay
   - Textarea ile düzenleme
   - 3 buton: ✅ Kaydet, 🗑️ Sil, ✖️ Kapat
   - Popup dışına tıklayınca kapanıyor
   - Silme işleminde onay dialogu

5. **Detay Sayfası Kaldırıldı**
   - Artık detay sayfasına gerek yok
   - Tüm işlemler ana sayfada
   - Daha hızlı kullanım

**Teknik Detaylar:**
- `editingLog` state ile popup kontrolü
- `openEditLog()`, `saveEditLog()`, `deleteLog()` fonksiyonları
- `deleteLoco()` fonksiyonu soft delete için
- Event propagation kontrolü (`stopPropagation()`)
- Hover efektleri eklendi

