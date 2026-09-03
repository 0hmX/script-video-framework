Set Shell "zsh"
Set Width 1280
Set Height 680
Set FontSize 27
Set FontFamily "Geist Mono"
Set LineHeight 1.08
Set Padding 18
Set Framerate 30
Set TypingSpeed 38ms
Set Theme { "name": "Editorial Mono", "black": "#0a0a0a", "red": "#b8b8b8", "green": "#dedede", "yellow": "#c8c8c8", "blue": "#e8e8e8", "magenta": "#c0c0c0", "cyan": "#d5d5d5", "white": "#f5f5f5", "brightBlack": "#666666", "brightRed": "#d0d0d0", "brightGreen": "#ffffff", "brightYellow": "#e0e0e0", "brightBlue": "#ffffff", "brightMagenta": "#dddddd", "brightCyan": "#eeeeee", "brightWhite": "#ffffff", "background": "#0a0a0a", "foreground": "#dedede", "selectionBackground": "#303030", "cursorColor": "#ffffff" }

Hide
Type `export PROJECT_ROOT="$PWD"; export HOME="$PWD/.video/editor-home"; mkdir -p "$HOME/Documents/tscircuits/script-video-framework/examples/kicad-people-01/fixture"; cp fixture/index.before.tsx "$HOME/Documents/tscircuits/script-video-framework/examples/kicad-people-01/fixture/index.circuit.tsx"; cd "$HOME/Documents/tscircuits/script-video-framework"; nvim -u "$PROJECT_ROOT/editor/nvim.lua" -n -i NONE examples/kicad-people-01/fixture/index.circuit.tsx`
Enter
Sleep 1.5s
Show
Sleep 800ms
Type@70ms "jjjjjjjj"
Sleep 500ms
Type "o"
Type@30ms `<resistor name="R1" footprint="0603" resistance="1k" schX={0.67} schY={0} />`
Enter
Type@30ms `<led name="LED" footprint="0603" color="red" schX={2} schY={0} />`
Enter
Type@30ms "<trace"
Enter
Type@30ms `  name="VIN"`
Enter
Type@30ms `from=".J1 > .VBUS"`
Enter
Type@30ms `to=".R1 > .pos"`
Enter
Ctrl+D
Type@30ms "/>"
Enter
Type@30ms "<trace"
Enter
Type@30ms `  name="LED_A"`
Enter
Type@30ms `from=".R1 > .neg"`
Enter
Type@30ms `to=".LED > .pos"`
Enter
Ctrl+D
Type@30ms "/>"
Enter
Type@30ms "<trace"
Enter
Type@30ms `  name="GND"`
Enter
Type@30ms `from=".LED > .neg"`
Enter
Type@30ms `to=".J1 > .GND"`
Enter
Ctrl+D
Type@30ms "/>"
Sleep 800ms
Escape
Type ":w"
Enter
Sleep 3s
