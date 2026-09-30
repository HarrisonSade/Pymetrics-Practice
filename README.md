# Assessment Practice

A free static site for practising online hiring assessments. It has two tabs:

- **Pymetrics**: an overview of the Pymetrics games and what each one measures.
- **Suited**: full practice for the Suited assessment used by investment banks and law firms.

No build step and no account are needed. Open `index.html` in a browser, or host the folder on any static host (for example, GitHub Pages).

## Suited tab

| Page | What it does |
| --- | --- |
| Overview | Key facts and quick links to each mode |
| Practice | Full mock, section drills, learn mode, 60-second blitz and a review deck. Timer pace (relaxed / realistic / brutal) and wrong-answer penalty (0 / −0.5 / −1) can be changed |
| Strategy | Tips for each section, including the six contrapositive rules |
| What to expect | Format, firms, logistics, known unknowns and sources |
| Dashboard | Attempt history, accuracy trends, blitz high scores and the latest personality radar |

Sections:

1. **Same or Different**: generated string pairs that differ by case, substitution, transposition or symbol (plus look-alikes and insertions on Brutal).
2. **Match the String**: tick every exact match. 0–2 options match.
3. **Logical Reasoning**: number series, if-then logic, syllogisms, numerical problems, letter codes and shape progressions. Questions get harder through the section.
4. **Personality**: 42 statements across 7 traits, with reverse-worded pairs for a consistency check and a trait radar.
5. **Situational Judgement**: 24 banking scenarios scored +2 / +1 / −1 / −2, with an explanation for every option.
6. **IB add-on** (optional): 12 scenarios on inside information, conflicts of interest and prioritisation.

Progress is stored in the browser's `localStorage` only.

### Files

```
index.html          site shell and tabs
styles.css          shared theme tokens (light/dark)
suited/content.js   hand-written content (personality, SJT, IB, logic clauses)
suited/generators.js procedural question generators
suited/app.js       views, test engine, scoring, dashboard
suited/suited.css   Suited tab styles
```

To add the Suited tab to another site, copy `suited/`, include the three scripts and `suited.css`, then call `Suited.mount(el)` and `Suited.route(subpage)` from your router.

*Not affiliated with Suited, Pymetrics, William Blair or any bank. The format is reconstructed from public candidate reports. For practice only.*
