# Запуск в облаке и на телефоне

Всего три части: база и фото (Supabase), сервер (Render), приложение на телефоне (Expo Go). Всё бесплатно, карта не нужна. Займёт минут 15.

> Пароль базы и секретный ключ вставляйте **только в Render**. Мне в чат их не присылайте, мне нужна только ссылка на сервер.

## 1. Supabase: база PostgreSQL и хранилище фото

1. Откройте https://supabase.com → **Start your project** → войдите через GitHub.
2. **New project**:
   - Name: `astana-issue-reporter`
   - Database Password: нажмите **Generate a password** и сохраните его себе (в заметки).
   - Region: **Central EU (Frankfurt)**.
   - Нажмите **Create new project** и подождите 1–2 минуты.
3. Слева **Storage** → **New bucket**:
   - Name: `report-photos`
   - Включите **Public bucket**.
   - **Create**.
4. Вверху кнопка **Connect** → вкладка **Connection String** → в списке Method выберите **Session pooler**. Скопируйте строку вида
   `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   и замените `[YOUR-PASSWORD]` на пароль из шага 2. Это **DATABASE_URL**.
5. Слева внизу **Project Settings** → **Data API**: скопируйте **Project URL** (`https://xxxx.supabase.co`). Это **SUPABASE_URL**.
6. **Project Settings** → **API Keys** → в блоке **Secret keys** нажмите на глаз и скопируйте ключ `sb_secret_...`. Это **SUPABASE_SERVICE_KEY**.
   (Если у вас там вкладка *Legacy API keys*, подойдёт и ключ `service_role`.)

## 2. Render: сервер Node.js

1. Откройте https://render.com → **Get Started** → войдите через GitHub.
2. **New +** → **Blueprint**.
3. **Connect a repository**: если репозитория нет в списке, нажмите **Configure account** и дайте Render доступ к `astana-issue-reporter`. Выберите его.
4. Render сам прочитает файл `render.yaml` и попросит три значения. Вставьте:
   - `DATABASE_URL` — из шага 1.4
   - `SUPABASE_URL` — из шага 1.5
   - `SUPABASE_SERVICE_KEY` — из шага 1.6
5. **Apply** (или **Deploy Blueprint**). Сборка идёт 3–5 минут.
6. Откройте сервис `astana-issue-reporter-api` → вкладка **Logs**. При первом запуске там будет:
   ```
   Empty database: creating tables and test data...
   Database ready: 15 users, 4 categories, 120 reports, ...
   API running on ...
   ```
7. Вверху страницы сервиса есть ссылка вида `https://astana-issue-reporter-api.onrender.com`. Откройте её с `/api/health` на конце: должно показать `{"ok":true}`.
8. **Пришлите мне эту ссылку.** Я пропишу её в приложение.

## 3. Телефон: Expo Go

1. На телефон поставьте **Expo Go** из Play Market или App Store.
2. На ноутбук поставьте **Node.js LTS** с https://nodejs.org (Next → Next → Install).
3. Скачайте код: на странице репозитория на GitHub **Code → Download ZIP**, распакуйте (или `git clone`, если стоит Git).
4. Откройте папку `mobile` в проводнике, в адресной строке напишите `cmd` и нажмите Enter. В открывшемся окне:
   ```
   npm install
   npx expo start
   ```
   `npm install` идёт пару минут только в первый раз.
5. Появится QR-код. Android: откройте Expo Go → **Scan QR code**. iPhone: наведите обычную камеру.
6. Телефон и ноутбук должны быть в **одной Wi-Fi сети**. Если не открывается (например, университетский Wi-Fi), остановите Ctrl+C и запустите так:
   ```
   npx expo start --tunnel
   ```

Вход: житель `user2@example.kz`, админ `user1@example.kz`, пароль у всех `Pass1234!`.

## Что проверить на телефоне

- [ ] Карта открывается, видно 120 цветных меток.
- [ ] «+» → открывается камера → фото → метка по GPS (если вы в Астане) → категория → описание → «Submit report».
- [ ] Новая заявка появилась на карте.
- [ ] Вход как админ (`user1`) → вкладка **Admin** → смена статуса вашей заявки.
- [ ] Снова вход жителем → в течение 30 секунд приходит уведомление, на вкладке **Alerts** красный счётчик.
- [ ] Profile → Русский / Қазақша: интерфейс переключается.

## Если что-то не так

- **Первый вход грузится до минуты.** Это нормально: бесплатный Render засыпает после 15 минут простоя. Перед защитой откройте приложение за пару минут.
- **«No connection to the server»**: проверьте ссылку `/api/health` в браузере телефона.
- **Фото не загружается**: проверьте, что бакет `report-photos` отмечен как Public, а `SUPABASE_SERVICE_KEY` в Render — именно секретный ключ.
