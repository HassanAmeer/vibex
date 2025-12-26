# VibeAll Extension - UI/UX Overhaul & Feature Plan

## 🎯 Objective
Transform the VibeAll extension into a professional, sleek, and "vibe coding" optimized assistant. The focus is on a clean, modern UI with high-quality SVG icons, intuitive navigation, and robust functionality without clutter.

## 🖥️ UI Layout & Design

### 1. Header (Top Bar)
A minimalist, icon-based notification and action area.
*   **Icons (Left to Right or Distributed):**
    *   📊 **Dashboard**: Opens a modal/poup showing usage analytics (Session-based: Total Tokens, Requests, Model Distribution).
    *   📋 **Logs**: Opens the Logs panel for diagnostics.
    *   ⚙️ **Settings**: Opens the configuration panel.
    *   🗑️ **Clear All**: Instantly clears the current chat session / task list.
*   **Style**: Glassmorphic background, subtle hover effects, tooltips on hover.

### 2. Main Content (Mid Section)
The core interaction zone.
*   **Chat/Task Stream**: 
    *   Clean typography (Inter/SF Mono).
    *   Distinct User vs. AI bubbles.
    *   Markdown support with syntax highlighting for code blocks.
    *   "Copy Code" and "Apply to Editor" buttons on code blocks.
*   **Empty State**: A welcoming "Vibe Coding" splash screen with quick starter prompts.

### 3. Footer (Input & Controls)
A powerful command center stuck to the bottom.
*   **Input Area**: Auto-expanding textarea for prompts.
*   **Send Button**: Professional SVG icon (Plane/Arrow).
*   **Model Selector (Breadcrumbs Style)**:
    *   Located below or within the input box.
    *   **Interaction**: Click to expand Provider list -> Select Provider -> Select Model.
    *   **Visual**: `Provider > Model Name` (e.g., `Groq > Llama-3-70b`).
    *   **Dropdown**: clean, searchable floating menu.

## 🛠️ Features & Components

### ⚙️ Settings Panel
*   **Theme Engine**:
    *   Color boxes for selecting accent colors (Purple, Blue, Orange, Green, etc.).
    *   Applies instantly via CSS variables.
*   **API Key Management**:
    *   List of providers (Groq, OpenAI, Google, etc.).
    *   **Input Field**: Masked by default (`••••••••`).
    *   **Actions**:
        *   👁️ **Toggle Visibility**: View hidden key.
        *   💾 **Save**: Save key to secure storage.
        *   🗑️ **Delete**: Remove key.
    *   **Feedback**: Mini toasts ("Key Saved", "Key Deleted") on action.
*   **Logs**:
    *   Embedded view of error/action logs.
    *   Copy/Clear logs options.

### 📊 Dashboard (Analytics)
*   *Note: Session-based analytics (reset on reload) as requested.*
*   **Metrics**:
    *   Total Requests.
    *   Tokens Generated.
    *   Most Used Provider.
*   **Visuals**: Simple progress bars or stat cards.

## 🎨 Aesthetic Guidelines (The "Professional" Look)
*   **Icons**: Replace all emojis with custom **SVG Icons** (Lucide-react or similar style).
*   **Colors**: Dark mode first. Usage of deep grays (`#1e1e1e`, `#252526`) with vibrant but refined accent colors.
*   **Spacing**: Increased padding for a less cramped, "breathable" interface.
*   **Motion**: Subtle transitions (fade-ins, slide-ups) for messages and panels. No jerky movements.
*   **Borders**: Thin, subtle borders (`rgba(255,255,255,0.1)`) instead of heavy lines.

## 🚀 Implementation Steps

1.  **Icon System**: Import/Create SVG icon set.
2.  **Layout Refactor**: Rebuild `App.tsx` main grid (Header/Body/Footer).
3.  **Component Build**:
    *   `BreadcrumbSelector` for models.
    *   `IconButton` component.
    *   `SettingsPanel` redesign.
4.  **State Management**: Update `App.tsx` to handle session analytics without persistent storage.
5.  **Styling**: Rewrite CSS for the "Professional Vibe".


## 📝 Notes

*   **Analytics**: Session-based analytics (reset on reload) as requested.
*   **Icons**: Replace all emojis with custom **SVG Icons** (Lucide-react or similar style).
*   **Colors**: Dark mode first. Usage of deep grays (`#1e1e1e`, `#252526`) with vibrant but refined accent colors.
*   **Spacing**: Increased padding for a less cramped, "breathable" interface.
*   **Motion**: Subtle transitions (fade-ins, slide-ups) for messages and panels. No jerky movements.
*   **Borders**: Thin, subtle borders (`rgba(255,255,255,0.1)`) instead of heavy lines.

# features
- add node js commands library to automate a work liek crud files and folders.
- user can prompt to ai model then every model thats for coddings its will generate a code like file or code proccess not at one time completion aafter showing
should show which files and folders siss creatings and ts progress or lodings.
- and analyze the code
- can report the code and itss informaation and structure.
- can finds errors
- can fix errors
- can debug code
- can optimize code
- when user want to update the code then it will update the code
- whwen user promt then for testing then every actiosn in /gen folder to check or test its gebarte a code properly or not 