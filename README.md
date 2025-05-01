To do a simple test and show all matching results:
`npx tsx findDualClave.ts --test="1000100010010010" --strictLength --debugSuccess --limitToCarriesA`

To interpret these results:

```
Poly:
Vars:  {
  a: 4,
  b: 1,
  mapA: { '1': 0, '2': 0, '4': 0, '8': 2 },
  test: '1000100010010010'
}
A: (BITMAP {"1":0,"2":0,"4":0,"8":2} (Base: 4))
B: (CONSTANT Add 1)
AUX: (undefined)
```

This means set nibbler A to add 4, nibbler B to add 1, then patch nibbler B's 8 bit to nibbler A's 2-bit input.
