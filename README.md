# Menu Planner App

A modern, intuitive weekly meal planner with 197+ pre-loaded healthy recipes. Plan your week, manage shopping lists, and scale recipes instantly.

## Features

### 🍽️ Recipe Management
- **197+ pre-loaded healthy recipes** (Fredheim collection + curated packs)
- Smart recipe parser: paste raw text and it auto-extracts ingredients & steps
- Upload recipe photos
- Customize recipe categories
- Multi-language support (English, Norwegian, Swedish)
- Recipe translation via MyMemory API

### 📅 Weekly Planner
- Drag-and-drop meal planning
- 7-day view with breakfast/lunch/dinner slots
- Click recipes to view full details
- Save & load plan templates

### 🛒 Shopping Lists
- Auto-generated from weekly plans
- Scale by family size
- Smart ingredient grouping (merges "broccoli" + "fresh broccoli")
- Save & reuse shopping lists
- Group by category

### ⚙️ Customization
- Family size settings
- Custom meal slot names (breakfast, lunch, supper, etc.)
- Custom recipe categories
- Metric/imperial units toggle
- Dark/light mode (auto-detect or manual)

### 📦 Recipe Packs
- Built-in packs (Healthy Basics, Mediterranean, Nordic Classics, Fredheim)
- Download community recipe packs
- Create & distribute your own packs
- Easy-to-host on GitHub

### 🎯 Smart Features
- **Unit normalization**: Converts ml→dl→l, g→kg automatically
- **Serving scaler**: Adjust any recipe on the fly (1.5 cups → precise amounts)
- **Ingredient matching**: Groups similar ingredients intelligently
- **Offline-first**: Works without internet (PWA)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand (with localStorage persistence)
- **Drag-drop**: @dnd-kit
- **i18n**: react-i18next (EN/NO/SV)
- **PWA**: vite-plugin-pwa

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build

```bash
npm run build
npm run preview
```

## Installation as App

The app is a PWA and can be installed on any device:

1. **Desktop (Chrome/Edge)**: Click the "Install" button in the address bar
2. **Mobile**: Tap "Add to Home Screen" in the browser menu
3. **Works offline** with all data stored locally

## Recipe Packs

### Built-in Packs
- **Healthy Basics** (8 recipes) — diverse, balanced meals
- **Mediterranean Diet** (6 recipes) — heart-healthy classics
- **Nordic Classics** (6 recipes) — Scandinavian comfort food
- **Fredheim Recipes** (197 recipes) — comprehensive collection

### Create Your Own Pack

1. Create a JSON file following the format in `recipe-packs-template/packs/`
2. Host on GitHub
3. Share the URL or let users add via the Packs page

See `recipe-packs-template/README.md` for details.

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Navigation, header
│   ├── recipes/        # Recipe list, detail, form
│   ├── planner/        # Weekly planner, drag-drop
│   └── shopping/       # Shopping list
├── pages/              # Full page views
├── store/              # Zustand state management
├── utils/              # Parsers, converters, generators
├── i18n/               # Translations (EN/NO/SV)
└── data/               # Built-in recipes & packs
```

## Configuration

### Language
Settings → Language → English / Norsk / Svenska

### Units
Settings → Units → Metric / Imperial

### Family Size
Settings → Family Size → adjust portions for shopping list

### Meal Slots
Settings → Meal Slots → customize breakfast/lunch/dinner naming

## API & Integrations

- **MyMemory Translation API**: Free recipe translation (no key needed)
- **localStorage**: All data persists locally
- **PWA Service Worker**: Offline functionality

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
- Code follows existing style
- Tests pass: `npm run build`
- No breaking changes to recipe format

## Future Ideas

- Export to PDF/print
- Nutrition tracking
- Allergy warnings
- Grocery store integration
- Meal cost calculator
- Community recipe sharing
- Mobile app (React Native)

---

Built with ❤️ for healthy, organized meal planning
