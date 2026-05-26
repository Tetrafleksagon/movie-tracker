// src/i18n/ru.ts
export default {
  header: {
    search: "Поиск",
    library: "Библиотека",
    logout: "Выйти"
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
    history: "История"
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
    error: "Ошибка поиска. Попробуйте ещё раз."
  },
  library: {
    empty: "Ваша библиотека пуста",
    no_matches: "По этому фильтру ничего не найдено",
    start_searching: "Найдите фильмы и добавьте их в библиотеку"
  }
} as const