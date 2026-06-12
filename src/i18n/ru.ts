// src/i18n/ru.ts
export default {
  header: {
    search: "Поиск",
    library: "Библиотека",
    stats: "Статистика",
    logout: "Выйти",
    sign_in: "Войти"
  },
  filters: {
    all: "Все",
    planned: "В планах",
    watching: "Смотрю",
    watched: "Просмотрено",
    dropped: "Бросил"
  },
  status: {
    select: "Выберите статус",
    planned: "В планах",
    watching: "Смотрю",
    watched: "Просмотрено",
    dropped: "Бросил",
    not_selected: "Не выбран"
  },
  media: {
    movie: "Фильм",
    tv_show: "Сериал"
  },
  common: {
    no_title: "Без названия",
    please_login: "Войдите в аккаунт",
    error_save: "Не удалось сохранить статус",
    error: "Ошибка",
    saving: "Сохранение",
    add: "Добавить",
    remove: "Удалить",
    loading: "Загрузка...",
    rating: "Оценка",
    history: "История",
    min: "мин"
  },
  modal: {
    seasons: "сезонов",
    trailer: "Трейлер",
    cast: "В ролях"
  },
  errors: {
    title: "Что-то пошло не так",
    message: "Произошла непредвиденная ошибка. Попробуйте обновить страницу.",
    reload: "Обновить страницу"
  },
  episodes: {
    title: "Прогресс просмотра",
    season: "Сезон",
    episode: "Серия",
    mark_all: "✓ Отметить весь сезон",
    unmark_all: "Снять отметки с сезона",
    next: "Далее"
  },
  auth: {
    email: "Email адрес",
    password: "Пароль",
    sign_in: "Войти",
    sign_up: "Регистрация",
    forgot_password: "Забыли пароль?",
    enter_email_reset: "Введите email для сброса пароля:",
    reset_sent: "Ссылка отправлена на почту",
    check_email: "Проверьте почту для подтверждения!",
    has_account: "Есть аккаунт? Войти",
    no_account: "Нет аккаунта? Регистрация",
    loading: "Загрузка...",
    error: "Что-то пошло не так",
    please_login: "Войдите в аккаунт"
  },
  search: {
    placeholder: "Поиск фильмов и сериалов...",
    back: "Назад",
    forward: "Вперёд",
    start_typing: "Начните вводить название для поиска",
    no_results: "Ничего не найдено",
    error: "Ошибка поиска. Попробуйте ещё раз.",
    trending: "В тренде на этой неделе",
    random_title: "Случайный фильм",
    random_btn: "🎲 Случайный",
    random_label: "Случайный выбор",
    random_hint: "Нажмите кнопку, чтобы получить случайный фильм"
  },
  genres: {
    action: "Боевик",
    comedy: "Комедия",
    drama: "Драма",
    horror: "Ужасы",
    scifi: "Фантастика",
    animation: "Анимация"
  },
  library: {
    empty: "Ваша библиотека пуста",
    no_matches: "По этому фильтру ничего не найдено",
    start_searching: "Найдите фильмы и добавьте их в библиотеку",
    search_placeholder: "Поиск в библиотеке...",
    sort_date: "Дата",
    sort_rating: "TMDB",
    sort_title: "А→Я",
    sort_user_rating: "Моя оценка"
  },
  share: {
    button: "Поделиться",
    title: "Поделиться библиотекой",
    description: "Скопируй ссылку или поделись в соцсетях",
    copy: "📋 Копировать",
    copied: "✓ Скопировано!",
    close: "Закрыть",
    share: "✈️ Поделиться"
  },
  public_library: {
    title: "Публичная библиотека",
    loading: "Загрузка...",
    error: "Не удалось загрузить библиотеку",
    empty: "Библиотека пуста",
    items: "записей",
    open_app: "Открыть приложение →"
  },
  stats: {
    title: "Статистика",
    empty: "Библиотека пуста — статистики пока нет",
    total: "Всего",
    movies: "Фильмы",
    tv_shows: "Сериалы",
    rated: "С оценкой",
    avg_score: "Средняя оценка",
    tmdb_avg: "Средний TMDB",
    by_status: "По статусам",
    rating_distribution: "Распределение оценок",
    no_ratings: "Вы ещё не ставили оценок",
    by_decade: "По десятилетиям",
    top_rated: "Лучшее по вашей оценке",
    episodes_watched: "Серий посмотрено"
  }
} as const