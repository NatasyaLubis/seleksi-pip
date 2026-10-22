const solver = require('javascript-lp-solver');

// Let's test a simple 3 criteria BWM
// Best = C1, Worst = C3
// aB = [1, 2, 4] -> a11=1, a12=2, a13=4
// aW = [4, 2, 1] -> a13=4, a23=2, a33=1

function solveBWM(criteriaCodes, bestCode, worstCode, aB, aW) {
  // Model formulation:
  // min: xi
  // constraints:
  // for each j:
  //   wB - aBj * wj - xi <= 0
  //   -wB + aBj * wj - xi <= 0
  //   wj - ajW * wW - xi <= 0
  //   -wj + ajW * wW - xi <= 0
  // sum(wj) = 1 (we can represent as sum(wj) >= 0.999999 and sum(wj) <= 1.000001)

  const constraints = {
    sum_equal_1_max: { max: 1 },
    sum_equal_1_min: { min: 1 }
  };

  const variables = {
    xi: { obj: 1 }
  };

  criteriaCodes.forEach(code => {
    variables[code] = {
      obj: 0,
      sum_equal_1_max: 1,
      sum_equal_1_min: 1
    };
  });

  let cIdx = 0;
  criteriaCodes.forEach(jCode => {
    const abj = aB[jCode];
    const ajw = aW[jCode];

    // 1) wB - aBj*wj - xi <= 0
    const c1 = `c_${cIdx++}`;
    constraints[c1] = { max: 0 };
    variables.xi[c1] = -1;
    variables[bestCode][c1] = (variables[bestCode][c1] || 0) + 1;
    variables[jCode][c1] = (variables[jCode][c1] || 0) - abj;

    // 2) -wB + aBj*wj - xi <= 0
    const c2 = `c_${cIdx++}`;
    constraints[c2] = { max: 0 };
    variables.xi[c2] = -1;
    variables[bestCode][c2] = (variables[bestCode][c2] || 0) - 1;
    variables[jCode][c2] = (variables[jCode][c2] || 0) + abj;

    // 3) wj - ajW*wW - xi <= 0
    const c3 = `c_${cIdx++}`;
    constraints[c3] = { max: 0 };
    variables.xi[c3] = -1;
    variables[jCode][c3] = (variables[jCode][c3] || 0) + 1;
    variables[worstCode][c3] = (variables[worstCode][c3] || 0) - ajw;

    // 4) -wj + ajW*wW - xi <= 0
    const c4 = `c_${cIdx++}`;
    constraints[c4] = { max: 0 };
    variables.xi[c4] = -1;
    variables[jCode][c4] = (variables[jCode][c4] || 0) - 1;
    variables[worstCode][c4] = (variables[worstCode][c4] || 0) + ajw;
  });

  const model = {
    optimize: 'xi',
    opType: 'min',
    constraints,
    variables
  };

  const results = solver.Solve(model);
  console.log('Solver results:', results);
  return results;
}

const codes = ['C1', 'C2', 'C3'];
const res = solveBWM(codes, 'C1', 'C3', { C1: 1, C2: 2, C3: 4 }, { C1: 4, C2: 2, C3: 1 });
console.log('Result check:', res);
