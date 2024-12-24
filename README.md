# Examples

To check XOR first and second bits, adding 3 if TRUE, adding 2 if false

`npx tsx oneNibblerAdder.ts -program "XOR[1,2]" -on +3 -off +2`


To always SHIFT the NOR of the second and third bits
`npx tsx oneNibblerAdder.ts -p ALWAYS -on "SHIFT[NOT[2,4]]"`


Weird stuff like if NOR second or third bits SHIFT NOR second and fourth bit, otherwise shift NOR first and fourth bits
`npx tsx oneNibblerAdder.ts -p "NOT[2,4]" -on "SHIFT[NOT[2,8]]" -off "SHIFT[NOT[1,8]]"`


