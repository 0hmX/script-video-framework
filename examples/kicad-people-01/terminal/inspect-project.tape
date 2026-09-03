Set Shell "zsh"
Set Width 1280
Set Height 850
Set FontSize 23
Set FontFamily "Geist Mono"
Set LineHeight 1.1
Set Padding 24
Set Framerate 30
Set TypingSpeed 30ms
Set Theme { "name": "Editorial Mono", "black": "#0a0a0a", "red": "#b8b8b8", "green": "#dedede", "yellow": "#c8c8c8", "blue": "#e8e8e8", "magenta": "#c0c0c0", "cyan": "#d5d5d5", "white": "#f5f5f5", "brightBlack": "#666666", "brightRed": "#d0d0d0", "brightGreen": "#ffffff", "brightYellow": "#e0e0e0", "brightBlue": "#ffffff", "brightMagenta": "#dddddd", "brightCyan": "#eeeeee", "brightWhite": "#ffffff", "background": "#0a0a0a", "foreground": "#dedede", "selectionBackground": "#303030", "cursorColor": "#ffffff" }

Hide
Type `export PS1='$ '; cd fixture; clear`
Enter
Show
Sleep 500ms
Type "ls -la"
Enter
Sleep 1.5s
Type "sed -n '1,120p' index.circuit.tsx"
Enter
Sleep 2s
Type "sed -n '1,160p' package.json"
Enter
Sleep 3s
Type "clear"
Enter
Type "sed -n '1,180p' tsconfig.json"
Enter
Sleep 3s
