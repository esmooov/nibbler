To do a simple test and show all results:
`npx tsx findDualClave.ts --test="1011" --strictLength=4 --debug`

To do a simple test and show all successful results:
`npx tsx findDualClave.ts --test="1011" --strictLength=4 --debugSuccess`

To test all touissant rhythms and only show ones that match all others within one
`npx tsx findDualClave.ts --test="soukous,gahu,son,rumba,bossa,shiko" --strictLength=16 --tiny --skipTwos --matchThreshold=5`
