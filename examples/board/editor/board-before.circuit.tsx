export default function BoardElementExample() {
  return (
    <board
      name="BOARD_ELEMENT_EXAMPLE"
      width="60mm"
      height="36mm"
      borderRadius="3mm"
      pcbStyle={{ silkscreenTextVisibility: "visible" }}
    >
      <hole name="H1" pcbX={-25} pcbY={13} diameter="3.2mm" />
      <hole name="H2" pcbX={25} pcbY={13} diameter="3.2mm" />
      <hole name="H3" pcbX={-25} pcbY={-13} diameter="3.2mm" />
      <hole name="H4" pcbX={25} pcbY={-13} diameter="3.2mm" />
    </board>
  )
}
