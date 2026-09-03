export default () => (
  <board>
    <pinheader
      name="J1"
      pinCount={2}
      pinLabels={["VBUS", "GND"]}
      schX={-2.66}
      schY={0}
    />
    <resistor name="R1" footprint="0603" resistance="1k" schX={0.67} schY={0} />
    <led name="LED" footprint="0603" color="red" schX={2} schY={0} />
    <trace
      name="VIN"
      from=".J1 > .VBUS"
      to=".R1 > .pos"
    />
    <trace
      name="LED_A"
      from=".R1 > .neg"
      to=".LED > .pos"
    />
    <trace
      name="GND"
      from=".LED > .neg"
      to=".J1 > .GND"
    />
  </board>
)
