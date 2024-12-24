# Examples

Access a bit of the current nibble with an asterisk. `OR[*1,*2]` means either the first or second bits is high.

To check XOR first and second bits, adding 3 if TRUE, adding 2 if false

`npx tsx oneNibblerAdder.ts -p "CHOICE XOR[*1,*2] +3 -2"`


To always SHIFT the NOR of the second and third bits
`npx tsx oneNibblerAdder.ts -p "CONSTANT SHIFT[NOT[*2,*4]]"`


Weird stuff like if NOR second or third bits SHIFT NOR second and fourth bit, otherwise shift NOR first and fourth bits
`npx tsx oneNibblerAdder.ts -p "CHOICE NOT[*2,*4] SHIFT[NOT[*2,*8]] SHIFT[NOT[*1,*8]]"`

To subtract use -
`npx tsx oneNibblerAdder.ts -p "CONSTANT -7"`

Fun with SHIFT
`npx tsx oneNibblerAdder.ts -p "CHOICE GT[+8] SHIFT[] +1"`
