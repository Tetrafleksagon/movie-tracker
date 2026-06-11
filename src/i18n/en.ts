// src/i18n/en.ts
export default {
  header: {
    search: "Search",
    library: "Library",
    stats: "Stats",
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
    sort_user_rating: "My score"
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
  public_library: {
    title: "Public Library",
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