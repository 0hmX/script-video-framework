export default function TextToHardware() {
  return (
    <board>
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={["VBUS", "GND"]}
        footprint="pinrow2"
        schX={-5}
      />
      <pushbutton name="SW1" footprint="pushbutton" schX={-1.5} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={2}
      />
      <led
        name="LED1"
        color="red"
        footprint="0603"
        schX={5.5}
      />
      <trace name="power" from=".J1 > .VBUS" to=".SW1 > .pin1" />
      <trace name="power_pad" from=".J1 > .VBUS" to=".SW1 > .pin2" />
      <trace name="switched_power" from=".SW1 > .pin3" to=".R1 > .pin1" />
      <trace name="switched_power_pad" from=".SW1 > .pin4" to=".R1 > .pin1" />
      <trace name="led_drive" from=".R1 > .pin2" to=".LED1 > .anode" />
      <trace name="return" from=".LED1 > .cathode" to=".J1 > .GND" />
    </board>
  )
}
