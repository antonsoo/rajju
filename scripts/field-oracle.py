"""Check cord intersections by Decimal bisection, including actual rendered SVG coordinates.

The app uses a direct abscissa and Heron's product. This oracle instead walks
the first circle and bisects the distance to the second peg at 60-digit precision.
Recipe lengths are transcribed here from Thibaut pp. 9-11, not imported from the app.
"""
from decimal import Decimal, localcontext
import json
from pathlib import Path
import sys

recipes = {
    'one': ((0, 36, 54, 15), (36, 0, 54, 15)),
    '345': ((0, 20, 40, 15), (36, 20, 32, 12)),
    '51213': ((0, 36, 54, 15), (36, 31, 25, 12)),
    '81517': ((0, 8, 32, 15), (36, 1, 49, 12)),
}
D = Decimal
cases = json.load(sys.stdin)
rendered = []
if len(sys.argv) > 1:
    rendered = json.loads(Path(sys.argv[1]).read_text())['constructions']
maximum = D(0)
with localcontext() as ctx:
    ctx.prec = 60
    for case in cases + rendered:
        west = case['corner'][0] == 'w'
        north = case['corner'][1] == 'n'
        anchor, auxiliary, loop, source_grip = map(D, recipes[case['method']][0 if west else 1])
        direction = D(1 if west else -1)
        side = D(1 if north else -1)
        base = abs(auxiliary - anchor)
        a = D(str(case['grip']))
        b = loop - a
        low, high = -a, a
        for _ in range(220):
            along = (low + high) / 2
            height = max(D(0), a*a-along*along).sqrt()
            other = ((base-along)**2+height**2).sqrt()
            if other > b:
                low = along
            else:
                high = along
        along = (low+high)/2
        height = max(D(0), a*a-along*along).sqrt()
        held = (anchor+direction*along,side*height)
        mark = a if case['stake'] == 'grip' else D(15 if west else 12)
        # Walk the piecewise cord from its anchored end to the measured mark.
        if mark <= a:
            peg = (anchor + (held[0]-anchor)*mark/a, held[1]*mark/a)
        else:
            peg = (held[0]+(auxiliary-held[0])*(mark-a)/b, held[1]*(1-(mark-a)/b))
        for key, expected in [('held',held),('peg',peg)]:
            for axis,value in zip(('x','y'),expected):
                error = abs(D(str(case[key][axis]))-value)
                maximum = max(maximum,error)
                assert error < D('0.000000001'), (case,key,axis,expected,error)
        if 'cordPixels' in case:
            pixels = case['cordPixels']
            distance = lambda i,j: D(str(((pixels[i]-pixels[j])**2+(pixels[i+1]-pixels[j+1])**2)**0.5 / case['scale']))
            assert abs(distance(0,2)-a) < D('0.000000001')
            assert abs(distance(2,4)-b) < D('0.000000001')
print(json.dumps({'model_cases':len(cases),'rendered_cases':len(rendered),'maximum_coordinate_error_source_units':str(maximum),'method':'60-digit Decimal bisection of two distance constraints; independent source recipe table; both visible cord segment lengths checked'},indent=2))
