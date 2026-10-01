# WrongWayio

A parody of duolingo targeted to, instead of learning languages, learning "left" from right.

The mascot is a pidgeon instead of an owl.

## Features

### Streaks

"You’ve correctly identified your left hand for 3 days in a row! Don't ruin it now."

"Looks like you forgot your left from your right today. I guess we're walking into traffic now."

### Scoreboard

Login to view and participate of scoreboards

Compete in the "Bronze League" against toddlers and people who still have to hold up their index finger and thumb to check which way is left.

### Premium

Users may buy "30 days of premium" for their friends:

"Your friend <friend_name> has gifted you 30 days of premium WrongWayio access! It starts now. It would be rude not to partake your lessons"

That message would be sent via email or on first login.

"Buying" premium is actually free - you just need to be logged in and either inform the friend's email and/or generate an invite magic link.

### Minigames

Each minigame plays on loop a fixed amount of times. After the fact, returns a score with the amount correct and total amount.

#### Word reaction:

Randomly, either a text appears or an audio plays "left"/"right" and the user must react accordingly, quickly. There will be an accessibility setting to allow text-only, and to control difficulty (reaction speed).

* Driving: needs to control a steering wheel to turn the car to the correct direction
* Sorting: a box falls from the top and the user must drag it to the right or left bin.
* Button: User needs to click one out of two identical buttons that are side by side

#### Image reaction:

Randomly, something points to the right or to the left, or an obvious question "Your heart is in the ____ side"

* Typing: type "left"/"right"
* Labeled Button: click on randomly-positioned "left"/"right" buttons
* Unlabeled Button: click one out of two identical buttons that are side by side
* Audio: speak "left"/"right"

# Development steps

1. basic UI bulding blocks

- vite + react + tailwind app in /frontend
- defines global styles (main color scheme in gray/black/white/red/blue, font)
- splash screen with icon fading to page
- PagesStack
- StackPage: page with either a back arrow (remove itself from the stack) or close button (remove all pages from the stack)
- ButtonsRow & Button - onSubmit in ButtonsRow with 'value' as argument
- Select & Option - onChange in Select with 'value' as argument
- Container - receives header, body and footer. All children are placed inside an element with max width, centered. header and footer always visible, fills device height. body fills in remaining space, scroll auto
- SpeechBubble - comic-book-style
- Demo page 

2. Game

- generic MiniGame component, with onEnd
- component to display the direction the user is supposed to press
- Image reaction game: Labeled Button
- StackPage with button "play round" - closeable page with game.






