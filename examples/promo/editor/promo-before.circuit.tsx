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
    </board>
  )
}
