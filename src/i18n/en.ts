// src/i18n/en.ts
export default {
  header: {
    search: "Search",
    library: "Library",
    stats: "Stats",
    lists: "Lists",
    logout: "Logout",
    sign_in: "Sign In"
  },
  filters: {
    all: "All",
    planned: "Planned",
    watching: "Watching",
    watched: "Watched",
    dropped: "Dropped"
  },
  status: {
    select: "Select status",
    planned: "Planned",
    watching: "Watching",
    watched: "Watched",
    dropped: "Dropped",
    not_selected: "Not selected"
  },
  media: {
    movie: "Movie",
    tv_show: "TV Show"
  },
  common: {
    no_title: "No title",
    please_login: "Please log in first",
    error_save: "Failed to save status",
    error: "Error",
    saving: "Saving",
    add: "Add",
    remove: "Remove",
    loading: "Loading...",
    rating: "Rating",
    history: "History",
    min: "min"
  },
  modal: {
    seasons: "seasons",
    trailer: "Trailer",
    cast: "Cast"
  },
  premium: {
    badge: "Premium",
    lists_title: "Lists are a premium feature",
    lists_desc: "Creating and managing your own lists is available with Premium. Subscriptions are coming soon."
  },
  lists: {
    title: "My lists",
    create_placeholder: "New list name…",
    create: "Create",
    empty: "You don't have any lists yet",
    empty_sub: "Create one above, or add a title to a list right from its card — the “📑 Add to list” button.",
    list_empty: "This list is empty",
    delete: "Delete list",
    delete_confirm: "Delete this list?",
    remove: "Remove from list",
    add_to_list: "Add to list",
    new_list: "New list…",
    empty_hint: "Create a list below"
  },
  errors: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try reloading the page.",
    reload: "Reload page"
  },
  episodes: {
    title: "Watch progress",
    season: "Season",
    episode: "Episode",
    mark_all: "✓ Mark entire season",
    unmark_all: "Unmark season",
    next: "Next"
  },
  auth: {
    email: "Email address",
    password: "Password",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    forgot_password: "Forgot password?",
    enter_email_reset: "Enter your email to reset password:",
    reset_sent: "Reset link sent to your email",
    check_email: "Check your email to confirm!",
    has_account: "Have an account? Sign In",
    no_account: "No account? Sign Up",
    loading: "Loading...",
    error: "Something went wrong",
    please_login: "Please log in first"
  },
  search: {
    placeholder: "Search movies and TV shows...",
    back: "Back",
    forward: "Next",
    start_typing: "Start typing to search",
    no_results: "No results found",
    error: "Search failed. Please try again.",
    trending: "Trending This Week",
    random_title: "Random Movie",
    random_btn: "🎲 Pick Random",
    random_label: "Random Pick",
    random_hint: "Click the button to get a random movie suggestion"
  },
  genres: {
    action: "Action",
    comedy: "Comedy",
    drama: "Drama",
    horror: "Horror",
    scifi: "Sci-Fi",
    animation: "Animation"
  },
  library: {
    empty: "Your library is empty",
    no_matches: "No items match this filter",
    start_searching: "Search for movies and add them to your library",
    search_placeholder: "Search library...",
    sort_date: "Date",
    sort_rating: "TMDB",
    sort_title: "A→Z",
    sort_user_rating: "My score",
    go_search: "Go to search"
  },
  onboarding: {
    welcome_title: "Welcome to Movie Tracker!",
    step_search: "Find a movie or show",
    step_add: "Add it to your library",
    step_track: "Track progress and ratings",
    step_lists: "Build your own lists",
    dismiss: "Dismiss"
  },
  share: {
    button: "Share",
    title: "Share Library",
    description: "Copy the link or share on social networks",
    copy: "📋 Copy",
    copied: "✓ Copied!",
    close: "Close",
    share: "✈️ Share"
  },
  profile: {
    title: "Profile",
    display_name: "Display name",
    display_name_placeholder: "What's your name?",
    save: "Save",
    saved: "Saved",
    email: "Email",
    password: "New password",
    password_confirm: "Confirm password",
    password_save: "Change password",
    password_changed: "Password changed",
    password_mismatch: "Passwords don't match",
    password_short: "At least 6 characters",
    error: "Error"
  },
  public_library: {
    title: "Public Library",
    title_named: "{{name}}'s library",
    loading: "Loading...",
    error: "Failed to load library",
    empty: "Library is empty",
    items: "items",
    open_app: "Open App →"
  },
  stats: {
    title: "Statistics",
    empty: "Your library is empty — no stats yet",
    total: "Total",
    movies: "Movies",
    tv_shows: "TV Shows",
    rated: "Rated",
    avg_score: "Avg score",
    tmdb_avg: "TMDB avg",
    by_status: "By status",
    rating_distribution: "Rating distribution",
    no_ratings: "You haven't rated anything yet",
    by_decade: "By decade",
    top_rated: "Your top rated",
    episodes_watched: "Episodes watched"
  }
} as const