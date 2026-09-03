Set Shell "zsh"
Set Width 1280
Set Height 680
Set FontSize 27
Set FontFamily "Geist Mono"
Set LineHeight 1.06
Set Padding 20
Set Framerate 30
Set TypingSpeed 32ms
Set Theme { "name": "Editorial Mono", "black": "#0a0a0a", "red": "#b8b8b8", "green": "#dedede", "yellow": "#c8c8c8", "blue": "#e8e8e8", "magenta": "#c0c0c0", "cyan": "#d5d5d5", "white": "#f5f5f5", "brightBlack": "#666666", "brightRed": "#d0d0d0", "brightGreen": "#ffffff", "brightYellow": "#e0e0e0", "brightBlue": "#ffffff", "brightMagenta": "#dddddd", "brightCyan": "#eeeeee", "brightWhite": "#ffffff", "background": "#0a0a0a", "foreground": "#dedede", "selectionBackground": "#303030", "cursorColor": "#ffffff" }

Hide
Type `export PS1='$ '; export TSCI_SKIP_CLI_UPDATE=true; clear`
Enter
Show
Sleep 600ms
Type "tsci check netlist fixture/index.circuit.tsx"
Enter
Sleep 5s
Type "tsci check schematic-placement fixture/index.circuit.tsx"
Enter
Sleep 4s
Type "tsci check placement fixture/index.circuit.tsx"
Enter
Sleep 5s
Type "tsci build fixture/index.circuit.tsx --pcb-png --schematic-png --3d-png"
Enter
Sleep 10s
