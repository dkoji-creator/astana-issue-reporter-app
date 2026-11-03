# Публикация в Google Play и App Store

Код к магазинам готов: иконка, удаление аккаунта, политика конфиденциальности, условия использования, модерация («Пожаловаться», «Заблокировать автора»). Остались шаги, которые можно сделать только с вашими аккаунтами.

## 0. Сколько стоит и сколько ждать

| | Google Play | App Store |
|---|---|---|
| Аккаунт разработчика | **$25** один раз | **$99** в год |
| Проверка аккаунта | 1–3 дня (паспорт; может попросить подтвердить через Android-телефон) | 1–2 дня |
| До публикации | Новый личный аккаунт: **закрытое тестирование, 12 тестировщиков, 14 дней подряд**, потом запрос на публикацию | Проверка приложения 1–3 дня |
| Mac нужен? | — | Нет, сборка на серверах Expo |

> Совет: бесплатный Render засыпает, и первый запрос идёт до минуты. Проверяющий Apple может решить, что приложение «не грузится». На время проверки лучше включить тариф **Starter ($7/мес)**: Render → сервис → **Settings → Instance Type**.

## 1. Сервер на Render

После того как я отправлю код в GitHub, Render обновит сервер сам. Добавьте две переменные: Render → **astana-issue-reporter-api** → **Environment** → **Add Environment Variable**:

| Key | Value |
|---|---|
| `CONTACT_EMAIL` | почта для вопросов пользователей (будет видна всем на странице политики) |
| `ADMIN_PASSWORD` | **новый пароль админа**, 8+ символов. `Pass1234!` знают все, кто видел код |

**Save Changes** → сервер перезапустится. Проверьте в браузере, что открываются:
- `https://astana-issue-reporter-api.onrender.com/privacy`
- `https://astana-issue-reporter-api.onrender.com/terms`
- `https://astana-issue-reporter-api.onrender.com/delete-account`

С этого момента админ входит как `user1@example.kz` с новым паролем.

## 2. Свежий код на ноутбуке

Как в прошлый раз: **Code → Download ZIP** → `robocopy ... C:\astana /E /XD node_modules`, затем в `cmd`:
```
cd C:\astana\mobile
npm install
set EAS_NO_VCS=1
npx eas-cli@latest init
```
`init` просто привяжет проект к вашему аккаунту Expo (если спросит, отвечайте `Y`).

> Название пакета `kz.aitu.astanareporter` после первой загрузки в магазин поменять нельзя. Если хотите другое, скажите мне до сборки.

## 3. Google Play

1. **Аккаунт:** https://play.google.com/console/signup → тип **Personal** (Личный) → оплатите $25 → пройдите проверку личности.
2. **Сборка** (идёт 15–30 минут на серверах Expo):
   ```
   npx eas-cli@latest build -p android --profile production
   ```
   На вопрос `Generate a new Android Keystore?` ответьте `Y`. В конце будет ссылка: скачайте файл **.aab**.
3. **Play Console → Create app:** название `Astana Issue Reporter`, язык English, **App**, **Free**, отметьте согласия → **Create app**.
4. **Dashboard → Set up your app** (заполните каждый пункт, ответы в разделе 6):
   - Privacy policy: `https://astana-issue-reporter-api.onrender.com/privacy`
   - App access: **All or some functionality is restricted** → добавьте демо-аккаунт `user2@example.kz` / `Pass1234!`
   - Ads: **No**
   - Content rating: анкета, ответы ниже
   - Target audience: **18 and over**
   - Data safety: ответы ниже
   - Government apps: **No** (приложение не от акимата)
   - Store listing: тексты из раздела 5, иконка `mobile/assets/store/play-icon-512.png`, скриншоты (раздел 7)
5. **Testing → Closed testing → Create track** → **Create release** → загрузите **.aab** → **Save** → **Review release** → **Start rollout**.
   Во вкладке **Testers** создайте список email (минимум **12 человек**: одногруппники, друзья с Android), скопируйте ссылку для тестировщиков и разошлите. Каждый должен открыть ссылку, нажать **Become a tester** и установить приложение.
6. Через **14 дней** → **Dashboard → Apply for production** → ответьте на вопросы о тесте → после одобрения **Production → Create release** → тот же .aab → **Start rollout**.

## 4. App Store

1. **Аккаунт:** https://developer.apple.com/programs/enroll → войдите своим Apple ID (нужна двухфакторная защита) → **Individual** → оплатите $99. Дождитесь письма «Welcome to the Apple Developer Program».
2. **Сборка:**
   ```
   npx eas-cli@latest build -p ios --profile production
   ```
   Войдите Apple ID, на вопросы про сертификаты (`Generate a new Apple Distribution Certificate?`, `Generate a new Apple Provisioning Profile?`) отвечайте `Y`.
3. **Отправка в App Store Connect:**
   ```
   npx eas-cli@latest submit -p ios --latest
   ```
   EAS сам создаст приложение в App Store Connect и загрузит сборку. Через 10–30 минут она появится в **TestFlight**.
4. https://appstoreconnect.apple.com → **Apps → Astana Issue Reporter**:
   - **App Information:** Subtitle и категория (раздел 5), Privacy Policy URL `https://astana-issue-reporter-api.onrender.com/privacy`.
   - **App Privacy:** ответы в разделе 6.
   - **Age Rating:** ответы в разделе 6.
   - **Pricing:** Free.
   - Страница версии **1.0**: скриншоты, описание, ключевые слова, Support URL `https://astana-issue-reporter-api.onrender.com/terms`, в **Build** выберите сборку, в **App Review Information** демо-аккаунт и заметки (раздел 6).
   - **Add for Review** → **Submit**.

