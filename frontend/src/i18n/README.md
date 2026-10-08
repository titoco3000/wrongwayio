# Languages

Each `locales/<code>.json` is one language. Add a file and it shows up in Settings; nothing else to change.

- Copy `locales/en.json`, translate the values, keep the keys. Set `language.name` to the language's own name.
- `{name}` marks a value filled in at runtime; keep it in the translation.
- Keys ending in `.one` / `.other` (or `.few`, `.many`, ...) are plural forms, chosen by the language's rules.
- A missing key falls back to English.
- `direction.left` / `direction.right` are also the words typed in the keyboard game: lowercase, plain a-z letters only, and neither may start the other.

The language is the one picked in Settings, else the browser's, else English.
