Set Shell "zsh"
Set Width 1280
Set Height 720
Set FontSize 27
Set FontFamily "Geist Mono"
Set LineHeight 1.1
Set Padding 18
Set Framerate 30
Set TypingSpeed 18ms
Set Theme { "name": "Editorial Mono", "black": "#0a0a0a", "red": "#b8b8b8", "green": "#dedede", "yellow": "#c8c8c8", "blue": "#e8e8e8", "magenta": "#c0c0c0", "cyan": "#d5d5d5", "white": "#f5f5f5", "brightBlack": "#666666", "brightRed": "#d0d0d0", "brightGreen": "#ffffff", "brightYellow": "#e0e0e0", "brightBlue": "#ffffff", "brightMagenta": "#dddddd", "brightCyan": "#eeeeee", "brightWhite": "#ffffff", "background": "#0a0a0a", "foreground": "#dedede", "selectionBackground": "#303030", "cursorColor": "#ffffff" }

Hide
Type `export HOME="$PWD/.video/vhs-home"; mkdir -p "$HOME/Documents/tscircuits/text-to-hardware"; cp editor/promo-before.circuit.tsx "$HOME/Documents/tscircuits/text-to-hardware/index.circuit.tsx"; clear; cd "$HOME/Documents/tscircuits/text-to-hardware"; nvim -u "$OLDPWD/editor/nvim.lua" -n -i NONE index.circuit.tsx`
Enter
Sleep 1.5s
Show

Sleep 300ms
Type@25ms "jjjjjjjjjjjjjjjjjjjjjj"
Sleep 150ms
Type "o"
Type@8ms `<trace name="power" from=".J1 > .VBUS" to=".SW1 > .pin1" />`
Enter
Type@8ms `<trace name="power_pad" from=".J1 > .VBUS" to=".SW1 > .pin2" />`
Enter
Type@8ms `<trace name="switched_power" from=".SW1 > .pin3" to=".R1 > .pin1" />`
Enter
Type@8ms `<trace name="switched_power_pad" from=".SW1 > .pin4" to=".R1 > .pin1" />`
Enter
Type@8ms `<trace name="led_drive" from=".R1 > .pin2" to=".LED1 > .anode" />`
Enter
Type@8ms `<trace name="return" from=".LED1 > .cathode" to=".J1 > .GND" />`
Sleep 200ms
Escape
Sleep 200ms
Type "0"
Type ":w"
Enter
Sleep 500ms
