\# 🎬 Movie Tracker - Project Documentation



Полная документация проекта Movie Tracker для разработки и поддержки.



\---



\## 📋 Содержание



\- \[Общая информация](#общая-информация)

\- \[Технологический стек](#технологический-стек)

\- \[Настройка окружения](#настройка-окружения)

\- \[Конфигурации сервисов](#конфигурации-сервисов)

\- \[Email шаблоны](#email-шаблоны)

\- \[Страница сброса пароля](#страница-сброса-пароля)

\- \[Git Workflow](#git-workflow)

\- \[Идеи для развития](#идеи-для-развития)

\- \[Полезные ссылки](#полезные-ссылки)



\---



\## Общая информация



| Параметр | Значение |

|----------|----------|

| \*\*Домен\*\* | https://filmtrack.pp.ua |

| \*\*GitHub\*\* | github.com/Tetrafleksagon/movie-tracker |

| \*\*Хостинг\*\* | Cloudflare Pages (авто-деплой) |

| \*\*База данных\*\* | Supabase |

| \*\*Email сервис\*\* | Resend (100 писем/день) |

| \*\*API фильмов\*\* | TMDB (The Movie Database) |



\---



\## Технологический стек

Frontend:



&#x20;   React 18 + TypeScript

&#x20;   Vite (сборщик)

&#x20;   Tailwind CSS (стили)



Backend:



&#x20;   Supabase (Auth + Database)

&#x20;   PostgreSQL (база данных)



Email:



&#x20;   Resend SMTP

&#x20;   Custom HTML шаблоны



Инфраструктура:



&#x20;   Cloudflare (DNS + CDN + SSL)

&#x20;   GitHub (репозиторий + CI/CD)



\---



\## Настройка окружения



\### Переменные окружения (`.env.local`)



Создайте файл `.env.local` в корне проекта:



```env

VITE\\\\\\\_TMDB\\\\\\\_API\\\\\\\_KEY=ваш\\\\\\\_ключ\\\\\\\_tmdb

VITE\\\\\\\_SUPABASE\\\\\\\_URL=https://fhcvikryaejtikcwjciu.supabase.co

VITE\\\\\\\_SUPABASE\\\\\\\_ANON\\\\\\\_KEY=ваш\\\\\\\_anon\\\\\\\_ключ\\\\\\\_из\\\\\\\_supabase


Установка проекта
# 1. Клонировать репозиторий

git clone https://github.com/Tetrafleksagon/movie-tracker.git

cd movie-tracker



\\\\# 2. Установить зависимости

npm install



\\\\# 3. Создать .env.local с ключами

\\\\# 4. Запустить локально

npm run dev



\\\\# 5. Собрать для продакшена

npm run build

Конфигурации сервисов

Supabase Settings

URL Configuration:

Site URL: https://filmtrack.pp.ua

Redirect URLs:

\\\&#x20; - https://filmtrack.pp.ua

\\\&#x20; - https://filmtrack.pp.ua/\\\\\\\*

\\\&#x20; - https://filmtrack.pp.ua/reset-password.html



SMTP Configuration (Resend):

Host: smtp.resend.com

Port: 465

Username: resend

Password: \\\\\\\[RESEND\\\\\\\_API\\\\\\\_KEY]

Sender Email: noreply@filmtrack.pp.ua

Secure Mode: Enabled



DNS Records (Cloudflare)

Type

\\\&#x09;

Name

\\\&#x09;

Content

\\\&#x09;

Proxy

CNAME

\\\&#x09;

filmtrack.pp.ua

\\\&#x09;

movie-tracker-2ss.pages.dev

\\\&#x09;

Proxied (🟠)

TXT

\\\&#x09;

resend.\\\\\\\_domainkey.filmtrack

\\\&#x09;

\\\\\\\[DKIM\\\\\\\_KEY]

\\\&#x09;

DNS only (⚪)

MX

\\\&#x09;

send.filmtrack

\\\&#x09;

feedback-smtp.eu-west-1.amazonses.com (Priority 10)

\\\&#x09;

DNS only (⚪)

TXT

\\\&#x09;

send.filmtrack

\\\&#x09;

v=spf1 include:amazonses.com \\\\\\\~all

\\\&#x09;

DNS only (⚪)

TXT

\\\&#x09;

\\\\\\\_dmarc

\\\&#x09;

v=DMARC1; p=none;

\\\&#x09;

DNS only (⚪)



Email шаблоны

1\\\\. Reset Password Template

Location: Supabase Dashboard → Authentication → Email Templates → Reset password

HTML Code:

<!DOCTYPE html>

<html>

<head>

\\\&#x20; <meta charset="utf-8">

\\\&#x20; <meta name="viewport" content="width=device-width, initial-scale=1.0">

\\\&#x20; <title>Reset Password - Movie Tracker</title>

</head>

<body style="margin:0; padding:0; background-color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

\\\&#x20; <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:30px 15px;">

\\\&#x20;   <tr>

\\\&#x20;     <td align="center">

\\\&#x20;       <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px; background-color:#1e293b; border-radius:12px; overflow:hidden; border:1px solid #334155;">

\\\&#x20;         <tr>

\\\&#x20;           <td style="padding:20px 20px 16px; text-align:center; border-bottom:1px solid #334155;">

\\\&#x20;             <h1 style="margin:0; font-size:18px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">🎬 Movie Tracker</h1>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;         <tr>

\\\&#x20;           <td style="padding:24px 20px 20px;">

\\\&#x20;             <h2 style="margin:0 0 10px; font-size:17px; font-weight:600; color:#f8fafc; text-align:center;">Сброс пароля</h2>

\\\&#x20;             <p style="margin:0 0 18px; font-size:14px; line-height:1.5; color:#94a3b8; text-align:center;">

\\\&#x20;               Нажмите кнопку ниже, чтобы создать новый пароль для вашего аккаунта.

\\\&#x20;             </p>

\\\&#x20;             <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">

\\\&#x20;               <tr>

\\\&#x20;                 <td align="center">

\\\&#x20;                   <a href="{{ .ConfirmationURL }}" 

\\\&#x20;                      style="display:inline-block; background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); background-color:#3b82f6; color:#ffffff; text-decoration:none; padding:12px 26px; border-radius:8px; font-size:14px; font-weight:600; text-align:center;">

\\\&#x20;                     🔑 Сбросить пароль

\\\&#x20;                   </a>

\\\&#x20;                 </td>

\\\&#x20;               </tr>

\\\&#x20;             </table>

\\\&#x20;             <p style="margin:0; font-size:12px; color:#64748b; text-align:center; line-height:1.4;">

\\\&#x20;               Ссылка действительна 1 час.<br>

\\\&#x20;               <a href="{{ .ConfirmationURL }}" style="color:#60a5fa; text-decoration:none; word-break:break-all;">{{ .ConfirmationURL }}</a>

\\\&#x20;             </p>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;         <tr>

\\\&#x20;           <td style="background-color:#0f172a; padding:14px 20px; text-align:center; border-top:1px solid #334155;">

\\\&#x20;             <p style="margin:0; font-size:11px; color:#475569;">© 2026 Movie Tracker • filmtrack.pp.ua</p>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;       </table>

\\\&#x20;     </td>

\\\&#x20;   </tr>

\\\&#x20; </table>

</body>

</html>



2\\\\. Confirm Signup Template

Location: Supabase Dashboard → Authentication → Email Templates → Confirm signup

HTML Code:

<!DOCTYPE html>

<html>

<head>

\\\&#x20; <meta charset="utf-8">

\\\&#x20; <meta name="viewport" content="width=device-width, initial-scale=1.0">

\\\&#x20; <title>Confirm Your Email - Movie Tracker</title>

</head>

<body style="margin:0; padding:0; background-color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

\\\&#x20; <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:30px 15px;">

\\\&#x20;   <tr>

\\\&#x20;     <td align="center">

\\\&#x20;       <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px; background-color:#1e293b; border-radius:12px; overflow:hidden; border:1px solid #334155;">

\\\&#x20;         <tr>

\\\&#x20;           <td style="padding:20px 20px 16px; text-align:center; border-bottom:1px solid #334155;">

\\\&#x20;             <h1 style="margin:0; font-size:18px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">🎬 Movie Tracker</h1>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;         <tr>

\\\&#x20;           <td style="padding:24px 20px 20px;">

\\\&#x20;             <h2 style="margin:0 0 10px; font-size:17px; font-weight:600; color:#f8fafc; text-align:center;">Подтвердите email</h2>

\\\&#x20;             <p style="margin:0 0 18px; font-size:14px; line-height:1.5; color:#94a3b8; text-align:center;">

\\\&#x20;               Спасибо за регистрацию! Нажмите кнопку ниже, чтобы подтвердить ваш email и начать использовать Movie Tracker.

\\\&#x20;             </p>

\\\&#x20;             <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">

\\\&#x20;               <tr>

\\\&#x20;                 <td align="center">

\\\&#x20;                   <a href="{{ .ConfirmationURL }}" 

\\\&#x20;                      style="display:inline-block; background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); background-color:#3b82f6; color:#ffffff; text-decoration:none; padding:12px 26px; border-radius:8px; font-size:14px; font-weight:600; text-align:center;">

\\\&#x20;                     ✅ Подтвердить email

\\\&#x20;                   </a>

\\\&#x20;                 </td>

\\\&#x20;               </tr>

\\\&#x20;             </table>

\\\&#x20;             <p style="margin:0; font-size:12px; color:#64748b; text-align:center; line-height:1.4;">

\\\&#x20;               Или скопируйте ссылку:<br>

\\\&#x20;               <a href="{{ .ConfirmationURL }}" style="color:#60a5fa; text-decoration:none; word-break:break-all;">{{ .ConfirmationURL }}</a>

\\\&#x20;             </p>

\\\&#x20;             <p style="margin:16px 0 0; font-size:12px; color:#64748b; text-align:center;">

\\\&#x20;               Код подтверждения: <strong style="color:#94a3b8;">{{ .Token }}</strong>

\\\&#x20;             </p>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;         <tr>

\\\&#x20;           <td style="background-color:#0f172a; padding:14px 20px; text-align:center; border-top:1px solid #334155;">

\\\&#x20;             <p style="margin:0; font-size:11px; color:#475569;">© 2026 Movie Tracker • filmtrack.pp.ua</p>

\\\&#x20;           </td>

\\\&#x20;         </tr>

\\\&#x20;       </table>

\\\&#x20;     </td>

\\\&#x20;   </tr>

\\\&#x20; </table>

</body>

</html>



Страница сброса пароля

File: public/reset-password.html

<!DOCTYPE html>

<html lang="ru">

<head>

\\\&#x20; <meta charset="UTF-8">

\\\&#x20; <meta name="viewport" content="width=device-width, initial-scale=1.0">

\\\&#x20; <title>Новый пароль - Movie Tracker</title>

\\\&#x20; <style>

\\\&#x20;   \\\\\\\* { margin: 0; padding: 0; box-sizing: border-box; }

\\\&#x20;   body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: #f1f5f9; }

\\\&#x20;   .card { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; width: 100%; max-width: 400px; }

\\\&#x20;   h1 { font-size: 20px; text-align: center; margin-bottom: 8px; }

\\\&#x20;   .sub { color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 24px; }

\\\&#x20;   .inp { margin-bottom: 16px; }

\\\&#x20;   label { display: block; color: #cbd5e1; font-size: 13px; margin-bottom: 6px; }

\\\&#x20;   input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; font-size: 14px; }

\\\&#x20;   input:focus { outline: none; border-color: #3b82f6; }

\\\&#x20;   button { width: 100%; padding: 12px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; }

\\\&#x20;   button:disabled { opacity: 0.6; cursor: not-allowed; }

\\\&#x20;   .err { background: rgba(220,38,38,0.1); border: 1px solid #dc2626; color: #fca5a5; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }

\\\&#x20;   .ok { background: rgba(34,197,94,0.1); border: 1px solid #22c55e; color: #86efac; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center; }

\\\&#x20;   .link { display: block; text-align: center; margin-top: 20px; color: #60a5fa; text-decoration: none; font-size: 13px; }

\\\&#x20; </style>

</head>

<body>

\\\&#x20; <div class="card">

\\\&#x20;   <h1>🔐 Новый пароль</h1>

\\\&#x20;   <p class="sub">Введите новый пароль для вашего аккаунта</p>

\\\&#x20;   <div id="msg"></div>

\\\&#x20;   <form id="form">

\\\&#x20;     <div class="inp"><label>Новый пароль</label><input type="password" id="p1" required minlength="6"></div>

\\\&#x20;     <div class="inp"><label>Повторите пароль</label><input type="password" id="p2" required></div>

\\\&#x20;     <button type="submit" id="btn">Сохранить пароль</button>

\\\&#x20;   </form>

\\\&#x20;   <a href="/" class="link">← Вернуться на главную</a>

\\\&#x20; </div>



\\\&#x20; <script type="module">

\\\&#x20;   import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

\\\&#x20;   

\\\&#x20;   // ⚠️ ЗАМЕНИТЕ НА ВАШИ РЕАЛЬНЫЕ КЛЮЧИ!

\\\&#x20;   const SUPABASE\\\\\\\_URL = 'https://fhcvikryaejtikcwjciu.supabase.co'

\\\&#x20;   const SUPABASE\\\\\\\_ANON\\\\\\\_KEY = 'ВАШ\\\\\\\_ANON\\\\\\\_KEY\\\\\\\_ИЗ\\\\\\\_SUPABASE'

\\\&#x20;   

\\\&#x20;   const supabase = createClient(SUPABASE\\\\\\\_URL, SUPABASE\\\\\\\_ANON\\\\\\\_KEY)

\\\&#x20;   

\\\&#x20;   const form = document.getElementById('form')

\\\&#x20;   const msg = document.getElementById('msg')

\\\&#x20;   const btn = document.getElementById('btn')

\\\&#x20;   

\\\&#x20;   form.addEventListener('submit', async e => {

\\\&#x20;     e.preventDefault()

\\\&#x20;     const p1 = document.getElementById('p1').value

\\\&#x20;     const p2 = document.getElementById('p2').value

\\\&#x20;     

\\\&#x20;     if (p1 !== p2) { 

\\\&#x20;       msg.innerHTML = '<div class="err">❌ Пароли не совпадают</div>'

\\\&#x20;       return 

\\\&#x20;     }

\\\&#x20;     

\\\&#x20;     btn.disabled = true

\\\&#x20;     btn.textContent = 'Сохранение...'

\\\&#x20;     

\\\&#x20;     try {

\\\&#x20;       const { data, error } = await supabase.auth.updateUser({ password: p1 })

\\\&#x20;       

\\\&#x20;       if (error) { 

\\\&#x20;         msg.innerHTML = `<div class="err">❌ Ошибка: ${error.message}</div>`

\\\&#x20;         btn.disabled = false

\\\&#x20;         btn.textContent = 'Сохранить пароль'

\\\&#x20;       } else { 

\\\&#x20;         msg.innerHTML = '<div class="ok">✅ Пароль изменён! Перенаправляем...</div>'

\\\&#x20;         setTimeout(() => location.href = '/', 2000)

\\\&#x20;       }

\\\&#x20;     } catch (err) {

\\\&#x20;       msg.innerHTML = `<div class="err">❌ Ошибка: ${err.message}</div>`

\\\&#x20;       btn.disabled = false

\\\&#x20;       btn.textContent = 'Сохранить пароль'

\\\&#x20;     }

\\\&#x20;   })

\\\&#x20; </script>

</body>

</html>



Обновление Auth.tsx

File: src/components/Auth.tsx

const handleForgotPassword = async () => {

\\\&#x20; const emailInput = prompt('Введите email для сброса пароля:')

\\\&#x20; if (!emailInput) return

\\\&#x20; 

\\\&#x20; const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {

\\\&#x20;   redirectTo: 'https://filmtrack.pp.ua/reset-password.html',

\\\&#x20; })

\\\&#x20; 

\\\&#x20; if (error) {

\\\&#x20;   alert('❌ Ошибка: ' + error.message)

\\\&#x20; } else {

\\\&#x20;   alert('✅ Письмо отправлено на:\\\\\\\\n' + emailInput)

\\\&#x20; }

}

Git Workflow

Создание новой фичи

\\\\# 1. Создать новую ветку

git checkout -b feature/имя-фичи



\\\\# 2. Внести изменения

\\\\# ... редактирование файлов ...



\\\\# 3. Добавить изменения

git add .



\\\\# 4. Создать коммит

git commit -m "Feat: описание новых изменений



\\\\- Добавлена функция X

\\\\- Исправлена ошибка Y

\\\\- Обновлен компонент Z"



\\\\# 5. Отправить на сервер

git push -u origin feature/имя-фичи



\\\\# 6. Создать Pull Request на GitHub

\\\\# 7. После review - merge в main



Быстрый деплой (для личных проектов)

\\\\# Работа напрямую в main

git add .

git commit -m "Fix: краткое описание"

git push origin main



Основные команды

\\\\# Проверка статуса

git status



\\\\# Посмотреть изменения

git diff



\\\\# Отменить изменения в файле

git restore <файл>



\\\\# Обновить локальный main

git checkout main

git pull origin main



\\\\# Удалить ветку

git branch -d feature/имя-фичи

git push origin --delete feature/имя-фичи





Панели управления



\\\&#x20;   Supabase Dashboard: https://supabase.com/dashboard

\\\&#x20;   Cloudflare Dashboard: https://dash.cloudflare.com

\\\&#x20;   Resend Dashboard: https://resend.com/domains

\\\&#x20;   GitHub Repository: https://github.com/Tetrafleksagon/movie-tracker

\\\&#x20;   TMDB API Docs: https://developers.themoviedb.org/3






