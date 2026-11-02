"""Independent source fixture and angle bisection; no imports from the app."""
import csv
import io
import json
import math
import sys
from pathlib import Path

# Thibaut 1875 printed pp. 10-11: (baseline, near, return, peg-at-grip).
RECIPES = {
    "one": {"w": (36, 15, 39, True), "e": (36, 15, 39, False)},
    "345": {"w": (20, 15, 25, True), "e": (16, 12, 20, True)},
    "51213": {"w": (36, 15, 39, True), "e": (5, 12, 13, True)},
    "81517": {"w": (8, 15, 17, True), "e": (35, 12, 37, True)},
}


def expected(method, corner, near_error, far_error):
    c, prescribed_a, prescribed_b, at_grip = RECIPES[method][corner[0]]
    ai, bi, ci = prescribed_a * 100 + near_error, prescribed_b * 100 + far_error, c * 100
    result = dict(baseline=c, prescribedNear=prescribed_a, prescribedFar=prescribed_b,
                  actualNear=ai / 100, actualFar=bi / 100, separateMark=not at_grip)
    if ai + bi < ci or abs(ai - bi) > ci:
        return dict(result, kind="unreachable")
    a, b = ai / 100, bi / 100
    # Rotate the near segment, then find where its tip is exactly b from
    # the auxiliary anchor. This does not subtract squared circle equations
    # or use the app's Heron product.
    lo, hi = 0.0, math.pi
    for _ in range(90):
        theta = (lo + hi) / 2
        distance = math.hypot(a * math.cos(theta) - c, a * math.sin(theta))
        if distance < b:
            lo = theta
        else:
            hi = theta
    theta = (lo + hi) / 2
    collinear = ai + bi == ci or abs(ai - bi) == ci
    if collinear:
        theta = math.pi if bi == ai + ci else 0.0
    radius = a if at_grip else 12
    dx = radius * math.cos(theta) * (1 if corner[0] == "w" else -1)
    dy = (radius * math.sin(theta) - (15 if corner[0] == "w" else 12)) * (1 if corner[1] == "n" else -1)
    x = (0 if corner[0] == "w" else 36) + dx
    y = (15 if corner[0] == "w" else 12) * (1 if corner[1] == "n" else -1) + dy
    return dict(result, kind="collinear" if collinear else "taut", dx=dx, dy=dy,
                miss=math.hypot(dx, dy), peg=dict(x=x, y=y),
                angle=None if collinear else math.degrees(theta))


def close(a, b, tolerance=2e-8):
    assert abs(a - b) <= tolerance, (a, b)


def check_model(model):
    ref = expected(model["method"], model["corner"], model["nearError"], model["farError"])
    for key in ("kind", "baseline", "prescribedNear", "prescribedFar", "actualNear", "actualFar", "separateMark"):
        assert model[key] == ref[key], (key, model, ref)
    if ref["kind"] == "unreachable":
        assert model["peg"] is None and model["grip"] is None
        return
    for key in ("dx", "dy", "miss"):
        close(model[key], ref[key])
    for axis in ("x", "y"):
        close(model["peg"][axis], ref["peg"][axis])
    if ref["angle"] is None:
        assert model["angle"] is None
    else:
        close(model["angle"], ref["angle"])


def check_csv(text):
    rows = list(csv.DictReader(io.StringIO(text)))
    assert [r["method"] for r in rows] == list(RECIPES)
    for row in rows:
        model = expected(row["method"], row["corner"], round(float(row["near_error"]) * 100), round(float(row["return_error"]) * 100))
        assert row["status"] == model["kind"]
        assert row["model"] == "modern_segment_errors"
        assert "not measurements of ancient cords" in row["assumptions"]
        for csv_key, key in (("dx_east", "dx"), ("dy_north", "dy"), ("miss", "miss")):
            if model["kind"] == "unreachable":
                assert row[csv_key] == ""
            else:
                close(float(row[csv_key]), model[key])
    return len(rows)


if len(sys.argv) > 1:
    receipt = json.loads(Path(sys.argv[1]).read_text())
    plots = rows = csv_rows = 0
    for case in receipt["cases"]:
        assert case["methods"] == list(RECIPES)
        for row in case["rows"]:
            method = row["method"]
            ref = expected(method, case["corner"], case["nearError"], case["farError"])
            assert row["cells"][0].startswith(str(list(RECIPES).index(method) + 1) + ".")
            if ref["kind"] == "unreachable":
                assert "Cannot reach both anchors" in row["cells"][3]
                assert method not in case["symbols"]
            else:
                actual = case["symbols"][method]
                close(actual["dx"], ref["dx"])
                close(actual["dy"], ref["dy"])
                visible = [float(n.replace(",", "")) for n in row["cells"][3].split(", ")]
                close(visible[0], ref["dx"], 0.00000051)
                close(visible[1], ref["dy"], 0.00000051)
                close(float(row["cells"][4].replace(",", "")), ref["miss"], 0.00000051)
                if ref["angle"] is None:
                    assert "Collinear" in row["cells"][5]
                else:
                    close(float(row["cells"][5].removesuffix("°")), ref["angle"], 0.00000051)
                plots += 1
            rows += 1
    for journey in receipt["journeys"]:
        csv_rows += check_csv(Path(journey["csv"]).read_text())
        csv_rows += check_csv(Path(journey["savedCsv"]).read_text())
    print(json.dumps(dict(rendered_cases=len(receipt["cases"]), visible_rows=rows,
                          measured_svg_points=plots, downloaded_csv_rows=csv_rows)))
else:
    count = 0
    statuses = {}
    for line in sys.stdin:
        model = json.loads(line)
        check_model(model)
        count += 1
        statuses[model["kind"]] = statuses.get(model["kind"], 0) + 1
    print(json.dumps(dict(model_cases=count, statuses=statuses, oracle="source fixture and rotating-arm angle bisection")))
