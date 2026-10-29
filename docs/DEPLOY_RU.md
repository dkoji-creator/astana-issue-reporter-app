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
4. Вверху кнопка **Connect** → вкладка **Connection String** → в поле **Method** выберите **Session pooler**. Ниже будет адрес базы, в нём вместо пароля стоит заглушка:
   `postgresql://postgres.abcd1234:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   Скопируйте его в Блокнот и замените `[YOUR-PASSWORD]` **вместе с квадратными скобками** на ваш пароль из шага 2. Например, при пароле `Kx7pQ2mZ9tLw`:
   `postgresql://postgres.abcd1234:Kx7pQ2mZ9tLw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   Это готовый **DATABASE_URL**.
   - Забыли пароль: Project Settings → Database → **Reset database password**.
   - В пароле есть `@ # / ? %`: адрес сломается, сбросьте пароль на такой, где только буквы и цифры.
5. Слева внизу **Project Settings** → **Data API**: скопируйте **Project URL** (`https://xxxx.supabase.co`). Это **SUPABASE_URL**. Если в конце есть `/rest/v1/`, ничего страшного: сервер сам его отрежет.
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
   > **Если Blueprint выдал ошибку**, создайте сервис вручную:
   > **New +** → **Web Service** → репозиторий `astana-issue-reporter` → **Connect**. Поля:
   > Name `astana-issue-reporter-api`, Language **Node**, Branch `main`, Root Directory `backend`,
   > Build Command `npm ci --omit=dev`, Start Command `npm start`, Instance Type **Free**.
   > В **Environment Variables** добавьте 6 строк: `DATABASE_URL` (шаг 1.4), `DATABASE_SSL` = `true`,
   > `SUPABASE_URL` (шаг 1.5), `SUPABASE_SERVICE_KEY` (шаг 1.6), `NODE_ENV` = `production`,
   > `JWT_SECRET` = любые 30+ случайных букв и цифр. Нажмите **Deploy Web Service**.
6. Проверьте, что сервер запустился (смотрим его «журнал»):
   - Нажмите на логотип **Render** слева вверху: откроется **Dashboard**, список ваших сервисов.
   - Нажмите на строку **astana-issue-reporter-api** (тип *Web Service*).
   - В меню слева выберите **Logs**. Это журнал: сервер пишет туда, что делает, новые строки появляются внизу.
   - Подождите, пока сборка закончится (3–5 минут). В конце должны появиться строки:
     ```
     Empty database: creating tables and test data...
     Database ready: 15 users, 4 categories, 120 reports, ...
     API running on ...
     ```
     и зелёная надпись **Your service is live** / статус **Live** вверху.
   - Если вместо этого красное **Deploy failed** или `Could not start: ...`: скопируйте последние 10–15 строк журнала и пришлите мне (паролей там нет).
7. Вверху той же страницы, под названием сервиса, есть ссылка вида `https://astana-issue-reporter-api.onrender.com` (у вас может быть с цифрами/буквами на конце). Скопируйте её, допишите в конце `/api/health` и откройте в браузере. Должно показать `{"ok":true}`.
8. **Пришлите мне эту ссылку.** Я пропишу её в приложение.

## 3. Телефон: Expo Go

1. На телефон поставьте **Expo Go** из Play Market или App Store.
2. На ноутбук поставьте **Node.js LTS**. Проще всего: **Win** → `cmd` → в окне выполните `winget install OpenJS.NodeJS.LTS` (на вопрос ответьте `Y`), закройте окно и откройте новое, проверьте `node -v`.
   Если `winget` не найден: https://nodejs.org/en/download → внизу «Or get a prebuilt Node.js for Windows running a x64 architecture» → **Windows Installer (.msi)** → Next → Next → Install (галочку «Automatically install the necessary tools» не ставьте).
3. Скачайте код: на странице репозитория на GitHub **Code → Download ZIP**, распакуйте. Переместите папку с `backend`, `mobile`, `docs` в **короткий путь**, например `C:\astana`: в длинных путях Windows выдаёт ошибки `EPERM` при установке.
4. Откройте папку `mobile` в проводнике, в адресной строке напишите `cmd` и нажмите Enter. В открывшемся окне:
   ```
   npm install
   npx expo start
   ```
   `npm install` идёт пару минут только в первый раз. Если упал с `ECONNRESET` (сбой сети): выполните `npm config set fetch-retries 5` и запустите `npm install` ещё раз. Если `npx expo start` спрашивает `Need to install expo... Ok to proceed?`, значит `npm install` не закончился: нажмите Ctrl+C и повторите `npm install`.
   **iPhone:** Expo Go на iOS требует бесплатный аккаунт Expo. Зарегистрируйтесь на https://expo.dev/signup, перед `npx expo start` выполните `npx expo login`, а в Expo Go на телефоне войдите тем же аккаунтом. Иначе будет ошибка `You need to be signed in to Expo Go and Expo CLI`.
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

## 4. Приложение без ноутбука

Всё делается один раз из окна `cmd` в папке `C:\astana\mobile`. Сборка идёт на серверах Expo, бесплатно.

**4.1. Свежий код.** На GitHub **Code → Download ZIP**, распакуйте и скопируйте поверх старого (подставьте свой путь к распакованной папке, пробел перед `C:\astana` обязателен):
```
robocopy "C:\Users\...\astana-issue-reporter-main" C:\astana /E /XD node_modules
cd C:\astana\mobile
npm install
```

**4.2. Включите режим «без git»** (в этом же окне, нужно после каждого нового открытия `cmd`):
```
set EAS_NO_VCS=1
```

**4.3. Создайте проект на expo.dev:**
```
npx eas-cli@latest init
```
Если спросит логин, введите тот же аккаунт Expo, что в Expo Go. На вопрос `create a project ...?` ответьте `Y`.

**4.4. iPhone: загрузить приложение на сервер Expo.**
```
npx eas-cli@latest update --channel main --message "demo"
```
На вопросы о настройке `expo-updates` отвечайте `Y`. Через 1–3 минуты в конце будет строка `EAS Dashboard` со ссылкой. Откройте её в браузере → кнопка **Preview** → появится QR-код. Наведите на него камеру iPhone: приложение откроется в Expo Go. Ноутбук после этого не нужен, в Expo Go проект остаётся в списке.
Если поменяете код, повторите эту команду, и на телефоне будет новая версия.

**4.5. Android: APK.**
```
npx eas-cli@latest build -p android --profile preview
```
На вопрос `Generate a new Android Keystore?` ответьте `Y`. Сборка идёт на серверах Expo 10–30 минут, окно можно не держать открытым. В конце будет ссылка и QR-код (они же на expo.dev → ваш проект → **Builds**). Откройте ссылку на Android-телефоне → **Install**; если телефон спросит, разрешите установку из этого источника. Ссылку можно отправить команде и преподавателю.

> Настоящее приложение на iPhone без Expo Go требует платный аккаунт Apple Developer ($99 в год), поэтому для iPhone используем Expo Go.