## 5. Тексты для страницы в магазине

**Название:** Astana Issue Reporter

**Короткое описание (Google, до 80 символов)**
- EN: `Report city problems in Astana with a photo and a map pin. Follow the status.`
- RU: `Сообщайте о проблемах Астаны: фото, метка на карте и статус исправления`

**Подзаголовок (Apple, до 30 символов)**
- EN: `City problems on the map`
- RU: `Проблемы города на карте`

**Ключевые слова (Apple, до 100 символов)**
- EN: `astana,city,pothole,street light,trash,road,report,problem,map,complaint,lighting,park`
- RU: `астана,город,яма,фонарь,мусор,дорога,жалоба,проблема,карта,освещение,двор`

**Категория:** Google: *Maps & Navigation*. Apple: *Utilities* (вторая *Navigation*).

**Полное описание (EN)**
```
See a pothole, a broken street light or an overflowing trash bin in Astana? Report it in under a minute.

• Take a photo — the app compresses it automatically
• Your location is filled in from GPS, or tap the exact spot on the map
• Choose a category: Roads & Potholes, Lighting, Landscaping or Trash
• Add a short description and send

All reports are on one map of Astana with coloured status badges: Under Review, In Progress, Resolved. Like the reports of other residents to raise their priority — the list is sorted by likes, so the most important problems come first.

When city service staff change the status of your report, you get a notification.

The app is available in English, Russian and Kazakh.

Astana Issue Reporter is an unofficial student project of Astana IT University and is not affiliated with the city administration (akimat) of Astana.
```

**Полное описание (RU)**
```
Увидели яму на дороге, неработающий фонарь или переполненную урну в Астане? Сообщите об этом меньше чем за минуту.

• Сделайте фото — приложение само его сожмёт
• Место определяется по GPS, или нажмите нужную точку на карте
• Выберите категорию: дороги и ямы, освещение, благоустройство или мусор
• Добавьте короткое описание и отправьте

Все заявки на одной карте Астаны с цветными статусами: «На рассмотрении», «В работе», «Решено». Ставьте лайки заявкам других жителей, чтобы поднять их приоритет: список отсортирован по лайкам, и самые важные проблемы видны первыми.

Когда городская служба меняет статус вашей заявки, вы получаете уведомление.

Приложение на английском, русском и казахском языках.

Astana Issue Reporter — неофициальный студенческий проект Astana IT University, не связанный с акиматом города Астаны.
```

**Что нового (версия 1.0):** `First release.` / `Первая версия.`

## 6. Ответы на анкеты

**Google — Data safety**
- Собирает данные: **Yes**. Передаёт третьим лицам: **No**. Шифрование при передаче: **Yes**. Пользователь может запросить удаление: **Yes**, ссылка `https://astana-issue-reporter-api.onrender.com/delete-account`.
- Типы данных (все *Collected*, не *Shared*; назначение **App functionality** + **Account management** для email и имени):
  - Personal info → **Name**, **Email address**
  - Location → **Precise location** (только место проблемы в заявке)
  - Photos and videos → **Photos**
  - App activity → **Other user-generated content** (описание заявки, лайки, жалобы)
  - App info and performance — нет. Device or other IDs — нет.

**Google — Content rating (IARC):** категория **Reference, News, or Educational** → насилия/секса/мата/наркотиков нет → **Users can interact or exchange content: Yes** (фото и тексты видят все), **Shares user location: No** (точка проблемы, а не человека), покупок нет.

**Apple — App Privacy:** Data Used to Track You: **No**. Data Linked to You:
- Contact Info → **Name**, **Email Address** — App Functionality
- User Content → **Photos or Videos**, **Other User Content** — App Functionality
- Location → **Precise Location** — App Functionality
- Identifiers → **User ID** — App Functionality

**Apple — Age Rating:** на всё **None / No**, кроме **User-Generated Content: Yes** (модерация есть: жалобы, блокировка, удаление админом). Итог примерно 12+ или 13+, это нормально.

**Демо-аккаунт для проверяющих (Google App access и Apple Review Information)**
- Username: `user2@example.kz`
- Password: `Pass1234!`

**Notes для Apple (вставить как есть):**
```
Demo resident account: user2@example.kz / Pass1234!
To test account deletion, please register a new account: Profile → Delete account.
User-generated content is moderated: every report has "Report content" and "Block author" buttons; reports with 3 complaints are hidden automatically, and moderators review complaints within 24 hours in the admin dashboard. New users must accept the Terms of use (zero tolerance for objectionable content). Rude words are filtered on submit.
Location is used only while creating a report, to place the problem on the map.
The server may take up to a minute to answer the first request after a pause.
This is an unofficial student project, not affiliated with the Astana city administration.
```

## 7. Скриншоты

Пришлите мне 5 скриншотов с iPhone (кнопка питания + громкость вверх), войдя как житель:
1. Карта с метками
2. Форма новой заявки с фото
3. Карточка заявки с фото и лайком
4. Список «Reports»
5. Уведомления (Alerts)

Я сделаю из них картинки нужных размеров для обоих магазинов (Apple: 1320×2868, Google: 1080×1920) и картинку-баннер 1024×500 для Google Play.

## 8. После публикации

- **Жалобы:** раз в день заходите админом → **Admin** → **Complaints**. Магазины требуют реагировать на жалобы в течение 24 часов: **Keep** (оставить) или **Delete report**.
- **Новая версия:** поменяйте `"version"` в `mobile/app.json` (например на `1.0.1`), снова `build` и загрузка. Номера сборок EAS увеличивает сам.
