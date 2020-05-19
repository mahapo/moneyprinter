export class ZoneRecovery {
  static calcSteps(count: number, ratio: number) {
    return [...Array(count)].map((_, i) => ZoneRecovery.calcStep(i, ratio));
  }
  
  // TODO: Better implementation
  static calcStep(index: number, ratio: number, breakevent: boolean = false): number {
    if(ratio < 2 || ratio > 7) return [] // Currenty not possible
    return [...Array(index)].reduce(
      (step, _, i) => {
        if (i != 0) {
          do {
            step.factor = step.factor + 0.5;
            //@ts-ignore
            step.profit = parseFloat((step.factor * (ratio - 1)).toFixed(4));
            step.profitTotal = step.profit - step.total;
          } while (step.profitTotal < (breakevent ? 0 : ratio - 1));
        } else {
          step.factor += 1;
          step.profit = step.factor * (ratio - 1);
          step.profitTotal = step.profit - step.total;
        }
        step.total += step.factor;
        return step;
      },
      {
        factor: 1,
        total: 1,
        profit: ratio - 1,
        profitTotal: ratio - 1,
      }
    );
  }
}
